import { useState } from "react";
import { FaDatabase, FaChevronDown, FaChevronUp, FaCode } from "react-icons/fa";

export function DataLayerInspection({ dataLayer }) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!dataLayer || !Array.isArray(dataLayer) || dataLayer.length === 0) {
        return (
            <div id="datalayer-inspection" className="space-y-4">
                <div className="flex items-center gap-2">
                    <FaDatabase className="w-5 h-5 text-foreground/50" />
                    <h2 className="text-2xl font-light text-foreground">DataLayer Inspection</h2>
                </div>
                <div className="border border-border/40 rounded-lg p-6 bg-muted/20">
                    <div className="text-center text-foreground/60">
                        <FaDatabase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No dataLayer found on this page</p>
                        <p className="text-sm mt-2">The page does not contain a dataLayer array</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div id="datalayer-inspection" className="space-y-8">
            <div className="space-y-2">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity group"
                >
                    <div className="flex items-center gap-2">
                        <FaDatabase className="w-5 h-5 text-foreground/50" />
                        <h2 className="text-2xl font-light text-foreground">DataLayer Inspection</h2>
                        <span className="text-sm text-foreground/50 bg-foreground/10 px-2 py-1 rounded">
                            {dataLayer.length} event{dataLayer.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        {isExpanded ? (
                            <FaChevronUp className="w-4 h-4 text-foreground/50 group-hover:text-foreground transition-colors" />
                        ) : (
                            <FaChevronDown className="w-4 h-4 text-foreground/50 group-hover:text-foreground transition-colors" />
                        )}
                    </div>
                </button>
            </div>

            {isExpanded && (
                <div className="space-y-4">
                    <div className="bg-muted/20 border border-border/40 rounded-lg p-4">
                        <div className="text-sm text-foreground/70 mb-4">
                            The dataLayer contains events pushed by Google Tag Manager and other tracking scripts.
                            Each entry represents an event or configuration that occurred during page load.
                        </div>

                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {dataLayer.map((event, index) => (
                                <div key={index} className="border border-border/40 rounded-lg bg-background">
                                    <div className="flex items-center justify-between p-3 border-b border-border/40">
                                        <div className="flex items-center gap-2">
                                            <FaCode className="w-4 h-4 text-foreground/50" />
                                            <span className="font-medium text-sm">Event #{index + 1}</span>
                                            {event.event && (
                                                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                                    {event.event}
                                                </span>
                                            )}
                                            {event[0] && typeof event[0] === 'string' && (
                                                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                                    {event[0]}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <pre className="text-xs bg-muted/50 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                                            {JSON.stringify(event, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}