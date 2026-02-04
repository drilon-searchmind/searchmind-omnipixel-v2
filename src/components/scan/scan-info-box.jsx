"use client";

export default function ScanInfoBox({ currentStep, scanData = {} }) {
    const getInfoForStep = () => {
        switch (currentStep) {
            case 1:
                return {
                    title: "Scanner Initialization",
                    items: [
                        { label: "Status", value: scanData.scannerInitialized ? "Initialized" : "Initializing..." },
                        { label: "Platform", value: scanData.platform || "Detecting..." },
                    ]
                };
            
            case 2:
                return {
                    title: "Navigation",
                    items: [
                        { label: "Status", value: scanData.navigationSuccess ? "Success" : scanData.navigationSuccess === false ? "Failed" : "Navigating..." },
                        { label: "URL", value: scanData.url || scanData.pageInfo?.url || "Loading..." },
                    ]
                };
            
            case 3:
                return scanData.pageInfo ? {
                    title: "Page Information",
                    items: [
                        { label: "Title", value: scanData.pageInfo.title || "Loading..." },
                        { label: "URL", value: scanData.pageInfo.url || "Loading..." },
                    ]
                } : null;
            
            case 3:
                return {
                    title: "Page Load Status",
                    items: [
                        { label: "Status", value: scanData.pageLoadSuccess ? "Loaded" : scanData.pageLoadSuccess === false ? "Failed" : "Loading..." },
                        { label: "Scripts", value: scanData.pageInfo ? `${scanData.pageInfo.scripts || 0} detected` : "Loading..." },
                        { label: "Links", value: scanData.pageInfo ? `${scanData.pageInfo.links || 0} found` : "Loading..." },
                        { label: "Images", value: scanData.pageInfo ? `${scanData.pageInfo.images || 0} loaded` : "Loading..." },
                    ]
                };
            
            case 4:
                return {
                    title: "Cookie & Consent",
                    items: [
                        { label: "CMP Provider", value: scanData.cookieInfo?.cmp?.name || "Detecting..." },
                        { label: "Cookies Found", value: scanData.cookieInfo?.cookies?.count || scanData.cookieInfo?.cookies?.afterAccept || 0 },
                        { label: "Domains", value: scanData.cookieInfo?.cookies?.domains || 0 },
                        { label: "Consent Mode V2", value: scanData.cookieInfo?.cookies?.consentModeV2 ? "Enabled" : scanData.cookieInfo?.cookies?.consentModeV2 === false ? "Disabled" : "Checking..." },
                        { label: "Method", value: scanData.cookieInfo?.method || "N/A" },
                    ]
                };
            
            case 5:
                return {
                    title: "Performance Metrics",
                    items: [
                        { label: "Performance Score", value: scanData.performance ? `${scanData.performance.performanceScore || 0}/100` : "Analyzing..." },
                        { label: "LCP", value: scanData.performance ? `${scanData.performance.largestContentfulPaint || 0}ms` : "Loading..." },
                        { label: "FCP", value: scanData.performance ? `${scanData.performance.firstContentfulPaint || 0}ms` : "Loading..." },
                        { label: "CLS", value: scanData.performance ? (scanData.performance.cumulativeLayoutShift || 0).toFixed(3) : "Loading..." },
                        { label: "FID", value: scanData.performance ? `${scanData.performance.firstInputDelay || 0}ms` : "Loading..." },
                        { label: "TBT", value: scanData.performance ? `${scanData.performance.totalBlockingTime || 0}ms` : "Loading..." },
                    ]
                };
            
            case 6:
                return {
                    title: "Google Tag Manager",
                    items: [
                        { label: "Status", value: scanData.gtmInfo?.found ? "Detected" : scanData.gtmInfo?.found === false ? "Not Found" : "Scanning..." },
                        { label: "Containers", value: scanData.gtmInfo ? (scanData.gtmInfo.containers?.length || scanData.gtmInfo.count || 0) : "Scanning..." },
                        { label: "Container IDs", value: scanData.gtmInfo?.containers?.length ? scanData.gtmInfo.containers.join(", ") : scanData.gtmInfo?.found === false ? "None" : "Scanning..." },
                    ]
                };
            
            case 7:
                return {
                    title: "Tagstack Analysis",
                    items: [
                        { label: "GTM Containers", value: scanData.tagstackInfo ? (scanData.tagstackInfo.gtmContainers?.length || 0) : "Analyzing..." },
                        { label: "GA4 Streams", value: scanData.tagstackInfo ? (scanData.tagstackInfo.ga4Streams?.length || 0) : "Analyzing..." },
                        { label: "Server-Side Tracking", value: scanData.tagstackInfo?.serverSideTracking ? "Active" : scanData.tagstackInfo?.serverSideTracking === false ? "Not Detected" : "Checking..." },
                        { label: "Consent Mode V2", value: scanData.tagstackInfo?.consentModeV2 ? "Enabled" : scanData.tagstackInfo?.consentModeV2 === false ? "Disabled" : "Checking..." },
                        { label: "Tags", value: scanData.tagstackInfo?.containerStats ? Object.values(scanData.tagstackInfo.containerStats)[0]?.tags || 0 : "Analyzing..." },
                        { label: "Variables", value: scanData.tagstackInfo?.containerStats ? Object.values(scanData.tagstackInfo.containerStats)[0]?.variables || 0 : "Analyzing..." },
                    ]
                };
            
            case 8:
                return scanData.pixelInfo ? {
                    title: "Marketing Pixels",
                    items: [
                        { 
                            label: "Meta Pixel", 
                            value: scanData.pixelInfo.meta?.found 
                                ? `Found (${scanData.pixelInfo.meta.pixelIds?.join(", ") || scanData.pixelInfo.meta.pixelId || "ID: N/A"})`
                                : "Not Found" 
                        },
                        { 
                            label: "TikTok Pixel", 
                            value: scanData.pixelInfo.tiktok?.found 
                                ? `Found (${scanData.pixelInfo.tiktok.pixelIds?.join(", ") || scanData.pixelInfo.tiktok.pixelId || "ID: N/A"})`
                                : "Not Found" 
                        },
                        { 
                            label: "LinkedIn Pixel", 
                            value: scanData.pixelInfo.linkedin?.found 
                                ? `Found (${scanData.pixelInfo.linkedin.pixelIds?.join(", ") || scanData.pixelInfo.linkedin.pixelId || "ID: N/A"})`
                                : "Not Found" 
                        },
                        { 
                            label: "Google Ads", 
                            value: scanData.pixelInfo.googleAds?.found 
                                ? `Found (${scanData.pixelInfo.googleAds.conversionIds?.join(", ") || scanData.pixelInfo.googleAds.conversionId || "ID: N/A"})`
                                : "Not Found" 
                        },
                    ]
                } : null;
            
            case 9:
                return {
                    title: "Scan Complete",
                    items: [
                        { label: "Status", value: "Successfully completed" },
                        { label: "Results", value: "Preparing results page..." },
                    ]
                };
            
            default:
                return null;
        }
    };

    const info = getInfoForStep();

    // Always show info box, even if no data yet
    if (!info) {
        return (
            <div className="border border-border/40 rounded-lg bg-secondary/30 p-5">
                <h3 className="text-sm font-medium text-foreground mb-4">Scan Status</h3>
                <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                        <span className="text-xs text-foreground/60 font-light flex-shrink-0">
                            Status:
                        </span>
                        <span className="text-xs text-foreground font-mono text-right flex-1">
                            Initializing...
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="border border-border/40 rounded-lg bg-secondary/30 p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">{info.title}</h3>
            <div className="space-y-3">
                {info.items.map((item, index) => (
                    <div key={index} className="flex items-start justify-between gap-4">
                        <span className="text-xs text-foreground/60 font-light flex-shrink-0">
                            {item.label}:
                        </span>
                        <span className="text-xs text-foreground font-mono text-right flex-1">
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
