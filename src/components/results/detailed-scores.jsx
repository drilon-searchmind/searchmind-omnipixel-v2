import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaChartLine } from "react-icons/fa";

export function DetailedScores({ results }) {
    return (
        <Card id="detailed-scores" className="mt-10 mb-10">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                    <FaChartLine className="w-6 h-6" />
                    Detailed Scores
                </CardTitle>
                <CardDescription>
                    Breakdown of technical compliance and optimization scores
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Object.entries(results.scores).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <span className="text-sm font-bold text-accent">{value}/100</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                                <div
                                    className="bg-accent h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${value}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}