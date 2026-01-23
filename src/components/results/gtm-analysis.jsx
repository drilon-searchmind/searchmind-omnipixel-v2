import { FaGoogle } from "react-icons/fa";

export function GTMAnalysis({ results }) {
    return (
        <div id="gtm-analysis" className="space-y-8 opacity-60">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <FaGoogle className="w-5 h-5 text-foreground/50" />
                    <h2 className="text-2xl font-light text-foreground">Google Tag Manager Analysis</h2>
                </div>
                <p className="text-sm text-foreground/50">
                    Detailed GTM container analysis and optimization recommendations
                </p>
            </div>
            <div className="text-center py-12 border border-border/40 rounded">
                <FaGoogle className="w-12 h-12 mx-auto text-foreground/30 mb-4" />
                <h3 className="text-lg font-light mb-2 text-foreground/70">GTM Analysis Coming Soon</h3>
                <p className="text-sm text-foreground/50 mb-8 max-w-md mx-auto">
                    Advanced GTM container analysis, trigger optimization, and tag management features are currently in development.
                </p>
                <div className="grid gap-6 md:grid-cols-3 text-sm max-w-2xl mx-auto">
                    <div className="space-y-2">
                        <h4 className="font-light text-foreground/70">Container Analysis</h4>
                        <ul className="text-foreground/50 space-y-1 text-xs">
                            <li>• Tag inventory</li>
                            <li>• Trigger validation</li>
                            <li>• Variable optimization</li>
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-light text-foreground/70">Performance Impact</h4>
                        <ul className="text-foreground/50 space-y-1 text-xs">
                            <li>• Load time analysis</li>
                            <li>• Tag firing efficiency</li>
                            <li>• Resource usage</li>
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-light text-foreground/70">Compliance Check</h4>
                        <ul className="text-foreground/50 space-y-1 text-xs">
                            <li>• Consent integration</li>
                            <li>• Privacy compliance</li>
                            <li>• Cookie management</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Show some placeholder data if available */}
            {results.gtmAnalysis && (
                <div className="pt-6 border-t border-border/40">
                    <h4 className="font-light mb-4 text-foreground/70">Container Information</h4>
                    <div className="grid gap-4 md:grid-cols-3 text-sm">
                        {results.gtmAnalysis.containers && (
                            <div>
                                <span className="text-foreground/50">Containers:</span> <span className="text-foreground">{results.gtmAnalysis.containers.length}</span>
                            </div>
                        )}
                        {results.gtmAnalysis.triggers && (
                            <div>
                                <span className="text-foreground/50">Triggers:</span> <span className="text-foreground">{results.gtmAnalysis.triggers.length}</span>
                            </div>
                        )}
                        {results.gtmAnalysis.variables && (
                            <div>
                                <span className="text-foreground/50">Variables:</span> <span className="text-foreground">{results.gtmAnalysis.variables.length}</span>
                            </div>
                        )}
                        {results.gtmAnalysis.tags && (
                            <div>
                                <span className="text-foreground/50">Tags:</span> <span className="text-foreground">{results.gtmAnalysis.tags.length}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}