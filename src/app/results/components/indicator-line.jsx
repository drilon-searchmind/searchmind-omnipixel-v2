"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function IndicatorLine({ activeSection }) {
    const [markerPosition, setMarkerPosition] = useState(0);
    const [markerHeight, setMarkerHeight] = useState(0);
    const [markerTop, setMarkerTop] = useState(0);
    const containerRef = useRef(null);

    // Calculate marker position based on active section
    const updateMarkerPosition = useCallback(() => {
        // Find the nav element inside the TableOfContents
        const tocContainer = document.querySelector('[data-toc-container]');
        if (!tocContainer) return;

        const nav = tocContainer.querySelector('nav');
        if (!nav) return;

        const activeButton = nav.querySelector(`[data-section-id="${activeSection}"]`);
        if (!activeButton) return;

        // Find the corresponding content section in the main area
        const contentSection = document.getElementById(activeSection);
        if (!contentSection) {
            // Fallback to button height if content section not found
            const buttonRect = activeButton.getBoundingClientRect();
            const containerRect = tocContainer.getBoundingClientRect();
            const position = buttonRect.top - containerRect.top + (buttonRect.height / 2);
            setMarkerPosition(position);
            setMarkerHeight(buttonRect.height);
            setMarkerTop(position - buttonRect.height / 2);
            return;
        }

        // Find the parent flex container (the one with gap-12)
        const flexContainer = tocContainer.closest('.flex.gap-12');
        if (!flexContainer) return;

        const buttonRect = activeButton.getBoundingClientRect();
        const contentRect = contentSection.getBoundingClientRect();
        const containerRect = flexContainer.getBoundingClientRect();

        // Calculate marker position (center of button) relative to flex container
        const buttonCenter = buttonRect.top - containerRect.top + (buttonRect.height / 2);

        // Calculate the visible intersection between content section and viewport
        const viewportTop = containerRect.top;
        const viewportBottom = containerRect.bottom;
        const contentTop = contentRect.top;
        const contentBottom = contentRect.bottom;

        // Find the intersection - how much of content is visible in viewport
        const visibleTop = Math.max(contentTop, viewportTop);
        const visibleBottom = Math.min(contentBottom, viewportBottom);

        // Calculate how much of the content is visible
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);

        // Calculate the top position of the marker relative to the flex container
        const markerStartTop = visibleTop - containerRect.top;

        // If content extends beyond viewport, adjust the marker
        if (visibleHeight > 0) {
            // The marker should extend from where content starts to where it ends
            setMarkerTop(markerStartTop);
            setMarkerHeight(visibleHeight);
            setMarkerPosition(buttonCenter); // Keep button center for horizontal indicator
        } else {
            // Content is not visible in viewport, just show button height
            setMarkerPosition(buttonCenter);
            setMarkerHeight(buttonRect.height);
            setMarkerTop(buttonCenter - buttonRect.height / 2);
        }
    }, [activeSection]);

    // Update position when active section changes
    useEffect(() => {
        updateMarkerPosition();
    }, [activeSection, updateMarkerPosition]);

    // Update position on scroll (for sticky positioning)
    useEffect(() => {
        const handleScroll = () => {
            updateMarkerPosition();
        };

        // Use requestAnimationFrame for smooth updates
        let rafId;
        const throttledScroll = () => {
            if (rafId) return;
            rafId = requestAnimationFrame(() => {
                handleScroll();
                rafId = null;
            });
        };

        window.addEventListener('scroll', throttledScroll, { passive: true });
        window.addEventListener('resize', throttledScroll, { passive: true });

        // Initial calculation
        setTimeout(updateMarkerPosition, 100);

        return () => {
            window.removeEventListener('scroll', throttledScroll);
            window.removeEventListener('resize', throttledScroll);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [updateMarkerPosition]);

    return (
        <div ref={containerRef} className="absolute left-0 top-0 bottom-0 w-px pointer-events-none">
            {/* Vertical line background */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-foreground/20 pointer-events-none" />
            {/* Active section marker */}
            {markerPosition > 0 && markerHeight > 0 && (
                <>
                    {/* Horizontal line extending left from vertical line - points to button */}
                    <div
                        className="absolute bg-foreground/60 transition-all duration-300 ease-out pointer-events-none"
                        style={{
                            left: '0px',
                            top: `${markerPosition - 1}px`,
                            width: '8px',
                            height: '2px'
                        }}
                    />
                    {/* Vertical highlight bar - extends to match content section height */}
                    <div
                        className="absolute left-0 w-1 bg-foreground/60 transition-all duration-300 ease-out pointer-events-none"
                        style={{
                            top: `${markerTop}px`,
                            height: `${markerHeight}px`,
                            transform: 'translateX(0)'
                        }}
                    />
                </>
            )}
        </div>
    );
}
