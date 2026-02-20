"use client";

import { useEffect } from "react";

/**
 * Hook to track active section using Intersection Observer
 */
export function useIntersectionObserver(results, setActiveSection) {
    useEffect(() => {
        if (!results) return;

        const STICKY_THRESHOLD = 200; // Pixels from top to consider "sticky"
        const MIN_SECTION_HEIGHT = 100; // Minimum height to consider a section "small"

        const observerOptions = {
            root: null,
            rootMargin: '-80px 0px -50% 0px',
            threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
        };

        const observerCallback = (entries) => {
            // Get all visible sections sorted by their position
            const visibleSections = entries
                .filter(entry => entry.isIntersecting)
                .map(entry => {
                    const rect = entry.boundingClientRect;
                    const distanceFromTop = rect.top;
                    const sectionHeight = rect.height;
                    const isSmall = sectionHeight < MIN_SECTION_HEIGHT;
                    const isNearTop = distanceFromTop < STICKY_THRESHOLD && distanceFromTop > -rect.height;

                    return {
                        id: entry.target.id,
                        distanceFromTop,
                        sectionHeight,
                        isSmall,
                        isNearTop,
                        intersectionRatio: entry.intersectionRatio,
                        rect
                    };
                })
                .sort((a, b) => {
                    // Prioritize sections near the top
                    if (a.isNearTop && !b.isNearTop) return -1;
                    if (!a.isNearTop && b.isNearTop) return 1;
                    // Then by distance from top
                    return a.distanceFromTop - b.distanceFromTop;
                });

            if (visibleSections.length > 0) {
                // Check if there's a small section near the top that should be sticky
                const stickySection = visibleSections.find(s => s.isSmall && s.isNearTop);

                if (stickySection) {
                    // Keep the small section active if it's near the top
                    setActiveSection(stickySection.id);
                } else {
                    // Otherwise, use the first visible section (closest to top)
                    setActiveSection(visibleSections[0].id);
                }
            }
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        // Observe all sections
        const sections = [
            'overview',
            'detailed-scores',
            'marketing-scripts',
            'performance',
            'gtm-analysis',
            'tagstack-insights',
            'martech-summary',
            'jsonld-analysis',
            'privacy-cookies'
        ];
        
        sections.forEach((sectionId) => {
            const element = document.getElementById(sectionId);
            if (element) {
                observer.observe(element);
            } else {
                console.warn(`Section element not found: ${sectionId}`);
            }
        });

        return () => observer.disconnect();
    }, [results, setActiveSection]);
}
