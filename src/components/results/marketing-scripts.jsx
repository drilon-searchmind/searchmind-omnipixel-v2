import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaTag, FaGoogle, FaFacebook, FaTiktok, FaLinkedin, FaChartLine, FaCheck, FaTimes } from "react-icons/fa";

export function MarketingScripts({ results }) {
    const scriptIcons = {
        gtm: <FaTag className="w-5 h-5 text-primary" />,
        ga4: <FaGoogle className="w-5 h-5 text-primary" />,
        meta: <FaFacebook className="w-5 h-5 text-primary" />,
        tiktok: <FaTiktok className="w-5 h-5 text-foreground" />,
        linkedin: <FaLinkedin className="w-5 h-5 text-primary" />,
        googleAds: <FaChartLine className="w-5 h-5 text-primary" />
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
        <Card id="marketing-scripts" className="mt-10 mb-10 bg-muted/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FaTag className="w-6 h-6" />
                    Marketing Scripts Analysis
                </CardTitle>
                <CardDescription>
                    Detected marketing and analytics implementations with technical details
                </CardDescription>
            </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            {Object.entries(results.marketingScripts).map(([key, data]) => (
                                <div key={key} className={`p-4 border rounded-lg transition-colors ${data.found
                                        ? 'bg-accent/10 border-accent/20 hover:bg-accent/20'
                                        : 'bg-muted border-border'
                                    }`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            {scriptIcons[key]}
                                            <div>
                                                <div className="font-semibold">{scriptNames[key]}</div>
                                                {data.found && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {data.containerId && `Container: ${data.containerId}`}
                                                        {data.measurementId && `Measurement: ${data.measurementId}`}
                                                        {data.pixelId && `Pixel: ${data.pixelId}`}
                                                        {data.conversionId && `Conversion: ${data.conversionId}`}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {data.found ? (
                                                <><FaCheck className="w-4 h-4 text-accent" /> <span className="text-sm font-medium text-accent">Detected</span></>
                                            ) : (
                                                <><FaTimes className="w-4 h-4 text-muted-foreground" /> <span className="text-sm font-medium text-muted-foreground">Not Found</span></>
                                            )}
                                        </div>
                                    </div>
                                    {data.found && (
                                        <div className="space-y-1 text-xs text-muted-foreground">
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
                    </CardContent>
        </Card>
    );
}