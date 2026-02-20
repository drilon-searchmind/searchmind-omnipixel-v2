/**
 * Calculate scores for scan results
 * @param {Object} results - Scan results object
 * @returns {Object|null} - Calculated scores or null if results invalid
 */
export function calculateScores(results) {
    if (!results) return null;
    
    // Start with base scores from results (but tracking will be recalculated from scratch)
    let performanceScore = results.scores?.performance || 0;
    let privacyScore = results.scores?.privacy || 0;
    // trackingScore will be calculated from scratch, ignore initial value
    let trackingScore = 0;
    let complianceScore = results.scores?.compliance || 0;

    // Adjust performance score based on actual performance metrics
    if (results.performance?.performanceScore !== undefined) {
        // Use actual PageSpeed Insights score if available
        performanceScore = results.performance.performanceScore;
    }

    // Calculate Privacy Score from scratch - BE MORE CRITICAL
    // Based on 2026 privacy standards (GDPR, CCPA, ePrivacy)
    privacyScore = 0; // Start from 0

    const cookieInfo = results.cookieInfo || {};
    const cmp = cookieInfo.cmp || {};
    const cookies = cookieInfo.cookies || {};

    // 1. CMP Implementation Quality (30 points)
    if (cmp.confidence === 'high') {
        privacyScore += 30; // High-confidence CMP (CookieInformation, OneTrust, Cookiebot, etc.)
    } else if (cmp.confidence === 'low' || cmp.name) {
        privacyScore += 15; // Low-confidence or generic CMP
    } else {
        privacyScore += 0; // No CMP detected - major privacy concern
    }

    // 2. Consent Mode V2 Implementation (25 points) - CRITICAL for privacy
    if (results.consentModeV2) {
        privacyScore += 25; // Strong bonus for Consent Mode V2
    } else {
        privacyScore -= 10; // Penalty for missing Consent Mode V2
    }

    // 3. Cookie Transparency & Disclosure (20 points)
    if (cookies.count !== undefined && cookies.count > 0) {
        privacyScore += 10; // Cookie count is disclosed
    }
    if (cookies.keys && cookies.keys.length > 0) {
        privacyScore += 5; // Cookie names are accessible
    }
    if (cookies.domains && cookies.domains > 1) {
        // Multiple domains can indicate third-party tracking
        if (cookies.domains <= 3) {
            privacyScore += 5; // Reasonable number of domains
        } else {
            privacyScore -= 5; // Too many domains (privacy concern)
        }
    }

    // 4. Cookie Management & User Control (15 points)
    if (cookieInfo.accepted && cmp.name) {
        // If CMP is detected, assume granular controls exist
        if (cmp.confidence === 'high') {
            privacyScore += 15; // High-confidence CMPs typically have granular controls
        } else {
            privacyScore += 5; // Basic controls assumed
        }
    } else if (cookieInfo.accepted && !cmp.name) {
        privacyScore += 0; // No CMP means no proper controls
    }

    // 5. Data Minimization (10 points)
    const cookieCount = cookies.count || 0;
    if (cookieCount === 0) {
        privacyScore += 0; // No cookies (but also no functionality)
    } else if (cookieCount <= 10) {
        privacyScore += 10; // Minimal cookies (good privacy practice)
    } else if (cookieCount <= 20) {
        privacyScore += 5; // Reasonable amount
    } else if (cookieCount <= 50) {
        privacyScore += 0; // Moderate amount
    } else {
        privacyScore -= 10; // Excessive cookies (privacy concern)
    }

    // Calculate tracking score - STRUCTURED APPROACH (Max 100 points)
    trackingScore = 0; // Start from 0

    const marketingScripts = results.marketingScripts || {};
    const platforms = marketingScripts.platforms || {};
    const hasReaktion = platforms.reaktion?.found || false;
    const hasProfitmetrics = platforms.profitmetrics?.found || false;
    const hasTriplewhale = platforms.triplewhale?.found || false;
    const platformCount = [hasReaktion, hasProfitmetrics, hasTriplewhale].filter(Boolean).length;

    const scoreBreakdown = {
        gtm: 0,
        consentModeV2: 0,
        serverSideTracking: 0,
        platforms: 0,
        ga4: 0,
        pixels: 0,
        tagQuality: 0
    };

    // Category 1: Advanced Analytics Platforms (25 points max - HIGHEST PRIORITY)
    if (platformCount > 0) {
        if (platformCount === 1) {
            scoreBreakdown.platforms = 25;
        } else if (platformCount === 2) {
            scoreBreakdown.platforms = 30;
        } else if (platformCount === 3) {
            scoreBreakdown.platforms = 35;
        }
        trackingScore += scoreBreakdown.platforms;
    }
    // Category 1.5: GTM Implementation (only if no platforms detected)
    else if (results.gtmInfo?.found) {
        scoreBreakdown.gtm = 25;
        trackingScore += 25;

        // Additional quality points from Tagstack analysis (up to 5 points)
        if (results.tagstackInfo) {
            const containerStats = results.tagstackInfo.containerStats;
            const primaryContainer = results.gtmInfo.containers?.[0];

            if (containerStats?.[primaryContainer]) {
                const stats = containerStats[primaryContainer];
                if (stats.tags > 0 && stats.activeTags > 0) {
                    const activeRatio = stats.activeTags / stats.tags;
                    const qualityBonus = Math.min(5, Math.round(activeRatio * 5));
                    scoreBreakdown.tagQuality = qualityBonus;
                    trackingScore += qualityBonus;
                }
                if (stats.pausedTags > 0 && stats.tags > 0) {
                    const pausedRatio = stats.pausedTags / stats.tags;
                    const qualityPenalty = Math.min(scoreBreakdown.tagQuality, Math.round(pausedRatio * 5));
                    scoreBreakdown.tagQuality -= qualityPenalty;
                    trackingScore -= qualityPenalty;
                }
            }
        }
    }

    // Category 2: Consent Mode V2 (25 points max) - CRITICAL
    const consentModeV2Enabled = results.consentModeV2 ?? results.tagstackInfo?.consentModeV2 ?? false;
    if (consentModeV2Enabled) {
        scoreBreakdown.consentModeV2 = 25;
        trackingScore += 25;
    }

    // Category 3: Server-side Tracking (15 points max - only if no platforms detected)
    if (results.serverSideTracking && platformCount === 0) {
        scoreBreakdown.serverSideTracking = 15;
        trackingScore += 15;
    }

    // Category 4: GA4 Implementation (10 points max)
    if (platformCount > 0 || marketingScripts.ga4?.found) {
        scoreBreakdown.ga4 = 10;
        trackingScore += 10;
    }

    // Category 5: Marketing Pixels (20 points max - combined check)
    const pixelsFound = [
        marketingScripts.meta?.found,
        marketingScripts.tiktok?.found,
        marketingScripts.linkedin?.found,
        marketingScripts.googleAds?.found
    ].filter(Boolean).length;

    if (platformCount > 0) {
        scoreBreakdown.pixels = 20;
        trackingScore += 20;
    } else {
        if (pixelsFound === 4) {
            scoreBreakdown.pixels = 20;
            trackingScore += 20;
        } else if (pixelsFound === 3) {
            scoreBreakdown.pixels = 15;
            trackingScore += 15;
        } else if (pixelsFound === 2) {
            scoreBreakdown.pixels = 10;
            trackingScore += 10;
        } else if (pixelsFound === 1) {
            scoreBreakdown.pixels = 5;
            trackingScore += 5;
        }
    }

    // Calculate Compliance Score from scratch - BE MORE CRITICAL
    complianceScore = 0; // Start from 0

    const complianceCookieInfo = results.cookieInfo || {};
    const complianceCmp = complianceCookieInfo.cmp || {};
    const tagstackInfo = results.tagstackInfo || {};

    // 1. Legal Framework Compliance (40 points)
    if (results.consentModeV2) {
        complianceScore += 20;
    } else {
        complianceScore -= 15;
    }

    if (complianceCmp.confidence === 'high') {
        complianceScore += 20;
    } else if (complianceCmp.confidence === 'low' || complianceCmp.name) {
        complianceScore += 10;
    } else {
        complianceScore -= 20;
    }

    // 2. Cookie Consent Quality & Implementation (30 points)
    if (complianceCmp.confidence === 'high') {
        complianceScore += 30;
    } else if (complianceCmp.confidence === 'low') {
        complianceScore += 15;
    } else if (complianceCookieInfo.accepted && !complianceCmp.name) {
        complianceScore += 5;
    } else {
        complianceScore -= 20;
    }

    // 3. Data Processing Transparency (20 points)
    if (complianceCmp.confidence === 'high') {
        complianceScore += 20;
    } else if (complianceCmp.name) {
        complianceScore += 10;
    }

    // 4. Technical Implementation Quality (10 points)
    if (results.serverSideTracking) {
        complianceScore += 10;
    }

    // Additional compliance factors from Tagstack
    if (tagstackInfo.consentModeV2 && !results.consentModeV2) {
        complianceScore += 5;
    }

    if (tagstackInfo.consentDefaults) {
        const defaults = tagstackInfo.consentDefaults;
        const deniedCount = Object.values(defaults).filter(v => v === 'denied').length;
        if (deniedCount >= 4) {
            complianceScore += 5;
        }
    }

    // Clamp all scores between 0-100
    performanceScore = Math.max(0, Math.min(100, performanceScore));
    privacyScore = Math.max(0, Math.min(100, privacyScore));
    trackingScore = Math.max(0, Math.min(100, trackingScore));
    complianceScore = Math.max(0, Math.min(100, complianceScore));

    // Calculate overall score as simple average of the 4 scores
    const overallScore = Math.round(
        (performanceScore + privacyScore + trackingScore + complianceScore) / 4
    );

    return {
        performance: performanceScore,
        privacy: privacyScore,
        tracking: trackingScore,
        compliance: complianceScore,
        overall: Math.max(0, Math.min(100, overallScore))
    };
}
