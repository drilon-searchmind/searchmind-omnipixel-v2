import { FaTachometerAlt, FaShieldAlt, FaServer, FaCheck, FaTimes } from "react-icons/fa";

export function ScoreOverview({ results, totalScore }) {
    return (
        <div id="overview" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Overall Score */}
            <div className="border border-border/40 rounded p-6 bg-foreground text-background">
                <div className="space-y-4">
                    <div className="text-xs uppercase tracking-wider text-background/70">Overall Score</div>
                    <div className="text-5xl font-light">{totalScore}/100</div>
                    <div className="text-xs text-background/60">
                        Combined technical score
                    </div>
                </div>
            </div>

            {/* Performance Score */}
            <div className="border border-border/40 rounded p-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <FaTachometerAlt className="w-4 h-4 text-foreground/50" />
                        <div className="text-sm font-light text-foreground/70">Performance Score</div>
                    </div>
                    <div className="text-3xl font-light text-foreground">{results.scores.performance}/100</div>
                    <div className="text-xs text-foreground/50">
                        Core Web Vitals optimized
                    </div>
                </div>
            </div>

            {/* Consent Mode V2 */}
            <div className="border border-border/40 rounded p-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <FaShieldAlt className="w-4 h-4 text-foreground/50" />
                        <div className="text-sm font-light text-foreground/70">Consent Mode V2</div>
                    </div>
                    <div className="flex items-center gap-2">
                        {results.consentModeV2 ? (
                            <><FaCheck className="w-4 h-4 text-foreground" /> <span className="text-sm font-light text-foreground">Enabled</span></>
                        ) : (
                            <><FaTimes className="w-4 h-4 text-foreground/40" /> <span className="text-sm font-light text-foreground/60">Disabled</span></>
                        )}
                    </div>
                </div>
            </div>

            {/* Server-side Tracking */}
            <div className="border border-border/40 rounded p-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <FaServer className="w-4 h-4 text-foreground/50" />
                        <div className="text-sm font-light text-foreground/70">Server-side Tracking</div>
                    </div>
                    <div className="flex items-center gap-2">
                        {results.serverSideTracking ? (
                            <><FaCheck className="w-4 h-4 text-foreground" /> <span className="text-sm font-light text-foreground">Active</span></>
                        ) : (
                            <><FaTimes className="w-4 h-4 text-foreground/40" /> <span className="text-sm font-light text-foreground/60">Not Detected</span></>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}