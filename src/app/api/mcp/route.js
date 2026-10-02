import { timingSafeEqual } from 'node:crypto';
import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { z } from 'zod';
import mongoose from 'mongoose';
import { executeInitialScan } from '@/lib/scanner';
import { buildResults } from '@/lib/build-results';
import { assertPublicUrl } from '@/lib/mcp/url-guard';
import { buildScanSummary } from '@/lib/mcp/scan-summary';
import { getSetupOverview, getSetupDetails } from '@/lib/reference-setups';
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

        server.registerTool(
            'list_reference_setups',
            {
                title: 'List Searchmind reference GTM setups',
                description:
                    'Lists the reference GTM web and server (sGTM) container setups Searchmind uses as best practice, ' +
                    'with the platforms each container covers and the ruleset prefix (e.g. STP) used in the audit ruleset.',
                inputSchema: z.object({}),
            },
            async () => ({
                content: [{ type: 'text', text: JSON.stringify(getSetupOverview(), null, 2) }],
            })
        );

        server.registerTool(
            'get_reference_setup',
            {
                title: 'Get a reference GTM setup',
                description:
                    'Returns a readable digest of a reference GTM setup: tags (platform, event, triggers, consent), ' +
                    'triggers with their conditions, variables, server clients and transformations, plus an event matrix ' +
                    'showing which platform events fire on each trigger. Filter by platform to keep the response small, ' +
                    'and set includeParameters to see exact tag settings such as event_id deduplication or user data fields.',
                inputSchema: z.object({
                    setupId: z.string().describe('Setup id from list_reference_setups, e.g. stape-ecom-cmp'),
                    container: z.enum(['web', 'server']).optional().describe('Only the web or the server container. Omit for both.'),
                    platform: z
                        .string()
                        .optional()
                        .describe('Only one platform, e.g. meta, ga4, google_ads, tiktok, snapchat, pinterest, linkedin, reddit, klaviyo, microsoft_ads, data_tag, consent'),
                    includeParameters: z
                        .boolean()
                        .optional()
                        .describe('Include each tag\'s full settings. Use together with platform.'),
                }),
            },
            async ({ setupId, container, platform, includeParameters }) => {
                try {
                    const details = getSetupDetails(setupId, { container, platform, includeParameters });
                    return { content: [{ type: 'text', text: JSON.stringify(details, null, 2) }] };
                } catch (error) {
                    return errorResult(error.message);
                }
            }
        );
    },
    {
        serverInfo: { name: 'omnipixel', version: '2.1.0' },
        instructions:
            'Omnipixel scans websites for marketing tracking, consent and performance, and holds Searchmind reference GTM/sGTM setups. ' +
            'Call scan_website with a full URL. Scores are 0-100, higher is better. ' +
            'Before recommending a tracking setup, call list_reference_setups and get_reference_setup (filtered by platform) ' +
            'and base recommendations on the reference.',
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
