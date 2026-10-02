import { timingSafeEqual } from 'node:crypto';
import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { z } from 'zod';
import mongoose from 'mongoose';
import { executeInitialScan } from '@/lib/scanner';
import { buildResults } from '@/lib/build-results';
import { assertPublicUrl } from '@/lib/mcp/url-guard';
import { buildScanSummary } from '@/lib/mcp/scan-summary';
import { calculateScores } from '@/app/results/utils/score-calculator';
import connectDB from '@/lib/mongodb';
import CustomerTrackingScanScores from '@/models/CustomerTrackingScanScores';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Each scan launches its own Chromium instance, so cap parallel scans to protect the container's memory.
const MAX_CONCURRENT_SCANS = Number(process.env.OMNIPIXEL_MCP_MAX_SCANS) || 2;
let activeScans = 0;

const errorResult = (message) => ({
    isError: true,
    content: [{ type: 'text', text: message }],
});

async function saveScores(customerId, scores) {
    await connectDB();
    await CustomerTrackingScanScores.create({
        customer: new mongoose.Types.ObjectId(customerId),
        totalScore: scores.overall || 0,
        performanceScore: scores.performance || 0,
        trackingScore: scores.tracking || 0,
        complianceScore: scores.compliance || 0,
    });
}

const handler = createMcpHandler(
    (server) => {
        server.registerTool(
            'scan_website',
            {
                title: 'Scan website with Omnipixel',
                description:
                    'Runs a full Omnipixel tracking scan of a public website in a headless browser. ' +
                    'Returns performance, privacy, tracking and compliance scores (0-100), detected GTM containers, ' +
                    'marketing pixels (GA4, Meta, TikTok, LinkedIn, Google Ads), server-side tracking platforms, ' +
                    'CMP and Consent Mode V2 status, Core Web Vitals, JSON-LD structured data and a list of issues. ' +
                    'A scan typically takes 30-90 seconds.',
                inputSchema: z.object({
                    url: z.string().describe('Full URL to scan, including https://, e.g. https://pompdelux.dk'),
                    customerId: z
                        .string()
                        .optional()
                        .describe('Optional Apex customer ObjectId. When set, the scores are saved to the customer in MongoDB.'),
                }),
            },
            async ({ url, customerId }) => {
                let targetUrl;
                try {
                    targetUrl = await assertPublicUrl(url);
                } catch (error) {
                    return errorResult(error.message);
                }

                if (customerId && !mongoose.Types.ObjectId.isValid(customerId)) {
                    return errorResult(`Invalid customerId: ${customerId}`);
                }

                if (activeScans >= MAX_CONCURRENT_SCANS) {
                    return errorResult(`Omnipixel is already running ${activeScans} scan(s). Try again in a minute.`);
                }

                activeScans++;
                try {
                    const scanData = await executeInitialScan(targetUrl);
                    if (!scanData.success) {
                        return errorResult(`Scan failed: ${scanData.error || 'unknown error'}`);
                    }

                    const results = buildResults(scanData, targetUrl);
                    const scores = calculateScores(results);
                    const summary = buildScanSummary(results, scores);

                    if (customerId) {
                        try {
                            await saveScores(customerId, scores);
                            summary.savedToCustomer = customerId;
                        } catch (error) {
                            console.error('MCP: failed to save scores:', error);
                            summary.saveError = error.message;
                        }
                    }

                    return {
                        content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
                    };
                } catch (error) {
                    console.error('MCP scan error:', error);
                    return errorResult(`Scan failed: ${error.message}`);
                } finally {
                    activeScans--;
                }
            }
        );
    },
    {
        serverInfo: { name: 'omnipixel', version: '2.0.0' },
        instructions:
            'Omnipixel scans websites for marketing tracking, consent and performance. ' +
            'Call scan_website with a full URL. Scores are 0-100, higher is better.',
    }
);

function verifyToken(_req, bearerToken) {
    const expected = process.env.OMNIPIXEL_MCP_KEY;
    if (!expected || !bearerToken) return undefined;

    const given = Buffer.from(bearerToken);
    const wanted = Buffer.from(expected);
    if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return undefined;

    return { token: bearerToken, clientId: 'omnipixel-mcp-client', scopes: [] };
}

const authHandler = withMcpAuth(handler, verifyToken, { required: true });

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
