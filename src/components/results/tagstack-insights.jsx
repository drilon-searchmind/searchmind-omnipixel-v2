import { useState } from "react";
import { FaCheckCircle, FaExclamationTriangle, FaClock, FaSquare, FaChevronDown, FaChevronUp } from "react-icons/fa";

export function TagstackInsights({ results }) {
    const tagstackInfo = results.tagstackInfo;
    const gtmInfo = results.gtmInfo;
    // Initialize all sections as expanded by default
    const [expandedSections, setExpandedSections] = useState({
        'paused-tags': true,
        'consent-mode': true,
        'cmp': true,
        'tags-triggers': true
    });

    if (!tagstackInfo || !gtmInfo?.found) {
        return null;
    }

    const primaryContainerId = gtmInfo.containers[0];
    const containerData = tagstackInfo.gtmContainers?.find(c => c.id === primaryContainerId);

    if (!containerData) {
        return null;
    }

    // Get container stats
    const containerStats = tagstackInfo.containerStats?.[primaryContainerId];
    
    // Get full arrays for details
    const pausedTags = tagstackInfo.tags?.filter(t => t.containerId === primaryContainerId && t.paused) || [];
    const allTags = tagstackInfo.tags?.filter(t => t.containerId === primaryContainerId) || [];
    const allTriggers = tagstackInfo.triggers?.filter(t => t.containerId === primaryContainerId) || [];
    const allVariables = tagstackInfo.variables?.filter(v => v.containerId === primaryContainerId) || [];

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    // Build recommendations/checks based on Tagstack data
    const checks = [];

    // Check for paused tags (use stats instead of full tags array)
    if (containerStats && containerStats.pausedTags > 0) {
        checks.push({
            id: 'paused-tags',
            type: 'warning',
            icon: FaClock,
            title: 'Avoid keeping paused tags',
            description: `${containerStats.pausedTags} paused tag(s) found`,
            tags: ['Site speed'],
            details: pausedTags.length > 0 ? {
                items: pausedTags.map(tag => ({
                    name: tag.name || tag.tagId || 'Unnamed Tag',
                    type: tag.type || 'Unknown',
                    tagId: tag.tagId
                }))
            } : null
        });
    }

    // Check for Consent Mode V2
    if (containerData.consentMode) {
        checks.push({
            id: 'consent-mode',
            type: 'success',
            icon: FaCheckCircle,
            title: 'Consent Mode V2 Enabled',
            description: 'Google Consent Mode V2 is properly configured',
            tags: ['Privacy', 'Compliance'],
            details: tagstackInfo.consentDefaults ? {
                defaults: tagstackInfo.consentDefaults,
                note: 'Consent defaults are configured for this container'
            } : null
        });
    } else {
        checks.push({
            id: 'consent-mode',
            type: 'error',
            icon: FaExclamationTriangle,
            title: 'Consent Mode V2 Not Enabled',
            description: 'Consider enabling Consent Mode V2 for better privacy compliance',
            tags: ['Privacy', 'Compliance'],
            details: null
        });
    }

    // Check for CMP
    if (containerData.cmp === false) {
        checks.push({
            id: 'cmp',
            type: 'warning',
            icon: FaExclamationTriangle,
            title: 'No CMP Detected',
            description: 'No Consent Management Platform detected',
            tags: ['Privacy'],
            details: {
                note: 'A Consent Management Platform (CMP) helps manage user consent for cookies and tracking. Consider integrating a CMP like Cookiebot, OneTrust, or CookieInformation for better privacy compliance.'
            }
        });
    } else if (containerData.cmp) {
        checks.push({
            id: 'cmp',
            type: 'success',
            icon: FaCheckCircle,
            title: 'CMP Detected',
            description: `Consent Management Platform: ${containerData.cmp}`,
            tags: ['Privacy'],
            details: {
                cmp: containerData.cmp,
                note: 'A Consent Management Platform is configured for this container'
            }
        });
    }

    // Check for tags without triggers
    if (containerStats && containerStats.tags > 0 && containerStats.triggers > 0) {
        checks.push({
            id: 'tags-triggers',
            type: 'success',
            icon: FaCheckCircle,
            title: 'Tags and triggers configured',
            description: `${containerStats.tags} tags and ${containerStats.triggers} triggers detected`,
            tags: ['CRO', 'Site speed'],
            details: {
                totalTags: containerStats.tags,
                activeTags: containerStats.activeTags,
                pausedTags: containerStats.pausedTags,
                totalTriggers: containerStats.triggers,
                totalVariables: containerStats.variables,
                tags: allTags.length > 0 ? allTags.slice(0, 10).map(tag => ({
                    name: tag.name || tag.tagId || 'Unnamed Tag',
                    type: tag.type || 'Unknown',
                    paused: tag.paused || false,
                    tagId: tag.tagId
                })) : null,
                triggers: allTriggers.length > 0 ? allTriggers.slice(0, 10).map(trigger => ({
                    name: trigger.name || trigger.triggerId || 'Unnamed Trigger',
                    type: trigger.type || 'Unknown',
                    triggerId: trigger.triggerId
                })) : null
            }
        });
    }

    return (
        <div id="tagstack-insights" className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-2xl font-light text-foreground">Container Health</h2>
                <p className="text-sm text-foreground/50">
                    Analysis and recommendations for GTM container optimization
                </p>
            </div>

            {/* Impact Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-foreground/60 border-b border-border/40 pb-4">
                <div className="flex items-center gap-2">
                    <FaExclamationTriangle className="w-3 h-3 text-red-500" />
                    <span>High Impact</span>
                </div>
                <div className="flex items-center gap-2">
                    <FaClock className="w-3 h-3 text-orange-500" />
                    <span>Medium Impact</span>
                </div>
                <div className="flex items-center gap-2">
                    <FaSquare className="w-3 h-3 text-foreground/30" />
                    <span>Not Applicable</span>
                </div>
                <div className="flex items-center gap-2">
                    <FaCheckCircle className="w-3 h-3 text-green-500" />
                    <span>Passed</span>
                </div>
            </div>

            {/* Checks/Recommendations */}
            <div className="space-y-3">
                {checks.map((check, index) => {
                    const Icon = check.icon;
                    const colorClass = 
                        check.type === 'error' ? 'text-red-500' :
                        check.type === 'warning' ? 'text-orange-500' :
                        'text-green-500';
                    
                    const isExpanded = expandedSections[check.id];
                    const hasDetails = check.details !== null && check.details !== undefined;

                    return (
                        <div
                            key={index}
                            className="border border-border/40 rounded hover:bg-foreground/5 transition-colors"
                        >
                            <div 
                                className={`flex items-start gap-4 p-4 ${hasDetails ? 'cursor-pointer' : ''}`}
                                onClick={hasDetails ? () => toggleSection(check.id) : undefined}
                            >
                                <Icon className={`w-5 h-5 ${colorClass} flex-shrink-0 mt-0.5`} />
                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h4 className="font-light text-foreground mb-1">{check.title}</h4>
                                            <p className="text-sm text-foreground/60">{check.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-wrap gap-1">
                                                {check.tags.map((tag, tagIndex) => (
                                                    <span
                                                        key={tagIndex}
                                                        className="px-2 py-0.5 text-xs bg-foreground/5 text-foreground/60 rounded"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                            {hasDetails && (
                                                <div className="ml-2">
                                                    {isExpanded ? (
                                                        <FaChevronUp className="w-4 h-4 text-foreground/40" />
                                                    ) : (
                                                        <FaChevronDown className="w-4 h-4 text-foreground/40" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Expandable Details */}
                            {hasDetails && isExpanded && (
                                <div className="px-4 pb-4 pt-0 border-t border-border/40 bg-foreground/2">
                                    <div className="pt-4 space-y-4">
                                        {/* Paused Tags Details */}
                                        {check.id === 'paused-tags' && check.details?.items && (
                                            <div>
                                                <h5 className="text-sm font-light text-foreground mb-2">Paused Tags:</h5>
                                                <div className="space-y-2">
                                                    {check.details.items.map((item, idx) => (
                                                        <div key={idx} className="text-sm text-foreground/70 pl-4 border-l-2 border-orange-500/30">
                                                            <div className="font-medium">{item.name}</div>
                                                            <div className="text-xs text-foreground/50">Type: {item.type}</div>
                                                            {item.tagId && (
                                                                <div className="text-xs text-foreground/50">ID: {item.tagId}</div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Consent Mode V2 Details */}
                                        {check.id === 'consent-mode' && check.details?.defaults && (
                                            <div>
                                                <h5 className="text-sm font-light text-foreground mb-2">Consent Defaults:</h5>
                                                <div className="space-y-1 text-sm text-foreground/70">
                                                    {Object.entries(check.details.defaults).map(([key, value]) => (
                                                        <div key={key} className="flex items-center gap-2">
                                                            <span className="w-32 text-foreground/60 capitalize">{key.replace(/_/g, ' ')}:</span>
                                                            <span className={`px-2 py-0.5 rounded text-xs ${
                                                                value === 'granted' || value === 'yes' 
                                                                    ? 'bg-green-500/20 text-green-600' 
                                                                    : 'bg-orange-500/20 text-orange-600'
                                                            }`}>
                                                                {value}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* CMP Details */}
                                        {check.id === 'cmp' && check.details?.note && (
                                            <div>
                                                <p className="text-sm text-foreground/70">{check.details.note}</p>
                                                {check.details.cmp && (
                                                    <div className="mt-2 text-sm text-foreground/60">
                                                        Detected CMP: <span className="font-medium">{check.details.cmp}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Tags and Triggers Details */}
                                        {check.id === 'tags-triggers' && check.details && (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div>
                                                        <div className="text-xs text-foreground/50 mb-1">Total Tags</div>
                                                        <div className="text-lg font-light text-foreground">{check.details.totalTags}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-foreground/50 mb-1">Active Tags</div>
                                                        <div className="text-lg font-light text-green-600">{check.details.activeTags}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-foreground/50 mb-1">Paused Tags</div>
                                                        <div className="text-lg font-light text-orange-600">{check.details.pausedTags}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-foreground/50 mb-1">Triggers</div>
                                                        <div className="text-lg font-light text-foreground">{check.details.totalTriggers}</div>
                                                    </div>
                                                </div>
                                                
                                                {check.details.totalVariables > 0 && (
                                                    <div>
                                                        <div className="text-xs text-foreground/50 mb-1">Variables</div>
                                                        <div className="text-lg font-light text-foreground">{check.details.totalVariables}</div>
                                                    </div>
                                                )}
                                                
                                                {check.details.tags && check.details.tags.length > 0 && (
                                                    <div>
                                                        <h5 className="text-sm font-light text-foreground mb-2">
                                                            Sample Tags ({check.details.tags.length} of {check.details.totalTags}):
                                                        </h5>
                                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                                            {check.details.tags.map((tag, idx) => (
                                                                <div key={idx} className="text-sm text-foreground/70 pl-4 border-l-2 border-border/40">
                                                                    <div className="font-medium">{tag.name}</div>
                                                                    <div className="text-xs text-foreground/50">Type: {tag.type}</div>
                                                                    {tag.paused && (
                                                                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-orange-500/20 text-orange-600 rounded">
                                                                            Paused
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {check.details.triggers && check.details.triggers.length > 0 && (
                                                    <div>
                                                        <h5 className="text-sm font-light text-foreground mb-2">
                                                            Sample Triggers ({check.details.triggers.length} of {check.details.totalTriggers}):
                                                        </h5>
                                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                                            {check.details.triggers.map((trigger, idx) => (
                                                                <div key={idx} className="text-sm text-foreground/70 pl-4 border-l-2 border-border/40">
                                                                    <div className="font-medium">{trigger.name}</div>
                                                                    <div className="text-xs text-foreground/50">Type: {trigger.type}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
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
