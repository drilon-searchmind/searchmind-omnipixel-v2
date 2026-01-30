import { FaGoogle } from "react-icons/fa";

export function GTMAnalysis({ results }) {
    const gtmInfo = results.gtmInfo || null;

    return (
        <div id="gtm-analysis" className="space-y-8">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <FaGoogle className="w-5 h-5 text-foreground/50" />
                    <h2 className="text-2xl font-light text-foreground">Google Tag Manager Analysis</h2>
                </div>
                <p className="text-sm text-foreground/50">
                    Detailed GTM container analysis and optimization recommendations
                </p>
            </div>

            {gtmInfo && gtmInfo.found ? (
                <div className="space-y-6">
                    {/* GTM Containers Found section */}
                    <div className="border border-border/40 rounded p-6">
                        <h3 className="text-lg font-light text-foreground mb-4">GTM Containers ({gtmInfo.count})</h3>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {gtmInfo.containers.map((containerId, index) => (
                                <div key={index} className="flex items-center gap-3 p-4 bg-foreground/5 border border-border/40 rounded">
                                    <FaGoogle className="w-5 h-5 text-foreground/70 flex-shrink-0" />
                                    <div>
                                        <div className="font-light text-foreground">{containerId}</div>
                                        <div className="text-xs text-foreground/50">Container {index + 1}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Implementation Details section */}
                    <div className="border border-border/40 rounded p-6">
                        <h3 className="text-lg font-light text-foreground mb-4">Implementation Details</h3>
                        <div className="grid gap-4 md:grid-cols-2 text-sm">
                            <div>
                                <span className="text-foreground/50">Container Type:</span>
                                <span className="text-foreground ml-2">Standard GTM</span>
                            </div>
                            <div>
                                <span className="text-foreground/50">Detection Method:</span>
                                <span className="text-foreground ml-2">HTML & Network Analysis</span>
                            </div>
                            <div>
                                <span className="text-foreground/50">Integration:</span>
                                <span className="text-foreground ml-2">Direct Script Tags</span>
                            </div>
                            <div>
                                <span className="text-foreground/50">Status:</span>
                                <span className="text-foreground ml-2">Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 border border-border/40 rounded">
                    <FaGoogle className="w-12 h-12 mx-auto text-foreground/30 mb-4" />
                    <h3 className="text-lg font-light mb-2 text-foreground/70">No GTM Containers Found</h3>
                    <p className="text-sm text-foreground/50 mb-8 max-w-md mx-auto">
                        No Google Tag Manager containers were detected on this website.
                    </p>
                    <div className="text-xs text-foreground/40">
                        GTM containers are typically loaded via direct script tags or through third-party integrations.
                    </div>
                </div>
            )}
        </div>
    );
}