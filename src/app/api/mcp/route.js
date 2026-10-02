import { timingSafeEqual } from 'node:crypto';
import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { z } from 'zod';
import mongoose from 'mongoose';
import { executeInitialScan } from '@/lib/scanner';
import { buildResults } from '@/lib/build-results';
import { assertPublicUrl } from '@/lib/mcp/url-guard';
import { buildScanSummary } from '@/lib/mcp/scan-summary';
import { getSetupOverview, getSetupDetails } from '@/lib/reference-setups';
import { getLiveContainer, crossCheckScanIds } from '@/lib/live-container';
import { calculateScores } from '@/app/results/utils/score-calculator';
import connectDB from '@/lib/mongodb';
import CustomerTrackingScanScores from '@/models/CustomerTrackingScanScores';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Each scan launches its own Chromium instance, so cap parallel scans to protect the container's memory.
const MAX_CONCURRENT_SCANS = Number(process.env.OMNIPIXEL_MCP_MAX_SCANS) || 2;
const SCAN_CACHE_TTL_MS = 30 * 60 * 1000;
let activeScans = 0;
const scanCache = new Map();

const errorResult = (message) => ({
    isError: true,
    content: [{ type: 'text', text: message }],
});

const jsonResult = (value) => ({
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
});

async function runScan(targetUrl, { reuse = false } = {}) {
    const cached = scanCache.get(targetUrl);
    if (reuse && cached && Date.now() - cached.at < SCAN_CACHE_TTL_MS) return cached;

    if (activeScans >= MAX_CONCURRENT_SCANS) {
        throw new Error(`Omnipixel is already running ${activeScans} scan(s). Try again in a minute.`);
    }
    activeScans++;
    try {
        const scanData = await executeInitialScan(targetUrl);
        if (!scanData.success) throw new Error(`Scan failed: ${scanData.error || 'unknown error'}`);

        const results = buildResults(scanData, targetUrl);
        const scores = calculateScores(results);
        const entry = { at: Date.now(), results, scores, summary: buildScanSummary(results, scores) };
        scanCache.set(targetUrl, entry);
        return entry;
    } finally {
        activeScans--;
    }
}

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

                try {
                    const { scores, summary: cachedSummary } = await runScan(targetUrl);
                    const summary = { ...cachedSummary };

                    if (customerId) {
                        try {
                            await saveScores(customerId, scores);
                            summary.savedToCustomer = customerId;
                        } catch (error) {
                            console.error('MCP: failed to save scores:', error);
                            summary.saveError = error.message;
                        }
                    }

                    return jsonResult(summary);
                } catch (error) {
                    console.error('MCP scan error:', error);
                    return errorResult(error.message.startsWith('Scan failed') || error.message.startsWith('Omnipixel') ? error.message : `Scan failed: ${error.message}`);
                }
            }
        );

        server.registerTool(
            'get_live_container',
            {
                title: 'Get the live published GTM web container',
                description:
                    'Fetches the published GTM web container (gtm.js) and returns a digest in the same shape as get_reference_setup, ' +
                    'so it can be diffed 1:1: eventMatrix keyed by dataLayer event, tags (type, platform, event, firesOn, consent, ' +
                    'blockedBy, paused, pixel/measurement ids), triggers, variables, Custom HTML summaries, server container URLs, ' +
                    'and secretsExposed (credentials published in the container). Pass url to use the containers found by a scan ' +
                    '(reuses a scan from the last 30 minutes, else runs one) plus a cross-check of pixel IDs seen in the scan but ' +
                    'missing from the containers. gtm.js has no tag/trigger/variable names and no server container. ' +
                    'Large containers return an overview; use platform to get per-tag detail and includeParameters for exact settings ' +
                    '(event ID mapping, user data fields, value/currency/transaction_id, test codes).',
                inputSchema: z.object({
                    url: z.string().optional().describe('Website URL. The containers found by the scan are fetched.'),
                    containerId: z.string().optional().describe('GTM web container ID, e.g. GTM-WP9Q2FZV. Use instead of url.'),
                    platform: z
                        .string()
                        .optional()
                        .describe('Only one platform, same names as get_reference_setup: meta, ga4, google_ads, tiktok, snapchat, pinterest, linkedin, microsoft_ads, data_tag, consent, custom_html ...'),
                    includeParameters: z.boolean().optional().describe('Include each tag\'s settings. Use together with platform.'),
                }),
            },
            async ({ url, containerId, platform, includeParameters }) => {
                if (!url && !containerId) return errorResult('Provide url or containerId.');

                let scan = null;
                let containerIds = containerId ? [containerId] : [];
                if (url) {
                    try {
                        const targetUrl = await assertPublicUrl(url);
                        scan = await runScan(targetUrl, { reuse: true });
                    } catch (error) {
                        return errorResult(error.message);
                    }
                    if (!containerId) containerIds = scan.summary.tracking.gtm.containers;
                }

                const scanContext = scan ? {
                    url: scan.summary.url,
                    scannedAt: scan.summary.scannedAt,
                    scanPixels: scan.summary.tracking.pixels,
                } : {};

                if (!containerIds.length) {
                    return jsonResult({
                        ...scanContext,
                        containers: {},
                        note: 'The scan found no GTM web container on this page. Pixels seen in the scan are loaded by hard-coded code, a shop app or gtag.js.',
                    });
                }

                const containers = {};
                const errors = {};
                for (const id of containerIds) {
                    try {
                        containers[id] = await getLiveContainer(id, { platform, includeParameters });
                    } catch (error) {
                        errors[id] = error.message;
                    }
                }
                if (!Object.keys(containers).length && !scan) return errorResult(Object.values(errors).join('\n'));

                const result = { ...scanContext, containers };
                if (Object.keys(errors).length) result.errors = errors;
                if (scan) {
                    result.scanIdsNotInContainers = await crossCheckScanIds(containerIds, scan.summary.tracking.pixels);
                }
                return jsonResult(result);
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
                    'Returns a readable digest of a reference GTM setup: tags (platform, event, firesOn trigger names, firesOnEvents, consent), ' +
                    'triggers with their conditions, variables, server clients and transformations, plus an event matrix ' +
                    'showing which platform events fire on each dataLayer event (same keys as get_live_container). Filter by platform to keep the response small, ' +
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
        serverInfo: { name: 'omnipixel', version: '2.2.0' },
        instructions:
            'Omnipixel scans websites for marketing tracking, consent and performance, reads published GTM web containers, ' +
            'and holds Searchmind reference GTM/sGTM setups. Call scan_website with a full URL, then get_live_container with the same url ' +
            'to see how the live container is built, then get_reference_setup with the same platform filter to diff against best practice. ' +
            'Live and reference digests share one shape; eventMatrix is keyed by dataLayer event in both.',
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
