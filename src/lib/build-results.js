const unique = (values) => values.filter((v, i, a) => a.indexOf(v) === i);

/**
 * Shape raw scanner output into the results object used by the results page and the MCP tool.
 */
export function buildResults(scanData, url) {
    const primaryContainer = scanData.gtmInfo?.containers?.[0];
    const containerStats = scanData.tagstackInfo?.containerStats?.[primaryContainer];
    const detectedIds = scanData.tagstackInfo?.detectedIds;
    const pixelInfo = scanData.pixelInfo;

    return {
        url: url,
        scannedAt: new Date().toISOString(),
        pageInfo: scanData.pageInfo || null,
        cookieInfo: scanData.cookieInfo || null,
        performance: scanData.performance || null,
        gtmInfo: scanData.gtmInfo || null,
        tagstackInfo: scanData.tagstackInfo || null,
        jsonLdInfo: scanData.jsonLdInfo || null,
        dataLayer: scanData.dataLayer || null,
        consentModeV2: scanData.tagstackInfo?.consentModeV2 ?? scanData.consentModeV2 ?? false,
        serverSideTracking: scanData.serverSideTrackingPlatform ? true : (scanData.tagstackInfo?.serverSideTracking ?? scanData.serverSideTracking ?? false),
        serverSideTrackingPlatform: scanData.serverSideTrackingPlatform || null,
        serverSideTrackingPlatforms: scanData.serverSideTrackingPlatforms || [],
        marketingScripts: {
            gtm: {
                found: scanData.gtmInfo?.found || false,
                containerId: primaryContainer || null,
                containers: scanData.gtmInfo?.containers || [],
                count: scanData.gtmInfo?.count || 0,
                version: scanData.gtmInfo?.found ? "v2" : null,
                lastUpdated: null,
                tags: containerStats?.tags || null,
                activeTags: containerStats?.activeTags || null,
                pausedTags: containerStats?.pausedTags || null,
                variables: containerStats?.variables || null,
                triggers: containerStats?.triggers || null
            },
            ga4: {
                found: (detectedIds?.ga4?.length || 0) > 0,
                measurementId: detectedIds?.ga4?.[0] || null,
                measurementIds: detectedIds?.ga4 || [],
                enhancedEcommerce: scanData.tagstackInfo?.ga4Streams?.some(s => s.enhancedMeasurement?.length > 0) || false,
                crossDomainTracking: false,
                streams: scanData.tagstackInfo?.ga4Streams || []
            },
            meta: {
                found: (pixelInfo?.meta?.found || detectedIds?.facebookPixel?.length || 0) > 0,
                pixelId: pixelInfo?.meta?.pixelId || detectedIds?.facebookPixel?.[0] || null,
                pixelIds: unique([
                    ...(pixelInfo?.meta?.pixelIds || []),
                    ...(detectedIds?.facebookPixel || [])
                ]),
                conversionsApi: false,
                customAudiences: false
            },
            tiktok: {
                found: (pixelInfo?.tiktok?.found || detectedIds?.tiktokPixel?.length || 0) > 0,
                pixelId: pixelInfo?.tiktok?.pixelId || detectedIds?.tiktokPixel?.[0] || null,
                pixelIds: unique([
                    ...(pixelInfo?.tiktok?.pixelIds || []),
                    ...(detectedIds?.tiktokPixel || [])
                ])
            },
            linkedin: {
                found: (pixelInfo?.linkedin?.found || detectedIds?.linkedinPixel?.length || 0) > 0,
                pixelId: pixelInfo?.linkedin?.pixelId || detectedIds?.linkedinPixel?.[0] || null,
                pixelIds: unique([
                    ...(pixelInfo?.linkedin?.pixelIds || []),
                    ...(detectedIds?.linkedinPixel || [])
                ])
            },
            googleAds: {
                found: (pixelInfo?.googleAds?.found || detectedIds?.googleAds?.length || 0) > 0,
                conversionId: pixelInfo?.googleAds?.conversionId || detectedIds?.googleAds?.[0] || null,
                conversionIds: unique([
                    ...(pixelInfo?.googleAds?.conversionIds || []),
                    ...(detectedIds?.googleAds || [])
                ]),
                remarketing: false
            },
            platforms: {
                reaktion: {
                    found: pixelInfo?.platforms?.reaktion?.found || false,
                    methods: pixelInfo?.platforms?.reaktion?.methods || []
                },
                profitmetrics: {
                    found: pixelInfo?.platforms?.profitmetrics?.found || false,
                    methods: pixelInfo?.platforms?.profitmetrics?.methods || []
                },
                triplewhale: {
                    found: pixelInfo?.platforms?.triplewhale?.found || false,
                    methods: pixelInfo?.platforms?.triplewhale?.methods || []
                }
            }
        },
        scores: {
            privacy: 85,
            performance: scanData.performance?.performanceScore || 78,
            tracking: 92,
            compliance: 88
        }
    };
}
