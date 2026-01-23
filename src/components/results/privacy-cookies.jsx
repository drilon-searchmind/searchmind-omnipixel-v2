import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaShieldAlt } from "react-icons/fa";

export function PrivacyCookies({ results }) {
    return (
        <Card id="privacy-cookies" className="mt-10 mb-10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FaShieldAlt className="w-6 h-6" />
                    Privacy & Cookies
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Cookie Acceptance Status */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                            results.cookieInfo?.accepted ? 'bg-accent' :
                            results.cookieInfo?.accepted === false ? 'bg-destructive' : 'bg-muted'
                        }`}></div>
                        <div>
                            <div className="font-medium">Cookie Acceptance</div>
                            <div className="text-sm text-muted-foreground">
                                {results.cookieInfo?.accepted ?
                                    `Cookies automatically accepted using ${results.cookieInfo.method || 'text-based detection'}` :
                                    results.cookieInfo?.message || 'Unable to accept cookies automatically'
                                }
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-sm font-medium ${
                            results.cookieInfo?.accepted ? 'text-accent' :
                            results.cookieInfo?.accepted === false ? 'text-destructive' : 'text-muted-foreground'
                        }`}>
                            {results.cookieInfo?.accepted ? 'Accepted' :
                             results.cookieInfo?.accepted === false ? 'Failed' : 'Unknown'}
                        </div>
                    </div>
                </div>

                {/* Enhanced Cookie Details */}
                {results.cookieInfo && (
                    <div className="p-4 bg-muted/20 rounded-lg space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* CMP Detection */}
                            <div className="space-y-2">
                                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    CMP Provider
                                </div>
                                <div className="text-sm font-medium mt-1">
                                    {results.cookieInfo.cmp ? (
                                        <div className="flex items-center gap-2">
                                            <span>{results.cookieInfo.cmp.name}</span>
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                results.cookieInfo.cmp.confidence === 'high'
                                                    ? 'bg-accent text-accent-foreground'
                                                    : results.cookieInfo.cmp.confidence === 'medium'
                                                    ? 'bg-secondary/20 text-secondary-foreground'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}>
                                                {results.cookieInfo.cmp.confidence || 'unknown'}
                                            </span>
                                        </div>
                                    ) : (
                                        results.cookieInfo.provider === 'Text-based detection' ? 'Auto-detected' : results.cookieInfo.provider || 'Unknown'
                                    )}
                                </div>
                                {results.cookieInfo.cmp?.version && (
                                    <div className="text-xs text-muted-foreground">
                                        Version: {results.cookieInfo.cmp.version}
                                    </div>
                                )}
                            </div>

                            {/* Detection Method */}
                            <div>
                                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Detection Method
                                </div>
                                <div className="text-sm font-medium mt-1">
                                    {results.cookieInfo.method === 'cmp-specific' ? 'CMP-Specific' : 'Text-Based'}
                                </div>
                                {results.cookieInfo.cmp && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {results.cookieInfo.cmp.elements || 0} elements, {results.cookieInfo.cmp.scripts || 0} scripts detected
                                    </div>
                                )}
                            </div>

                            {/* Cookie Statistics */}
                            {results.cookieInfo.cookies && (
                                <>
                                    <div>
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Cookies Found
                                        </div>
                                        <div className="text-sm font-medium mt-1">
                                            {results.cookieInfo.cookies.count} total cookies
                                        </div>
                                        {results.cookieInfo.cookies.domains && results.cookieInfo.cookies.domains > 0 && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {results.cookieInfo.cookies.domains} domains
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Cookie Categories
                                        </div>
                                        <div className="text-sm font-medium mt-1">
                                            {results.cookieInfo.cookies.keys && results.cookieInfo.cookies.keys.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {results.cookieInfo.cookies.keys.slice(0, 5).map((key, index) => (
                                                        <span key={index} className="px-2 py-1 bg-background rounded text-xs">
                                                            {key}
                                                        </span>
                                                    ))}
                                                    {results.cookieInfo.cookies.keys.length > 5 && (
                                                        <span className="px-2 py-1 bg-background rounded text-xs">
                                                            +{results.cookieInfo.cookies.keys.length - 5} more
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                'No cookies detected'
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Button Information */}
                            {results.cookieInfo.element && (
                                <>
                                    <div>
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Button Element
                                        </div>
                                        <div className="text-sm font-medium mt-1">
                                            {results.cookieInfo.element.tagName?.toLowerCase() || 'button'}
                                        </div>
                                        {results.cookieInfo.element?.className && (
                                            <div className="text-xs text-muted-foreground mt-1 font-mono">
                                                .{results.cookieInfo.element.className.split(' ')[0]}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Button Text
                                        </div>
                                        <div className="text-sm font-medium mt-1 truncate">
                                            "{results.cookieInfo.element.text}"
                                        </div>
                                        {results.cookieInfo.element?.id && (
                                            <div className="text-xs text-muted-foreground mt-1 font-mono">
                                                #{results.cookieInfo.element.id}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Action Details */}
                        {results.cookieInfo.message && (
                            <div className="pt-3 border-t border-border">
                                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Action Details
                                </div>
                                <div className="text-sm mt-2 text-muted-foreground">
                                    {results.cookieInfo.message}
                                </div>
                            </div>
                        )}

                        {/* CMP Additional Info */}
                        {results.cookieInfo.cmp?.platform && (
                            <div className="pt-2 border-t border-border">
                                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Platform Integration
                                </div>
                                <div className="text-sm mt-1">
                                    {results.cookieInfo.cmp.platform}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}