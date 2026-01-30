import { FaTag, FaGoogle, FaFacebook, FaTiktok, FaLinkedin, FaChartLine, FaCheck, FaTimes } from "react-icons/fa";

export function MarketingScripts({ results }) {
    const scriptIcons = {
        gtm: <FaTag className="w-4 h-4 text-foreground/50" />,
        ga4: <FaGoogle className="w-4 h-4 text-foreground/50" />,
        meta: <FaFacebook className="w-4 h-4 text-foreground/50" />,
        tiktok: <FaTiktok className="w-4 h-4 text-foreground/50" />,
        linkedin: <FaLinkedin className="w-4 h-4 text-foreground/50" />,
        googleAds: <FaChartLine className="w-4 h-4 text-foreground/50" />
    };

    const scriptNames = {
        gtm: "Google Tag Manager",
        ga4: "Google Analytics 4",
        meta: "Meta Pixel",
        tiktok: "TikTok Pixel",
        linkedin: "LinkedIn Insight",
        googleAds: "Google Ads"
    };

    return (
        <div id="marketing-scripts" className="space-y-8">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <FaTag className="w-5 h-5 text-foreground/50" />
                    <h2 className="text-2xl font-light text-foreground">Marketing Scripts Analysis</h2>
                </div>
                <p className="text-sm text-foreground/50">
                    Detected marketing and analytics implementations with technical details
                </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(results.marketingScripts).map(([key, data]) => (
                    <div key={key} className={`p-5 border rounded transition-all ${data.found
                            ? 'border-foreground/20 bg-foreground/5'
                            : 'border-border/40 bg-background'
                        }`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {scriptIcons[key]}
                                <div>
                                    <div className="font-light text-foreground">{scriptNames[key]}</div>
                                    {data.found && (
                                        <div className="text-xs text-foreground/50 mt-0.5">
                                            {data.containers && data.containers.length > 0 ? (
                                                <div>
                                                    {data.containers.length === 1 
                                                        ? `Container: ${data.containers[0]}`
                                                        : `Containers: ${data.containers.join(', ')}`
                                                    }
                                                </div>
                                            ) : data.containerId && (
                                                <div>Container: {data.containerId}</div>
                                            )}
                                            {data.measurementId && <div>Measurement: {data.measurementId}</div>}
                                            {data.pixelId && <div>Pixel: {data.pixelId}</div>}
                                            {data.conversionId && <div>Conversion: {data.conversionId}</div>}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {data.found ? (
                                    <><FaCheck className="w-3.5 h-3.5 text-foreground" /> <span className="text-xs font-light text-foreground">Detected</span></>
                                ) : (
                                    <><FaTimes className="w-3.5 h-3.5 text-foreground/30" /> <span className="text-xs font-light text-foreground/50">Not Found</span></>
                                )}
                            </div>
                        </div>
                        {data.found && (
                            <div className="space-y-1 text-xs text-foreground/50 pt-3 border-t border-border/40">
                                {data.version && <div>Version: {data.version}</div>}
                                {data.lastUpdated && <div>Last Updated: {data.lastUpdated}</div>}
                                {data.enhancedEcommerce && <div>✓ Enhanced E-commerce</div>}
                                {data.conversionsApi && <div>✓ Conversions API</div>}
                                {data.remarketing && <div>✓ Remarketing</div>}
                                {data.customAudiences && <div>✓ Custom Audiences</div>}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}