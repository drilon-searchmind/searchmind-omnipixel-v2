import { FaCheckCircle, FaExclamationTriangle, FaClock, FaSquare } from "react-icons/fa";

export function TagstackInsights({ results }) {
    const tagstackInfo = results.tagstackInfo;
    const gtmInfo = results.gtmInfo;

    if (!tagstackInfo || !gtmInfo?.found) {
        return null;
    }

    const primaryContainerId = gtmInfo.containers[0];
    const containerData = tagstackInfo.gtmContainers?.find(c => c.id === primaryContainerId);

    if (!containerData) {
        return null;
    }

    // Build recommendations/checks based on Tagstack data
    const checks = [];
    
    // Get container stats
    const containerStats = tagstackInfo.containerStats?.[primaryContainerId];

    // Check for paused tags (use stats instead of full tags array)
    if (containerStats && containerStats.pausedTags > 0) {
        checks.push({
            type: 'warning',
            icon: FaClock,
            title: 'Avoid keeping paused tags',
            description: `${containerStats.pausedTags} paused tag(s) found`,
            tags: ['Site speed']
        });
    }

    // Check for Consent Mode V2
    if (containerData.consentMode) {
        checks.push({
            type: 'success',
            icon: FaCheckCircle,
            title: 'Consent Mode V2 Enabled',
            description: 'Google Consent Mode V2 is properly configured',
            tags: ['Privacy', 'Compliance']
        });
    } else {
        checks.push({
            type: 'error',
            icon: FaExclamationTriangle,
            title: 'Consent Mode V2 Not Enabled',
            description: 'Consider enabling Consent Mode V2 for better privacy compliance',
            tags: ['Privacy', 'Compliance']
        });
    }

    // Check for CMP
    if (containerData.cmp === false) {
        checks.push({
            type: 'warning',
            icon: FaExclamationTriangle,
            title: 'No CMP Detected',
            description: 'No Consent Management Platform detected',
            tags: ['Privacy']
        });
    }

    // Check for tags without triggers
    // Note: We can't check this without full tags array, but we can check if stats are balanced
    if (containerStats && containerStats.tags > 0 && containerStats.triggers > 0) {
        checks.push({
            type: 'success',
            icon: FaCheckCircle,
            title: 'Tags and triggers configured',
            description: `${containerStats.tags} tags and ${containerStats.triggers} triggers detected`,
            tags: ['CRO', 'Site speed']
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

                    return (
                        <div
                            key={index}
                            className="flex items-start gap-4 p-4 border border-border/40 rounded hover:bg-foreground/5 transition-colors"
                        >
                            <Icon className={`w-5 h-5 ${colorClass} flex-shrink-0 mt-0.5`} />
                            <div className="flex-1">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <h4 className="font-light text-foreground mb-1">{check.title}</h4>
                                        <p className="text-sm text-foreground/60">{check.description}</p>
                                    </div>
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
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
