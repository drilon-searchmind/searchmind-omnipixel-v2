import { FaShieldAlt } from "react-icons/fa";

export function PrivacyCookies({ results }) {
    return (
        <div id="privacy-cookies" className="space-y-8">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <FaShieldAlt className="w-5 h-5 text-foreground/50" />
                    <h2 className="text-2xl font-light text-foreground">Privacy & Cookies</h2>
                </div>
            </div>
            <div className="space-y-6">
                {/* Cookie Acceptance Status */}
                <div className="flex items-center justify-between p-5 border border-border/40 rounded">
                    <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${
                            results.cookieInfo?.accepted ? 'bg-foreground' :
                            results.cookieInfo?.accepted === false ? 'bg-foreground/30' : 'bg-foreground/20'
                        }`}></div>
                        <div>
                            <div className="text-sm font-light text-foreground">Cookie Acceptance</div>
                            <div className="text-xs text-foreground/50 mt-0.5">
                                {results.cookieInfo?.accepted ?
                                    `Cookies automatically accepted using ${results.cookieInfo.method || 'text-based detection'}` :
                                    results.cookieInfo?.message || 'Unable to accept cookies automatically'
                                }
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-xs font-light ${
                            results.cookieInfo?.accepted ? 'text-foreground' :
                            results.cookieInfo?.accepted === false ? 'text-foreground/50' : 'text-foreground/40'
                        }`}>
                            {results.cookieInfo?.accepted ? 'Accepted' :
                             results.cookieInfo?.accepted === false ? 'Failed' : 'Unknown'}
                        </div>
                    </div>
                </div>

                {/* Enhanced Cookie Details */}
                {results.cookieInfo && (
                    <div className="p-6 border border-border/40 rounded space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* CMP Detection */}
                            <div className="space-y-2">
                                <div className="text-xs font-light text-foreground/50 uppercase tracking-wider">
                                    CMP Provider
                                </div>
                                <div className="text-sm font-light mt-1">
                                    {results.cookieInfo.cmp ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-foreground">{results.cookieInfo.cmp.name}</span>
                                            <span className={`px-2 py-0.5 text-xs rounded ${
                                                results.cookieInfo.cmp.confidence === 'high'
                                                    ? 'bg-foreground text-background'
                                                    : results.cookieInfo.cmp.confidence === 'medium'
                                                    ? 'bg-foreground/20 text-foreground'
                                                    : 'bg-secondary text-foreground/50'
                                            }`}>
                                                {results.cookieInfo.cmp.confidence || 'unknown'}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-foreground/70">
                                            {results.cookieInfo.provider === 'Text-based detection' ? 'Auto-detected' : results.cookieInfo.provider || 'Unknown'}
                                        </span>
                                    )}
                                </div>
                                {results.cookieInfo.cmp?.version && (
                                    <div className="text-xs text-foreground/50">
                                        Version: {results.cookieInfo.cmp.version}
                                    </div>
                                )}
                            </div>

                            {/* Detection Method */}
                            <div>
                                <div className="text-xs font-light text-foreground/50 uppercase tracking-wider">
                                    Detection Method
                                </div>
                                <div className="text-sm font-light mt-1 text-foreground">
                                    {results.cookieInfo.method === 'cmp-specific' ? 'CMP-Specific' : 'Text-Based'}
                                </div>
                                {results.cookieInfo.cmp && (
                                    <div className="text-xs text-foreground/50 mt-1">
                                        {results.cookieInfo.cmp.elements || 0} elements, {results.cookieInfo.cmp.scripts || 0} scripts detected
                                    </div>
                                )}
                            </div>

                            {/* Cookie Statistics */}
                            {results.cookieInfo.cookies && (
                                <>
                                    <div>
                                        <div className="text-xs font-light text-foreground/50 uppercase tracking-wider">
                                            Cookies Found
                                        </div>
                                        <div className="text-sm font-light mt-1 text-foreground">
                                            {results.cookieInfo.cookies.count} total cookies
                                        </div>
                                        {results.cookieInfo.cookies.domains && results.cookieInfo.cookies.domains > 0 && (
                                            <div className="text-xs text-foreground/50 mt-1">
                                                {results.cookieInfo.cookies.domains} domains
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <div className="text-xs font-light text-foreground/50 uppercase tracking-wider">
                                            Cookie Categories
                                        </div>
                                        <div className="text-sm font-light mt-1">
                                            {results.cookieInfo.cookies.keys && results.cookieInfo.cookies.keys.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {results.cookieInfo.cookies.keys.slice(0, 5).map((key, index) => (
                                                        <span key={index} className="px-2 py-1 border border-border/40 rounded text-xs text-foreground/70">
                                                            {key}
                                                        </span>
                                                    ))}
                                                    {results.cookieInfo.cookies.keys.length > 5 && (
                                                        <span className="px-2 py-1 border border-border/40 rounded text-xs text-foreground/50">
                                                            +{results.cookieInfo.cookies.keys.length - 5} more
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-foreground/50">No cookies detected</span>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Button Information */}
                            {results.cookieInfo.element && (
                                <>
                                    <div>
                                        <div className="text-xs font-light text-foreground/50 uppercase tracking-wider">
                                            Button Element
                                        </div>
                                        <div className="text-sm font-light mt-1 text-foreground">
                                            {results.cookieInfo.element.tagName?.toLowerCase() || 'button'}
                                        </div>
                                        {results.cookieInfo.element?.className && (
                                            <div className="text-xs text-foreground/50 mt-1 font-mono">
                                                .{results.cookieInfo.element.className.split(' ')[0]}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <div className="text-xs font-light text-foreground/50 uppercase tracking-wider">
                                            Button Text
                                        </div>
                                        <div className="text-sm font-light mt-1 truncate text-foreground">
                                            "{results.cookieInfo.element.text}"
                                        </div>
                                        {results.cookieInfo.element?.id && (
                                            <div className="text-xs text-foreground/50 mt-1 font-mono">
                                                #{results.cookieInfo.element.id}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Action Details */}
                        {results.cookieInfo.message && (
                            <div className="pt-4 border-t border-border/40">
                                <div className="text-xs font-light text-foreground/50 uppercase tracking-wider mb-2">
                                    Action Details
                                </div>
                                <div className="text-sm text-foreground/70">
                                    {results.cookieInfo.message}
                                </div>
                            </div>
                        )}

                        {/* CMP Additional Info */}
                        {results.cookieInfo.cmp?.platform && (
                            <div className="pt-4 border-t border-border/40">
                                <div className="text-xs font-light text-foreground/50 uppercase tracking-wider mb-2">
                                    Platform Integration
                                </div>
                                <div className="text-sm text-foreground">
                                    {results.cookieInfo.cmp.platform}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}