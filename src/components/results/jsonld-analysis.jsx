import { useState } from "react";
import { FaCode, FaCheckCircle, FaExclamationTriangle, FaChevronDown, FaChevronUp, FaInfoCircle } from "react-icons/fa";

export function JsonLdAnalysis({ results }) {
    const jsonLdInfo = results.jsonLdInfo;
    const [expandedSchemas, setExpandedSchemas] = useState({});
    const [expandedScripts, setExpandedScripts] = useState({});

    if (!jsonLdInfo || !jsonLdInfo.found) {
        return (
            <div id="jsonld-analysis" className="space-y-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <FaCode className="w-5 h-5 text-foreground/50" />
                        <h2 className="text-2xl font-light text-foreground">JSON-LD Structured Data</h2>
                    </div>
                    <p className="text-sm text-foreground/50">
                        No JSON-LD structured data found on this page
                    </p>
                </div>
                <div className="border border-border/40 rounded p-6">
                    <div className="flex items-center gap-3 text-foreground/60">
                        <FaInfoCircle className="w-4 h-4" />
                        <p className="text-sm">
                            JSON-LD (application/ld+json) structured data helps search engines understand your content better.
                            Consider adding structured data for better SEO visibility.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const toggleSchema = (index) => {
        setExpandedSchemas(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const toggleScript = (index) => {
        setExpandedScripts(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    // Group schemas by type
    const schemasByType = {};
    jsonLdInfo.schemas.forEach((schema, idx) => {
        const type = schema.type || 'Unknown';
        if (!schemasByType[type]) {
            schemasByType[type] = [];
        }
        schemasByType[type].push({ ...schema, originalIndex: idx });
    });

    return (
        <div id="jsonld-analysis" className="space-y-8">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <FaCode className="w-5 h-5 text-foreground/50" />
                    <h2 className="text-2xl font-light text-foreground">JSON-LD Structured Data</h2>
                </div>
                <p className="text-sm text-foreground/50">
                    Found {jsonLdInfo.schemas.length} schema(s) with {jsonLdInfo.types.length} unique type(s)
                </p>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="border border-border/40 rounded p-4">
                    <div className="text-2xl font-light text-foreground">{jsonLdInfo.scripts.length}</div>
                    <div className="text-xs text-foreground/50 mt-1">Script Tags</div>
                </div>
                <div className="border border-border/40 rounded p-4">
                    <div className="text-2xl font-light text-foreground">{jsonLdInfo.schemas.length}</div>
                    <div className="text-xs text-foreground/50 mt-1">Schemas</div>
                </div>
                <div className="border border-border/40 rounded p-4">
                    <div className="text-2xl font-light text-foreground">{jsonLdInfo.types.length}</div>
                    <div className="text-xs text-foreground/50 mt-1">Unique Types</div>
                </div>
                <div className="border border-border/40 rounded p-4">
                    <div className="text-2xl font-light text-foreground">{jsonLdInfo.errors.length}</div>
                    <div className="text-xs text-foreground/50 mt-1">Errors</div>
                </div>
            </div>

            {/* Errors */}
            {jsonLdInfo.errors.length > 0 && (
                <div className="border border-orange-500/40 rounded p-4 bg-orange-500/5">
                    <div className="flex items-center gap-2 mb-3">
                        <FaExclamationTriangle className="w-4 h-4 text-orange-500" />
                        <h3 className="text-sm font-light text-foreground">Parsing Errors</h3>
                    </div>
                    <div className="space-y-2">
                        {jsonLdInfo.errors.map((error, idx) => (
                            <div key={idx} className="text-sm text-foreground/70">
                                <div className="font-medium">Script #{error.index}:</div>
                                <div className="text-xs text-foreground/50 mt-1">{error.error}</div>
                                {error.content && (
                                    <div className="text-xs font-mono bg-foreground/5 p-2 rounded mt-2 break-all">
                                        {error.content}...
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Schemas by Type */}
            <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Schemas by Type</h3>
                {Object.entries(schemasByType).map(([type, schemas]) => (
                    <div key={type} className="border border-border/40 rounded">
                        <div className="p-4 bg-foreground/5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-light text-foreground">{type}</h4>
                                    <p className="text-xs text-foreground/50 mt-1">
                                        {schemas.length} schema{schemas.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {schemas[0].schemaOrg && (
                                        <span className="px-2 py-1 text-xs bg-green-500/20 text-green-600 rounded">
                                            Schema.org
                                        </span>
                                    )}
                                    {schemas[0].isValid ? (
                                        <FaCheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <FaExclamationTriangle className="w-4 h-4 text-orange-500" />
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 space-y-3">
                            {schemas.map((schema, idx) => {
                                const uniqueKey = `${schema.index}-${schema.schemaIndex}`;
                                const isExpanded = expandedSchemas[uniqueKey];
                                return (
                                    <div key={idx} className="border-l-2 border-border/40 pl-4">
                                        <div 
                                            className="flex items-center justify-between cursor-pointer"
                                            onClick={() => toggleSchema(uniqueKey)}
                                        >
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-foreground">
                                                    Schema #{schema.index}
                                                    {schema.schemaIndex !== undefined && ` (${schema.schemaIndex + 1})`}
                                                </div>
                                                <div className="text-xs text-foreground/50 mt-1">
                                                    {schema.context && (
                                                        <span>Context: {schema.context}</span>
                                                    )}
                                                    {schema.id && (
                                                        <span className="ml-2">ID: {schema.id}</span>
                                                    )}
                                                </div>
                                                {schema.properties.length > 0 && (
                                                    <div className="text-xs text-foreground/40 mt-1">
                                                        Properties: {schema.properties.slice(0, 5).join(', ')}
                                                        {schema.properties.length > 5 && ` +${schema.properties.length - 5} more`}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                {isExpanded ? (
                                                    <FaChevronUp className="w-4 h-4 text-foreground/40" />
                                                ) : (
                                                    <FaChevronDown className="w-4 h-4 text-foreground/40" />
                                                )}
                                            </div>
                                        </div>
                                        {isExpanded && (
                                            <div className="mt-3 pt-3 border-t border-border/40">
                                                <div className="text-xs text-foreground/50 mb-2">Full JSON Structure:</div>
                                                <pre className="text-xs font-mono bg-foreground/5 p-3 rounded overflow-x-auto">
                                                    {JSON.stringify(schema.raw, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Raw Scripts */}
            <div className="space-y-4 hidden">
                <h3 className="text-lg font-light text-foreground">Raw Script Tags</h3>
                {jsonLdInfo.scripts.map((script, idx) => {
                    const isExpanded = expandedScripts[idx];
                    return (
                        <div key={idx} className="border border-border/40 rounded">
                            <div 
                                className="p-4 cursor-pointer hover:bg-foreground/5 transition-colors"
                                onClick={() => toggleScript(idx)}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-medium text-foreground">
                                            Script Tag #{script.index}
                                        </div>
                                        <div className="text-xs text-foreground/50 mt-1">
                                            Type: {script.type}
                                        </div>
                                        {script.schemaInfo && (
                                            <div className="text-xs text-foreground/50 mt-1">
                                                Schema Type: {script.schemaInfo.type}
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-4">
                                        {isExpanded ? (
                                            <FaChevronUp className="w-4 h-4 text-foreground/40" />
                                        ) : (
                                            <FaChevronDown className="w-4 h-4 text-foreground/40" />
                                        )}
                                    </div>
                                </div>
                            </div>
                            {isExpanded && (
                                <div className="px-4 pb-4 border-t border-border/40">
                                    <div className="pt-4 space-y-3">
                                        <div>
                                            <div className="text-xs text-foreground/50 mb-2">Raw Content:</div>
                                            <pre className="text-xs font-mono bg-foreground/5 p-3 rounded overflow-x-auto max-h-96 overflow-y-auto">
                                                {script.content}
                                            </pre>
                                        </div>
                                        {script.parsed && (
                                            <div>
                                                <div className="text-xs text-foreground/50 mb-2">Parsed JSON:</div>
                                                <pre className="text-xs font-mono bg-foreground/5 p-3 rounded overflow-x-auto max-h-96 overflow-y-auto">
                                                    {JSON.stringify(script.parsed, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
