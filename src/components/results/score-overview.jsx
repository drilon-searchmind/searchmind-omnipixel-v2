import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaTachometerAlt, FaShieldAlt, FaServer, FaCheck, FaTimes } from "react-icons/fa";

export function ScoreOverview({ results, totalScore }) {
    return (
        <div id="overview" className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-20 mb-20">
            <Card className="bg-primary text-primary-foreground col-span-1 py-5">
                <CardHeader className="pb-5">
                    <CardTitle className="text-xl">Overall Score</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-5xl font-bold text-accent-foreground">{totalScore}/100</div>
                    <div className="text-xs mt-3">
                        Combined technical score
                    </div>
                </CardContent>
            </Card>

            <Card className="">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FaTachometerAlt className="w-5 h-5" />
                        Performance Score
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-accent">{results.scores.performance}/100</div>
                    <div className="text-xs text-muted-foreground mt-1">
                        Core Web Vitals optimized
                    </div>
                </CardContent>
            </Card>

            <Card className="">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FaShieldAlt className="w-5 h-5" />
                        Consent Mode V2
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        {results.consentModeV2 ? (
                            <><FaCheck className="w-5 h-5 text-accent" /> <span className="font-semibold text-accent">Enabled</span></>
                        ) : (
                            <><FaTimes className="w-5 h-5 text-destructive" /> <span className="font-semibold text-destructive">Disabled</span></>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FaServer className="w-5 h-5" />
                        Server-side Tracking
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        {results.serverSideTracking ? (
                            <><FaCheck className="w-5 h-5 text-accent" /> <span className="font-semibold text-accent">Active</span></>
                        ) : (
                            <><FaTimes className="w-5 h-5 text-destructive" /> <span className="font-semibold text-destructive">Not Detected</span></>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}