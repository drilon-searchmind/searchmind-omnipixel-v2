import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaGoogle } from "react-icons/fa";

export function GTMAnalysis({ results }) {
    return (
        <Card id="gtm-analysis" className="opacity-60 mt-20 mb-20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FaGoogle className="w-6 h-6" />
                    Google Tag Manager Analysis
                </CardTitle>
                <CardDescription>
                    Detailed GTM container analysis and optimization recommendations
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-12">
                    <FaGoogle className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">GTM Analysis Coming Soon</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Advanced GTM container analysis, trigger optimization, and tag management features are currently in development.
                    </p>
                    <div className="grid gap-4 md:grid-cols-3 text-sm">
                        <div className="space-y-2">
                            <h4 className="font-medium">Container Analysis</h4>
                            <ul className="text-muted-foreground space-y-1">
                                <li>• Tag inventory</li>
                                <li>• Trigger validation</li>
                                <li>• Variable optimization</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium">Performance Impact</h4>
                            <ul className="text-muted-foreground space-y-1">
                                <li>• Load time analysis</li>
                                <li>• Tag firing efficiency</li>
                                <li>• Resource usage</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium">Compliance Check</h4>
                            <ul className="text-muted-foreground space-y-1">
                                <li>• Consent integration</li>
                                <li>• Privacy compliance</li>
                                <li>• Cookie management</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Show some placeholder data if available */}
                {results.gtmAnalysis && (
                    <div className="mt-6 pt-6 border-t">
                        <h4 className="font-semibold mb-4">Container Information</h4>
                        <div className="grid gap-4 md:grid-cols-3">
                            {results.gtmAnalysis.containers && (
                                <div>
                                    <span className="font-medium">Containers:</span> {results.gtmAnalysis.containers.length}
                                </div>
                            )}
                            {results.gtmAnalysis.triggers && (
                                <div>
                                    <span className="font-medium">Triggers:</span> {results.gtmAnalysis.triggers.length}
                                </div>
                            )}
                            {results.gtmAnalysis.variables && (
                                <div>
                                    <span className="font-medium">Variables:</span> {results.gtmAnalysis.variables.length}
                                </div>
                            )}
                            {results.gtmAnalysis.tags && (
                                <div>
                                    <span className="font-medium">Tags:</span> {results.gtmAnalysis.tags.length}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}