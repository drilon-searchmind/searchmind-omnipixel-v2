"use client";

import { useState } from "react";
import { FaGoogle, FaFacebook, FaTag, FaChartLine, FaChevronDown, FaChevronUp } from "react-icons/fa";

export function MartechSummary({ results }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const tagstackInfo = results.tagstackInfo;
    const marketingScripts = results.marketingScripts || {};

    if (!tagstackInfo) {
        return null;
    }

    // Build list of detected technologies
    const technologies = [];

    // GTM Container
    if (marketingScripts.gtm?.found) {
        technologies.push({
            icon: FaTag,
            name: 'Google Tag Manager',
            id: marketingScripts.gtm.containerId
        });
    }

    // GA4 Streams
    if (tagstackInfo.ga4Streams && tagstackInfo.ga4Streams.length > 0) {
        tagstackInfo.ga4Streams.forEach(stream => {
            technologies.push({
                icon: FaGoogle,
                name: 'Google Analytics 4 Event',
                id: stream.id
            });

            // Enhanced Measurement
            if (stream.enhancedMeasurement && stream.enhancedMeasurement.length > 0) {
                stream.enhancedMeasurement.forEach(em => {
                    technologies.push({
                        icon: FaGoogle,
                        name: `GA4 Enhanced Measurement - ${em.name}`,
                        id: stream.id
                    });
                });
            }

            // Linking
            if (stream.linking && stream.linking.length > 0) {
                stream.linking.forEach(link => {
                    technologies.push({
                        icon: FaChartLine,
                        name: link.name,
                        id: stream.id
                    });
                });
            }
        });
    }

    // GA4 from detected IDs
    if (tagstackInfo.detectedIds?.ga4 && tagstackInfo.detectedIds.ga4.length > 0) {
        tagstackInfo.detectedIds.ga4.forEach(id => {
            if (!technologies.find(t => t.id === id)) {
                technologies.push({
                    icon: FaGoogle,
                    name: 'Google Analytics 4',
                    id: id
                });
            }
        });
    }

    // Google Ads
    if (marketingScripts.googleAds?.found) {
        marketingScripts.googleAds.conversionIds?.forEach(id => {
            technologies.push({
                icon: FaChartLine,
                name: 'Google Ads Conversion Tracking',
                id: id
            });
        });
    }

    // Facebook Pixel
    if (marketingScripts.meta?.found) {
        marketingScripts.meta.pixelIds?.forEach(id => {
            technologies.push({
                icon: FaFacebook,
                name: 'Meta Pixel',
                id: id
            });
        });
    }

    // Consent Mode
    if (tagstackInfo.consentModeV2) {
        technologies.push({
            icon: FaTag,
            name: 'Consent Mode',
            id: null
        });

        // Add consent defaults as separate entries
        if (tagstackInfo.consentDefaults) {
            Object.keys(tagstackInfo.consentDefaults).forEach(key => {
                technologies.push({
                    icon: FaTag,
                    name: `Consent Mode - ${key.replace(/_/g, ' ')}`,
                    id: null
                });
            });
        }
    }

    // GTM Tags from Tagstack (using container stats instead of full tags array)
    // Note: We can't show individual tag types without the full tags array,
    // but we can show the total count from containerStats
    if (tagstackInfo.containerStats) {
        Object.entries(tagstackInfo.containerStats).forEach(([containerId, stats]) => {
            if (stats.tags > 0) {
                technologies.push({
                    icon: FaTag,
                    name: `GTM Tags (${containerId})`,
                    id: containerId,
                    count: stats.tags
                });
            }
        });
    }

    if (technologies.length === 0) {
        return null;
    }

    const primaryContainerId = results.gtmInfo?.containers?.[0];

    return (
        <div id="martech-summary" className="space-y-8">
            <div className="space-y-2">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity group"
                >
                    <div className="flex items-center gap-2">
                        <FaTag className="w-5 h-5 text-foreground/50" />
                        <h2 className="text-2xl font-light text-foreground">Martech Summary</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-foreground/50">
                            {technologies.length} technology{technologies.length !== 1 ? 'ies' : ''}
                            {primaryContainerId && ` on ${primaryContainerId}`}
                        </div>
                        {isExpanded ? (
                            <FaChevronUp className="w-4 h-4 text-foreground/50 group-hover:text-foreground transition-colors" />
                        ) : (
                            <FaChevronDown className="w-4 h-4 text-foreground/50 group-hover:text-foreground transition-colors" />
                        )}
                    </div>
                </button>
            </div>

            {isExpanded && (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {technologies.map((tech, index) => {
                        const Icon = tech.icon;
                        return (
                            <div
                                key={index}
                                className="flex items-center gap-3 p-4 border border-border/40 rounded hover:bg-foreground/5 transition-colors cursor-pointer"
                            >
                                <Icon className="w-5 h-5 text-foreground/50 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-light text-foreground text-sm truncate">
                                        {tech.name}
                                    </div>
                                    {tech.id && (
                                        <div className="text-xs text-foreground/50 truncate">
                                            {tech.id}
                                        </div>
                                    )}
                                    {tech.count && (
                                        <div className="text-xs text-foreground/50">
                                            {tech.count} tag{tech.count !== 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
