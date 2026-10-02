/**
 * Condense a full results object into what an LLM needs: scores, detections and issues.
 * The raw dataLayer, tag lists and JSON-LD bodies are left out to keep the response small.
 */
export function buildScanSummary(results, scores) {
    const scripts = results.marketingScripts || {};
    const platforms = scripts.platforms || {};
    const cmp = results.cookieInfo?.cmp || null;
    const perf = results.performance || null;
    const jsonLd = results.jsonLdInfo || null;

    const detectedPlatforms = Object.entries(platforms)
        .filter(([, value]) => value?.found)
        .map(([name]) => name);

    const pixels = {
        ga4: scripts.ga4?.found ? (scripts.ga4.measurementIds?.length ? scripts.ga4.measurementIds : true) : false,
        meta: scripts.meta?.found ? (scripts.meta.pixelIds?.length ? scripts.meta.pixelIds : true) : false,
        tiktok: scripts.tiktok?.found ? (scripts.tiktok.pixelIds?.length ? scripts.tiktok.pixelIds : true) : false,
        linkedin: scripts.linkedin?.found ? (scripts.linkedin.pixelIds?.length ? scripts.linkedin.pixelIds : true) : false,
        googleAds: scripts.googleAds?.found ? (scripts.googleAds.conversionIds?.length ? scripts.googleAds.conversionIds : true) : false,
    };

    return {
        url: results.url,
        scannedAt: results.scannedAt,
        scores: {
            overall: scores.overall,
            performance: Math.round(scores.performance),
            privacy: Math.round(scores.privacy),
            tracking: Math.round(scores.tracking),
            compliance: Math.round(scores.compliance),
        },
        tracking: {
            gtm: {
                found: scripts.gtm?.found || false,
                containers: scripts.gtm?.containers || [],
                tags: scripts.gtm?.tags,
                activeTags: scripts.gtm?.activeTags,
                pausedTags: scripts.gtm?.pausedTags,
                variables: scripts.gtm?.variables,
                triggers: scripts.gtm?.triggers,
            },
            pixels,
            advancedPlatforms: detectedPlatforms,
            serverSideTracking: results.serverSideTracking || false,
            serverSideTrackingPlatform: results.serverSideTrackingPlatform || null,
        },
        privacy: {
            cmp: cmp ? { name: cmp.name || null, confidence: cmp.confidence || null } : null,
            consentModeV2: results.consentModeV2 || false,
            consentDefaults: results.tagstackInfo?.consentDefaults || null,
            cookiesAccepted: results.cookieInfo?.accepted ?? null,
            cookieCount: results.cookieInfo?.cookies?.count ?? null,
        },
        performance: perf ? {
            score: perf.performanceScore,
            lcpMs: perf.largestContentfulPaint,
            fcpMs: perf.firstContentfulPaint,
            cls: Math.round((perf.cumulativeLayoutShift || 0) * 1000) / 1000,
            tbtMs: perf.totalBlockingTime,
            ttfbMs: perf.timeToFirstByte,
        } : null,
        structuredData: jsonLd?.found ? {
            schemas: jsonLd.schemas?.length || 0,
            types: jsonLd.types || [],
            errors: jsonLd.errors?.length || 0,
        } : null,
        issues: findIssues({ scripts, detectedPlatforms, cmp, perf, jsonLd, results }),
    };
}

function findIssues({ scripts, detectedPlatforms, cmp, perf, jsonLd, results }) {
    const issues = [];
    const hasPlatform = detectedPlatforms.length > 0;

    if (!cmp?.name) issues.push('No consent management platform (CMP) detected');
    if (!results.consentModeV2) issues.push('Google Consent Mode V2 is not enabled');
    if (!scripts.gtm?.found && !hasPlatform) issues.push('No Google Tag Manager container found');
    if (!scripts.ga4?.found && !hasPlatform) issues.push('No GA4 measurement ID detected');
    if (!results.serverSideTracking && !hasPlatform) issues.push('No server-side tracking detected');
    if (scripts.gtm?.pausedTags > 0) issues.push(`${scripts.gtm.pausedTags} paused tag(s) in the GTM container`);

    const pixelCount = ['meta', 'tiktok', 'linkedin', 'googleAds'].filter(k => scripts[k]?.found).length;
    if (pixelCount === 0 && !hasPlatform) issues.push('No marketing pixels detected (Meta, TikTok, LinkedIn, Google Ads)');

    if (!perf) {
        issues.push('PageSpeed data unavailable');
    } else {
        if (perf.performanceScore < 50) issues.push(`Low PageSpeed performance score (${perf.performanceScore})`);
        if (perf.largestContentfulPaint > 2500) issues.push(`LCP is ${perf.largestContentfulPaint} ms (target under 2500 ms)`);
        if (perf.cumulativeLayoutShift > 0.1) issues.push(`CLS is ${perf.cumulativeLayoutShift.toFixed(2)} (target under 0.1)`);
        if (perf.totalBlockingTime > 200) issues.push(`Total blocking time is ${perf.totalBlockingTime} ms (target under 200 ms)`);
    }

    if (!jsonLd?.found) issues.push('No JSON-LD structured data found');
    else if (jsonLd.errors?.length) issues.push(`${jsonLd.errors.length} JSON-LD parsing error(s)`);

    return issues;
}
