import { FaChartLine } from "react-icons/fa";

export function DetailedScores({ results }) {
    return (
        <div 
            id="detailed-scores" 
            className="relative space-y-8 py-20 px-6 rounded overflow-hidden"
            style={{
                backgroundImage: 'url(/textures/h-co-jQ0RUW5kVGc-unsplash.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {/* Foreground overlay */}
            <div className="absolute inset-0 bg-foreground/90 z-0 h-full"></div>
            
            {/* Content with relative positioning to appear above overlay */}
            <div className="relative z-10 text-background">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <FaChartLine className="w-5 h-5 text-white" />
                        <h2 className="text-2xl font-light text-background/70">Detailed Scores</h2>
                    </div>
                    <p className="text-sm text-background/70 mb-10">
                        Breakdown of technical compliance and optimization scores
                    </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {Object.entries(results.scores).map(([key, value]) => (
                        <div key={key} className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-light text-background/70 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <span className="text-sm font-light text-background">{value}/100</span>
                            </div>
                            <div className="w-full bg-background/10 rounded-full h-1">
                                <div
                                    className="bg-background h-1 rounded-full transition-all duration-300"
                                    style={{ width: `${value}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}