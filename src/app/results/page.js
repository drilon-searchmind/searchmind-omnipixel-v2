"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
    FaGoogle,
    FaFacebook,
    FaTiktok,
    FaLinkedin,
    FaTag,
    FaChartLine,
    FaCheck,
    FaServer,
    FaShieldAlt,
    FaTachometerAlt,
    FaCode,
    FaDatabase
} from "react-icons/fa";

// Import result components
import { ScoreOverview } from "@/components/results/score-overview";
import { DetailedScores } from "@/components/results/detailed-scores";
import { MarketingScripts } from "@/components/results/marketing-scripts";
import { PerformanceMetrics } from "@/components/results/performance-metrics";
import { GTMAnalysis } from "@/components/results/gtm-analysis";
import { PrivacyCookies } from "@/components/results/privacy-cookies";
import { TagstackInsights } from "@/components/results/tagstack-insights";
import { MartechSummary } from "@/components/results/martech-summary";
import { JsonLdAnalysis } from "@/components/results/jsonld-analysis";
import { DataLayerInspection } from "@/components/results/datalayer-inspection";

// Indicator Line Component - shows active section marker
function IndicatorLine({ activeSection }) {
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
        const tocRect = tocContainer.getBoundingClientRect();

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

// Table of Contents Sidebar Component
function TableOfContents({ activeSection, onSectionClick, isMobile = false, onClose }) {
    const sections = [
        { id: 'overview', title: 'Overview & Scores', icon: FaTachometerAlt },
        { id: 'detailed-scores', title: 'Detailed Scores', icon: FaChartLine },
        { id: 'datalayer-inspection', title: 'DataLayer Inspection', icon: FaDatabase },
        { id: 'marketing-scripts', title: 'Marketing Scripts', icon: FaTag },
        { id: 'performance', title: 'Performance Metrics', icon: FaTachometerAlt },
        { id: 'gtm-analysis', title: 'GTM Analysis', icon: FaGoogle },
        { id: 'tagstack-insights', title: 'Container Health', icon: FaShieldAlt },
        { id: 'martech-summary', title: 'Martech Summary', icon: FaTag },
        { id: 'jsonld-analysis', title: 'JSON-LD Structured Data', icon: FaCode },
        { id: 'privacy-cookies', title: 'Privacy & Cookies', icon: FaShieldAlt }
    ];

    const handleSectionClick = (sectionId) => {
        onSectionClick(sectionId);
        if (isMobile && onClose) onClose();
    };

    return (
        <div className={`${isMobile ? 'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm' : 'sticky top-20 h-fit overflow-y-auto'}`} data-toc-container>
            <div className={`bg-background border border-border/40 rounded p-4 ${isMobile ? 'fixed top-20 left-4 right-4 max-w-sm mx-auto' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-normal text-xs uppercase tracking-wider text-foreground/50">
                        Contents
                    </h3>
                    {isMobile && (
                        <button
                            onClick={onClose}
                            className="p-1 rounded hover:bg-secondary transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
                <nav className="space-y-0.5">

                    {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <button
                                key={section.id}
                                data-section-id={section.id}
                                onClick={() => handleSectionClick(section.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm rounded transition-colors relative ${activeSection === section.id
                                        ? 'bg-foreground text-background font-normal'
                                        : 'text-foreground/60 hover:text-foreground hover:bg-secondary/50 font-light'
                                    }`}
                            >
                                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{section.title}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}

function ResultsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const url = searchParams.get("url");
    const sessionId = searchParams.get("sessionId");
    const scanDataParam = searchParams.get("scanData"); // Legacy support

    const [results, setResults] = useState(null);
    const [activeSection, setActiveSection] = useState('overview');
    const [showMobileTOC, setShowMobileTOC] = useState(false);
    const [error, setError] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const contentRef = useRef(null);

    // Intersection Observer for active section tracking with sticky threshold for small sections
    useEffect(() => {
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

        // Observe all sections (including new ones)
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
    }, [results]); // Re-run when results are loaded

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            const offsetTop = element.offsetTop - 100; // Account for sticky header
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    };

    const handleExportToPDF = async () => {
        if (isExporting || !results) return;

        setIsExporting(true);

        try {
            // Dynamically import libraries (client-side only)
            // Use html2canvas-pro which supports modern CSS color functions like oklab()
            const html2canvas = (await import('html2canvas-pro')).default;
            const { jsPDF } = await import('jspdf');

            // Get the main content container (exclude sidebar)
            const mainContent = document.querySelector('.flex-1.min-w-0') ||
                document.querySelector('.results-content-container .flex-1') ||
                document.querySelector('.results-content-container');

            if (!mainContent) {
                console.error('Could not find content element to export');
                setIsExporting(false);
                return;
            }

            // Generate filename from URL
            const urlSlug = displayResults.url
                ?.replace(/https?:\/\//, '')
                .replace(/\/$/, '')
                .replace(/\//g, '-')
                .substring(0, 50) || 'report';
            const dateStr = new Date().toISOString().split('T')[0];
            const filename = `omnipixel-report-${urlSlug}-${dateStr}.pdf`;

            // Store original styles to restore later
            const elementsToHide = [];

            // Hide sidebar TOC
            const sidebarTOC = document.querySelector('.hidden.lg\\:block');
            if (sidebarTOC) {
                elementsToHide.push({
                    element: sidebarTOC,
                    originalDisplay: sidebarTOC.style.display
                });
                sidebarTOC.style.display = 'none';
            }

            // Hide mobile TOC button
            const mobileTOCButton = document.querySelector('.lg\\:hidden');
            if (mobileTOCButton && mobileTOCButton.closest('.flex.flex-wrap')) {
                elementsToHide.push({
                    element: mobileTOCButton,
                    originalDisplay: mobileTOCButton.style.display
                });
                mobileTOCButton.style.display = 'none';
            }

            // Hide action buttons (New Scan, Re-scan, Export) for cleaner PDF
            const actionButtons = document.querySelectorAll('.flex.flex-wrap.items-center.gap-3 button');
            actionButtons.forEach(btn => {
                if (btn.textContent?.includes('New Scan') ||
                    btn.textContent?.includes('Re-scan') ||
                    btn.textContent?.includes('Export')) {
                    elementsToHide.push({
                        element: btn,
                        originalDisplay: btn.style.display
                    });
                    btn.style.display = 'none';
                }
            });

            // Scroll to top to ensure full content is captured
            window.scrollTo(0, 0);

            // Wait for DOM updates and scroll
            await new Promise(resolve => setTimeout(resolve, 500));

            // Convert HTML to canvas using html2canvas-pro (supports oklab colors)
            // Use white background for PDF (page background should be white)
            const canvas = await html2canvas(mainContent, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff', // White background for PDF
                windowWidth: mainContent.scrollWidth,
                windowHeight: mainContent.scrollHeight,
                allowTaint: false,
                removeContainer: false
            });

            // Calculate PDF dimensions with padding
            const padding = 17; // 4rem/64px ≈ 17mm (64px / 96px per inch * 25.4mm per inch)
            const pageWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const availableWidth = pageWidth - (padding * 2); // Account for left and right padding
            const availableHeight = pageHeight - (padding * 2); // Account for top and bottom padding
            const imgWidth = availableWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Create PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            let yPosition = padding; // Start with top padding
            let heightLeft = imgHeight;

            // Calculate pixels per mm for slicing
            const pixelsPerMM = canvas.height / imgHeight;
            const pixelsPerPage = availableHeight * pixelsPerMM;
            let sourceY = 0; // Current position in source canvas

            // Add pages until all content is rendered
            while (sourceY < canvas.height) {
                // Calculate how much of the image to show on this page
                const remainingPixels = canvas.height - sourceY;
                const pagePixels = Math.min(pixelsPerPage, remainingPixels);
                const pageDisplayHeight = pagePixels / pixelsPerMM;

                // Create a temporary canvas for this page slice
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = canvas.width;
                pageCanvas.height = pagePixels;
                const ctx = pageCanvas.getContext('2d');
                ctx.drawImage(canvas, 0, sourceY, canvas.width, pagePixels, 0, 0, canvas.width, pagePixels);

                // Add image slice to PDF with padding
                pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', padding, yPosition, imgWidth, pageDisplayHeight);

                // Move to next page if there's more content
                sourceY += pagePixels;
                if (sourceY < canvas.height) {
                    pdf.addPage();
                    yPosition = padding; // Reset Y position for new page
                }
            }

            // Save PDF
            pdf.save(filename);

            // Restore all hidden elements
            elementsToHide.forEach(({ element, originalDisplay }) => {
                if (element && originalDisplay !== undefined) {
                    element.style.display = originalDisplay;
                } else if (element) {
                    element.style.display = '';
                }
            });

            console.log('PDF exported successfully:', filename);
        } catch (error) {
            console.error('Failed to export PDF:', error);
            alert('Failed to export PDF. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    useEffect(() => {
        if (!url) {
            router.push("/");
            return;
        }

        // Ensure we're on client side before accessing localStorage
        if (typeof window === 'undefined') {
            return;
        }

        // Async function to load scan data
        const loadScanData = async () => {
            // Check if localStorage is available
            if (typeof Storage === 'undefined' || typeof localStorage === 'undefined') {
                console.error('localStorage is not available in this browser');
                setError('localStorage is not supported in this browser. Please use a modern browser.');
                return;
            }

            // Try to get scan data from localStorage first (new method)
            let scanData = null;
            if (sessionId) {
                try {
                    const storageKey = `scan_${sessionId}`;
                    console.log('Looking for scan data in localStorage with key:', storageKey);
                    console.log('localStorage length:', localStorage.length);

                    // List all keys for debugging
                    const allKeys = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        allKeys.push(key);
                    }
                    console.log('All localStorage keys:', allKeys);
                    console.log('Keys starting with "scan_":', allKeys.filter(k => k && k.startsWith('scan_')));

                    // Try immediate read first
                    let storedData = localStorage.getItem(storageKey);
                    console.log('Initial read result:', storedData ? `${storedData.length} characters` : 'null');

                    // If not found, wait a bit and retry (in case storage just completed)
                    if (!storedData) {
                        console.log('Data not found immediately, waiting 500ms...');
                        await new Promise(resolve => setTimeout(resolve, 500));
                        storedData = localStorage.getItem(storageKey);
                        console.log('After wait, read result:', storedData ? `${storedData.length} characters` : 'null');
                    }

                    if (storedData) {
                        console.log('Found data in localStorage, size:', storedData.length, 'characters');
                        scanData = JSON.parse(storedData);
                        console.log('✅ Loaded scan data from localStorage');
                        console.log('Scan data keys:', Object.keys(scanData));
                        console.log('GTM Info:', scanData.gtmInfo);
                        console.log('Tagstack Info:', scanData.tagstackInfo ? 'Present' : 'Missing');
                        console.log('Performance:', scanData.performance ? 'Present' : 'Missing');
                        console.log('Cookie Info:', scanData.cookieInfo ? 'Present' : 'Missing');
                        // Don't remove immediately - keep it for a while in case of page reload
                        // Clean up old scans (older than 1 hour) instead
                        const oneHourAgo = Date.now() - (60 * 60 * 1000);
                        for (let i = localStorage.length - 1; i >= 0; i--) {
                            const key = localStorage.key(i);
                            if (key && key.startsWith('scan_') && key !== storageKey) {
                                try {
                                    const timestamp = parseInt(key.split('_')[1]);
                                    if (timestamp && timestamp < oneHourAgo) {
                                        console.log('Cleaning up old scan data:', key);
                                        localStorage.removeItem(key);
                                    }
                                } catch (e) {
                                    // Ignore parsing errors
                                }
                            }
                        }
                    } else {
                        console.warn('No data found in localStorage for key:', storageKey);
                        // List all localStorage keys for debugging
                        const allKeys = [];
                        for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key && key.startsWith('scan_')) {
                                allKeys.push(key);
                            }
                        }
                        console.log('Available scan keys in localStorage:', allKeys);

                        // Fallback: Try to find the most recent scan data if exact match not found
                        // This handles cases where sessionId might not match exactly
                        if (allKeys.length > 0) {
                            console.log('Attempting fallback: checking all scan keys for matching URL...');
                            let foundMatch = false;

                            // Sort keys by timestamp (most recent first)
                            const sortedKeys = allKeys.sort((a, b) => {
                                const timestampA = parseInt(a.split('_')[1] || '0');
                                const timestampB = parseInt(b.split('_')[1] || '0');
                                return timestampB - timestampA;
                            });

                            // Try to find a match by URL
                            for (const key of sortedKeys) {
                                try {
                                    const candidateData = localStorage.getItem(key);
                                    if (candidateData) {
                                        const parsed = JSON.parse(candidateData);
                                        // Check if URL matches (allowing for trailing slash differences)
                                        const candidateUrl = parsed.url?.replace(/\/$/, '');
                                        const targetUrl = url?.replace(/\/$/, '');
                                        if (candidateUrl === targetUrl) {
                                            console.log(`✅ Found matching scan data in fallback key: ${key}`);
                                            scanData = parsed;
                                            localStorage.removeItem(key);
                                            foundMatch = true;
                                            break;
                                        }
                                    }
                                } catch (e) {
                                    console.warn(`Failed to parse candidate data from ${key}:`, e);
                                }
                            }

                            if (!foundMatch && sortedKeys.length > 0) {
                                // Last resort: use the most recent scan data regardless of URL
                                console.log('No URL match found, using most recent scan data as fallback...');
                                try {
                                    const mostRecentKey = sortedKeys[0];
                                    const mostRecentData = localStorage.getItem(mostRecentKey);
                                    if (mostRecentData) {
                                        scanData = JSON.parse(mostRecentData);
                                        console.log(`✅ Using most recent scan data from key: ${mostRecentKey}`);
                                        localStorage.removeItem(mostRecentKey);
                                    }
                                } catch (e) {
                                    console.error('Failed to use fallback data:', e);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('Failed to load scan data from sessionStorage:', error);
                }
            } else {
                console.log('No sessionId provided in URL');
            }

            // Fallback to URL parameter (legacy support, but may fail for large data)
            if (!scanData && scanDataParam) {
                try {
                    scanData = JSON.parse(decodeURIComponent(scanDataParam));
                    console.log('Loaded scan data from URL parameter');
                } catch (error) {
                    console.warn('Failed to parse scan data from URL:', error);
                }
            }

            // Check if we have real scan data from the scanner
            if (scanData && scanData.success !== false) {
                try {
                    console.log('Processing real scan data...');
                    console.log('GTM Info:', scanData.gtmInfo);
                    console.log('Tagstack Info present:', !!scanData.tagstackInfo);
                    console.log('Performance present:', !!scanData.performance);
                    console.log('Cookie Info present:', !!scanData.cookieInfo);
                    console.log('DataLayer present:', !!scanData.dataLayer);

                    // Merge real scan data - use actual data, no fallbacks to mock
                    setResults({
                        url: url,
                        scannedAt: new Date().toISOString(),
                        // Use real page info if available
                        pageInfo: scanData.pageInfo || null,
                        // Use real cookie info from scan
                        cookieInfo: scanData.cookieInfo || null,
                        // Use real performance data from scan
                        performance: scanData.performance || null,
                        // Use real GTM info from scan
                        gtmInfo: scanData.gtmInfo || null,
                        // Use Tagstack data if available
                        tagstackInfo: scanData.tagstackInfo || null,
                        // Use JSON-LD structured data if available
                        jsonLdInfo: scanData.jsonLdInfo || null,
                        // Use dataLayer if available
                        dataLayer: scanData.dataLayer || null,
                        // Use Consent Mode V2 from Tagstack, fallback to scan data
                        consentModeV2: scanData.tagstackInfo?.consentModeV2 ?? scanData.consentModeV2 ?? false,
                        // Use server-side tracking from Tagstack, fallback to scan data
                        serverSideTracking: scanData.tagstackInfo?.serverSideTracking ?? scanData.serverSideTracking ?? false,
                        // Include server-side tracking platform info
                        serverSideTrackingPlatform: scanData.serverSideTrackingPlatform || null,
                        serverSideTrackingPlatforms: scanData.serverSideTrackingPlatforms || [],
                        marketingScripts: {
                            gtm: {
                                found: scanData.gtmInfo?.found || false,
                                containerId: scanData.gtmInfo?.containers?.[0] || null,
                                containers: scanData.gtmInfo?.containers || [],
                                count: scanData.gtmInfo?.count || 0,
                                version: scanData.gtmInfo?.found ? "v2" : null,
                                lastUpdated: null,
                                // Add Tagstack stats if available
                                tags: scanData.tagstackInfo?.containerStats?.[scanData.gtmInfo?.containers?.[0]]?.tags || null,
                                activeTags: scanData.tagstackInfo?.containerStats?.[scanData.gtmInfo?.containers?.[0]]?.activeTags || null,
                                pausedTags: scanData.tagstackInfo?.containerStats?.[scanData.gtmInfo?.containers?.[0]]?.pausedTags || null,
                                variables: scanData.tagstackInfo?.containerStats?.[scanData.gtmInfo?.containers?.[0]]?.variables || null,
                                triggers: scanData.tagstackInfo?.containerStats?.[scanData.gtmInfo?.containers?.[0]]?.triggers || null
                            },
                            ga4: {
                                found: (scanData.tagstackInfo?.detectedIds?.ga4?.length || 0) > 0,
                                measurementId: scanData.tagstackInfo?.detectedIds?.ga4?.[0] || null,
                                measurementIds: scanData.tagstackInfo?.detectedIds?.ga4 || [],
                                enhancedEcommerce: scanData.tagstackInfo?.ga4Streams?.some(s => s.enhancedMeasurement?.length > 0) || false,
                                crossDomainTracking: false,
                                streams: scanData.tagstackInfo?.ga4Streams || []
                            },
                            meta: {
                                found: (scanData.pixelInfo?.meta?.found || scanData.tagstackInfo?.detectedIds?.facebookPixel?.length || 0) > 0,
                                pixelId: scanData.pixelInfo?.meta?.pixelId || scanData.tagstackInfo?.detectedIds?.facebookPixel?.[0] || null,
                                pixelIds: [
                                    ...(scanData.pixelInfo?.meta?.pixelIds || []),
                                    ...(scanData.tagstackInfo?.detectedIds?.facebookPixel || [])
                                ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
                                conversionsApi: false, // TODO: Extract from Tagstack if available
                                customAudiences: false
                            },
                            tiktok: {
                                found: (scanData.pixelInfo?.tiktok?.found || scanData.tagstackInfo?.detectedIds?.tiktokPixel?.length || 0) > 0,
                                pixelId: scanData.pixelInfo?.tiktok?.pixelId || scanData.tagstackInfo?.detectedIds?.tiktokPixel?.[0] || null,
                                pixelIds: [
                                    ...(scanData.pixelInfo?.tiktok?.pixelIds || []),
                                    ...(scanData.tagstackInfo?.detectedIds?.tiktokPixel || [])
                                ].filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
                            },
                            linkedin: {
                                found: (scanData.pixelInfo?.linkedin?.found || scanData.tagstackInfo?.detectedIds?.linkedinPixel?.length || 0) > 0,
                                pixelId: scanData.pixelInfo?.linkedin?.pixelId || scanData.tagstackInfo?.detectedIds?.linkedinPixel?.[0] || null,
                                pixelIds: [
                                    ...(scanData.pixelInfo?.linkedin?.pixelIds || []),
                                    ...(scanData.tagstackInfo?.detectedIds?.linkedinPixel || [])
                                ].filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
                            },
                            googleAds: {
                                found: (scanData.pixelInfo?.googleAds?.found || scanData.tagstackInfo?.detectedIds?.googleAds?.length || 0) > 0,
                                conversionId: scanData.pixelInfo?.googleAds?.conversionId || scanData.tagstackInfo?.detectedIds?.googleAds?.[0] || null,
                                conversionIds: [
                                    ...(scanData.pixelInfo?.googleAds?.conversionIds || []),
                                    ...(scanData.tagstackInfo?.detectedIds?.googleAds || [])
                                ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
                                remarketing: false
                            },
                            platforms: {
                                reaktion: {
                                    found: scanData.pixelInfo?.platforms?.reaktion?.found || false,
                                    methods: scanData.pixelInfo?.platforms?.reaktion?.methods || []
                                },
                                profitmetrics: {
                                    found: scanData.pixelInfo?.platforms?.profitmetrics?.found || false,
                                    methods: scanData.pixelInfo?.platforms?.profitmetrics?.methods || []
                                },
                                triplewhale: {
                                    found: scanData.pixelInfo?.platforms?.triplewhale?.found || false,
                                    methods: scanData.pixelInfo?.platforms?.triplewhale?.methods || []
                                }
                            }
                        },
                        scores: {
                            privacy: 85,
                            performance: scanData.performance?.performanceScore || 78,
                            tracking: 92,
                            compliance: 88
                        }
                    });

                    console.log('✅ Results set with real scan data');
                    return;
                } catch (error) {
                    console.error('❌ Failed to process scan data:', error);
                    console.error('Error stack:', error.stack);
                    // Don't fall back to mock data - show error or redirect
                    setError('Failed to load scan results. Please try scanning again.');
                    return;
                }
            }

            // If no scan data found and no sessionId/scanDataParam, redirect to scan page
            if (!scanData && !sessionId && !scanDataParam) {
                console.log('No scan data provided, redirecting to scan page');
                router.push('/');
                return;
            }

            // If we have sessionId but no data, show error
            if (sessionId && !scanData) {
                console.error('Session ID provided but no data found in localStorage');
                setError('Scan results not found. The scan may have expired or been cleared. Please try scanning again.');
                return;
            }

            // Enhanced mock results with new technical structure (only if no real data)
            if (!scanData) {
                setResults({
                    url: url,
                    scannedAt: new Date().toISOString(),
                    // Technical compliance indicators
                    consentModeV2: true,
                    serverSideTracking: false,
                    // Marketing scripts with detailed technical info
                    marketingScripts: {
                        gtm: {
                            found: false,
                            containerId: null,
                            version: null,
                            lastUpdated: null
                        },
                        ga4: {
                            found: true,
                            measurementId: "G-XXXXXXXXXX",
                            enhancedEcommerce: true,
                            crossDomainTracking: false
                        },
                        meta: {
                            found: true,
                            pixelId: "123456789012345",
                            conversionsApi: true,
                            customAudiences: true
                        },
                        tiktok: {
                            found: true,
                            pixelId: "XXXXXXXXXXXXXXX",
                            eventsApi: false
                        },
                        linkedin: {
                            found: false,
                            pixelId: null
                        },
                        googleAds: {
                            found: true,
                            conversionId: "AW-XXXXXXXXX",
                            remarketing: true
                        }
                    },
                    // Scoring system (0-100 for each category)
                    scores: {
                        privacy: 85,
                        performance: 78,
                        tracking: 92,
                        compliance: 88
                    },
                    // Core Web Vitals and performance metrics
                    performance: {
                        performanceScore: 78,
                        firstContentfulPaint: 1200,
                        largestContentfulPaint: 3100,
                        firstInputDelay: 45,
                        cumulativeLayoutShift: 0.08,
                        timeToFirstByte: 450,
                        speedIndex: 2800,
                        timeToInteractive: 2500,
                        loadTime: 2.3
                    },
                    // GTM Analysis placeholder
                    gtmInfo: {
                        found: false,
                        containers: [],
                        count: 0
                    }
                });
            }
        };

        // Call the async function
        loadScanData();
    }, [url, sessionId, scanDataParam, router]);

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center p-8">
                <div className="w-full max-w-md space-y-6">
                    <div className="space-y-2 text-center">
                        <h2 className="text-2xl font-light text-foreground">Error Loading Results</h2>
                        <p className="text-sm text-foreground/60">{error}</p>
                    </div>
                    <Button onClick={() => router.push("/")} className="w-full">
                        Start New Scan
                    </Button>
                </div>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="flex min-h-screen items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-foreground/20 border-t-foreground"></div>
            </div>
        );
    }

    // Calculate individual scores and overall score
    const calculateScores = (results) => {
        // Start with base scores from results (but tracking will be recalculated from scratch)
        let performanceScore = results.scores?.performance || 0;
        let privacyScore = results.scores?.privacy || 0;
        // trackingScore will be calculated from scratch, ignore initial value
        let trackingScore = 0; // Will be reset to 50 below
        let complianceScore = results.scores?.compliance || 0;

        // Adjust performance score based on actual performance metrics
        if (results.performance?.performanceScore !== undefined) {
            // Use actual PageSpeed Insights score if available
            performanceScore = results.performance.performanceScore;
        }

        // Calculate Privacy Score from scratch - BE MORE CRITICAL
        // Based on 2026 privacy standards (GDPR, CCPA, ePrivacy)
        privacyScore = 0; // Start from 0

        const cookieInfo = results.cookieInfo || {};
        const cmp = cookieInfo.cmp || {};
        const cookies = cookieInfo.cookies || {};

        // 1. CMP Implementation Quality (30 points)
        if (cmp.confidence === 'high') {
            privacyScore += 30; // High-confidence CMP (CookieInformation, OneTrust, Cookiebot, etc.)
        } else if (cmp.confidence === 'low' || cmp.name) {
            privacyScore += 15; // Low-confidence or generic CMP
        } else {
            privacyScore += 0; // No CMP detected - major privacy concern
        }

        // 2. Consent Mode V2 Implementation (25 points) - CRITICAL for privacy
        if (results.consentModeV2) {
            privacyScore += 25; // Strong bonus for Consent Mode V2
        } else {
            privacyScore -= 10; // Penalty for missing Consent Mode V2
        }

        // 3. Cookie Transparency & Disclosure (20 points)
        if (cookies.count !== undefined && cookies.count > 0) {
            privacyScore += 10; // Cookie count is disclosed
        }
        if (cookies.keys && cookies.keys.length > 0) {
            privacyScore += 5; // Cookie names are accessible
        }
        if (cookies.domains && cookies.domains > 1) {
            // Multiple domains can indicate third-party tracking
            if (cookies.domains <= 3) {
                privacyScore += 5; // Reasonable number of domains
            } else {
                privacyScore -= 5; // Too many domains (privacy concern)
            }
        }

        // 4. Cookie Management & User Control (15 points)
        if (cookieInfo.accepted && cmp.name) {
            // If CMP is detected, assume granular controls exist
            if (cmp.confidence === 'high') {
                privacyScore += 15; // High-confidence CMPs typically have granular controls
            } else {
                privacyScore += 5; // Basic controls assumed
            }
        } else if (cookieInfo.accepted && !cmp.name) {
            privacyScore += 0; // No CMP means no proper controls
        }

        // 5. Data Minimization (10 points)
        const cookieCount = cookies.count || 0;
        if (cookieCount === 0) {
            privacyScore += 0; // No cookies (but also no functionality)
        } else if (cookieCount <= 10) {
            privacyScore += 10; // Minimal cookies (good privacy practice)
        } else if (cookieCount <= 20) {
            privacyScore += 5; // Reasonable amount
        } else if (cookieCount <= 50) {
            privacyScore += 0; // Moderate amount
        } else {
            privacyScore -= 10; // Excessive cookies (privacy concern)
        }

        console.log('Calculating privacy score:', {
            cmpConfidence: cmp.confidence,
            cmpName: cmp.name,
            consentModeV2: results.consentModeV2,
            cookieCount: cookieCount,
            cookieDomains: cookies.domains,
            cookieAccepted: cookieInfo.accepted
        });

        // Calculate tracking score - STRUCTURED APPROACH (Max 100 points)
        // Each category has a maximum, ensuring total never exceeds 100
        trackingScore = 0; // Start from 0

        const marketingScripts = results.marketingScripts || {};

        // Check for advanced analytics platforms
        const platforms = marketingScripts.platforms || {};
        const hasReaktion = platforms.reaktion?.found || false;
        const hasProfitmetrics = platforms.profitmetrics?.found || false;
        const hasTriplewhale = platforms.triplewhale?.found || false;
        const platformCount = [hasReaktion, hasProfitmetrics, hasTriplewhale].filter(Boolean).length;

        console.log('Calculating tracking score:', {
            gtmFound: results.gtmInfo?.found,
            ga4Found: marketingScripts.ga4?.found,
            serverSideTracking: results.serverSideTracking,
            metaFound: marketingScripts.meta?.found,
            tiktokFound: marketingScripts.tiktok?.found,
            linkedinFound: marketingScripts.linkedin?.found,
            googleAdsFound: marketingScripts.googleAds?.found,
            consentModeV2: results.consentModeV2 ?? results.tagstackInfo?.consentModeV2,
            platforms: {
                reaktion: hasReaktion,
                profitmetrics: hasProfitmetrics,
                triplewhale: hasTriplewhale,
                count: platformCount,
                note: platformCount > 0 ? 'Platforms will boost GA4 and marketing pixel scores' : null
            }
        });

        const scoreBreakdown = {
            gtm: 0,
            consentModeV2: 0,
            serverSideTracking: 0,
            platforms: 0,
            ga4: 0,
            pixels: 0,
            tagQuality: 0
        };

        // Category 1: Advanced Analytics Platforms (25 points max - HIGHEST PRIORITY)
        // These platforms replace the need for complex GTM/server-side setups
        if (platformCount > 0) {
            if (platformCount === 1) {
                scoreBreakdown.platforms = 25; // Single platform gets full points
            } else if (platformCount === 2) {
                scoreBreakdown.platforms = 30; // Multiple platforms get bonus
            } else if (platformCount === 3) {
                scoreBreakdown.platforms = 35; // All three platforms get maximum bonus
            }
            trackingScore += scoreBreakdown.platforms;
            console.log(`Advanced analytics platforms detected: ${platformCount} platform(s), +${scoreBreakdown.platforms} points`);
        }
        // Category 1.5: GTM Implementation (only if no platforms detected)
        else if (results.gtmInfo?.found) {
            scoreBreakdown.gtm = 25; // Base score for GTM presence
            trackingScore += 25;

            // Additional quality points from Tagstack analysis (up to 5 points)
            if (results.tagstackInfo) {
                const containerStats = results.tagstackInfo.containerStats;
                const primaryContainer = results.gtmInfo.containers?.[0];

                if (containerStats?.[primaryContainer]) {
                    const stats = containerStats[primaryContainer];
                    // Quality bonus: active tags vs paused tags ratio
                    if (stats.tags > 0 && stats.activeTags > 0) {
                        const activeRatio = stats.activeTags / stats.tags;
                        // Bonus for high active tag ratio (up to 5 points)
                        const qualityBonus = Math.min(5, Math.round(activeRatio * 5));
                        scoreBreakdown.tagQuality = qualityBonus;
                        trackingScore += qualityBonus;
                    }
                    // Penalty for paused tags (reduce quality bonus)
                    if (stats.pausedTags > 0 && stats.tags > 0) {
                        const pausedRatio = stats.pausedTags / stats.tags;
                        const qualityPenalty = Math.min(scoreBreakdown.tagQuality, Math.round(pausedRatio * 5));
                        scoreBreakdown.tagQuality -= qualityPenalty;
                        trackingScore -= qualityPenalty;
                    }
                }
            }
        }

        // Category 2: Consent Mode V2 (25 points max) - CRITICAL
        const consentModeV2Enabled = results.consentModeV2 ?? results.tagstackInfo?.consentModeV2 ?? false;
        console.log('Consent Mode V2 check:', {
            resultsConsentModeV2: results.consentModeV2,
            tagstackConsentModeV2: results.tagstackInfo?.consentModeV2,
            finalValue: consentModeV2Enabled
        });
        if (consentModeV2Enabled) {
            scoreBreakdown.consentModeV2 = 25; // Full points for Consent Mode V2
            trackingScore += 25;
            console.log('Consent Mode V2 enabled: +25 points');
        } else {
            console.log('Consent Mode V2 disabled: 0 points (critical requirement)');
        }

        // Category 3: Server-side Tracking (15 points max - only if no platforms detected)
        // Platforms like Reaktion, Profitmetrics, Triplewhale typically include server-side tracking
        if (results.serverSideTracking && platformCount === 0) {
            scoreBreakdown.serverSideTracking = 15;
            trackingScore += 15;
        }

        // Category 4: GA4 Implementation (10 points max)
        // Platforms like Reaktion typically include GA4, so award full points when platforms are detected
        if (platformCount > 0 || marketingScripts.ga4?.found) {
            scoreBreakdown.ga4 = 10;
            trackingScore += 10;
            if (platformCount > 0) {
                console.log('GA4 points awarded via platform detection');
            }
        }

        // Category 5: Marketing Pixels (20 points max - combined check)
        // Platforms like Reaktion typically include all marketing pixels, so award full points when platforms are detected
        if (platformCount > 0) {
            // Award maximum points (20) when platforms are detected - they handle all marketing scripts
            scoreBreakdown.pixels = 20;
            trackingScore += 20;
            console.log('Marketing pixels points (20) awarded via platform detection - platforms handle all marketing scripts');
        } else {
            // Check how many of the 4 main pixels are present
            const pixelsFound = [
                marketingScripts.meta?.found,
                marketingScripts.tiktok?.found,
                marketingScripts.linkedin?.found,
                marketingScripts.googleAds?.found
            ].filter(Boolean).length;

            // Award points based on pixel coverage (0-4 pixels = 0-20 points)
            // All 4 pixels = 20 points, 3 pixels = 15 points, 2 pixels = 10 points, 1 pixel = 5 points
            if (pixelsFound === 4) {
                scoreBreakdown.pixels = 20;
                trackingScore += 20;
            } else if (pixelsFound === 3) {
                scoreBreakdown.pixels = 15;
                trackingScore += 15;
            } else if (pixelsFound === 2) {
                scoreBreakdown.pixels = 10;
                trackingScore += 10;
            } else if (pixelsFound === 1) {
                scoreBreakdown.pixels = 5;
                trackingScore += 5;
            }
        }

        console.log('Tracking score breakdown:', {
            platforms: scoreBreakdown.platforms,
            gtm: scoreBreakdown.gtm,
            tagQuality: scoreBreakdown.tagQuality,
            consentModeV2: scoreBreakdown.consentModeV2,
            serverSideTracking: scoreBreakdown.serverSideTracking,
            ga4: scoreBreakdown.ga4 + (platformCount > 0 ? ' (via platform)' : ''),
            pixels: platformCount > 0 ? `20/20 (via platform)` : `${pixelsFound}/4 = ${scoreBreakdown.pixels}`,
            totalBeforeClamp: trackingScore
        });

        // Calculate Compliance Score from scratch - BE MORE CRITICAL
        // Based on 2026 compliance standards (GDPR, CCPA, ePrivacy Directive)
        complianceScore = 0; // Start from 0

        const complianceCookieInfo = results.cookieInfo || {};
        const complianceCmp = complianceCookieInfo.cmp || {};
        const tagstackInfo = results.tagstackInfo || {};

        // 1. Legal Framework Compliance (40 points)
        // Consent Mode V2 is a strong indicator of GDPR/ePrivacy compliance
        if (results.consentModeV2) {
            complianceScore += 20; // Consent Mode V2 indicates proper consent handling
        } else {
            complianceScore -= 15; // Missing Consent Mode V2 is a compliance risk
        }

        // CMP presence is required for GDPR compliance
        if (complianceCmp.confidence === 'high') {
            complianceScore += 20; // High-confidence CMP (proper legal framework)
        } else if (complianceCmp.confidence === 'low' || complianceCmp.name) {
            complianceScore += 10; // Basic CMP (partial compliance)
        } else {
            complianceScore -= 20; // No CMP detected - major compliance issue
        }

        // 2. Cookie Consent Quality & Implementation (30 points)
        if (complianceCmp.confidence === 'high') {
            complianceScore += 30; // Enterprise-grade CMP (CookieInformation, OneTrust, Cookiebot)
        } else if (complianceCmp.confidence === 'low') {
            complianceScore += 15; // Basic CMP implementation
        } else if (complianceCookieInfo.accepted && !complianceCmp.name) {
            complianceScore += 5; // Generic cookie banner (minimal compliance)
        } else {
            complianceScore -= 20; // No cookie consent mechanism - compliance violation
        }

        // 3. Data Processing Transparency (20 points)
        // Check if CMP provides proper transparency (categories, purposes, etc.)
        if (complianceCmp.confidence === 'high') {
            // High-confidence CMPs typically provide category-based consent
            complianceScore += 20;
        } else if (complianceCmp.name) {
            // Basic CMP provides some transparency
            complianceScore += 10;
        } else {
            complianceScore += 0; // No transparency mechanism
        }

        // 4. Technical Implementation Quality (10 points)
        // Server-side tracking with proper consent handling
        if (results.serverSideTracking) {
            complianceScore += 10; // Server-side tracking with consent is best practice
        } else {
            complianceScore += 0; // Client-side only (acceptable but not optimal)
        }

        // Additional compliance factors from Tagstack
        if (tagstackInfo.consentModeV2 && !results.consentModeV2) {
            // Tagstack detected Consent Mode V2 but our scan didn't - still counts
            complianceScore += 5;
        }

        // Check consent defaults from Tagstack
        if (tagstackInfo.consentDefaults) {
            const defaults = tagstackInfo.consentDefaults;
            // If defaults are "denied", it's better for compliance (opt-in approach)
            const deniedCount = Object.values(defaults).filter(v => v === 'denied').length;
            if (deniedCount >= 4) {
                complianceScore += 5; // Most consent types default to denied (good practice)
            }
        }

        console.log('Calculating compliance score:', {
            consentModeV2: results.consentModeV2,
            cmpConfidence: complianceCmp.confidence,
            cmpName: complianceCmp.name,
            serverSideTracking: results.serverSideTracking,
            tagstackConsentModeV2: tagstackInfo.consentModeV2,
            consentDefaults: tagstackInfo.consentDefaults
        });

        // Clamp all scores between 0-100
        performanceScore = Math.max(0, Math.min(100, performanceScore));
        privacyScore = Math.max(0, Math.min(100, privacyScore));
        // Log final tracking score before clamping
        console.log('Tracking score before clamping:', trackingScore);
        trackingScore = Math.max(0, Math.min(100, trackingScore));
        console.log('Tracking score after clamping:', trackingScore);
        complianceScore = Math.max(0, Math.min(100, complianceScore));

        console.log('Final calculated scores:', {
            performance: performanceScore,
            privacy: privacyScore,
            tracking: trackingScore,
            compliance: complianceScore
        });

        // Calculate overall score as simple average of the 4 scores
        const overallScore = Math.round(
            (performanceScore + privacyScore + trackingScore + complianceScore) / 4
        );

        return {
            performance: performanceScore,
            privacy: privacyScore,
            tracking: trackingScore,
            compliance: complianceScore,
            overall: Math.max(0, Math.min(100, overallScore))
        };
    };

    // Calculate scores based on current results
    const calculatedScores = calculateScores(results);
    const totalScore = calculatedScores.overall;

    // Use calculated scores for display - ensure tracking score is from calculation, not initial value
    const displayResults = {
        ...results,
        scores: {
            performance: Math.round(calculatedScores.performance),
            privacy: Math.round(calculatedScores.privacy),
            tracking: Math.round(calculatedScores.tracking), // Use calculated value, not initial
            compliance: Math.round(calculatedScores.compliance)
        }
    };

    // Debug log to verify scores

    if (results.gtmInfo?.found) {
        console.log('Score calculation debug:', {
            initialTracking: results.scores?.tracking,
            calculatedTracking: calculatedScores.tracking,
            displayTracking: displayResults.scores.tracking,
            marketingScripts: results.marketingScripts
        });
    }


    return (
        <div className="min-h-screen py-12 px-6">
            <div className="container max-w-7xl mx-auto results-content-container" ref={contentRef}>
                <div className="flex gap-12 relative">
                    {/* Table of Contents Sidebar */}
                    <div className="hidden lg:block w-56 flex-shrink-0">
                        <TableOfContents activeSection={activeSection} onSectionClick={scrollToSection} />
                    </div>
                    {/* Vertical line and marker - positioned between sidebar and content, outside sidebar constraints */}
                    <div className="hidden lg:block absolute left-[14rem] top-0 bottom-0 w-px pointer-events-none">
                        <IndicatorLine activeSection={activeSection} />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0 space-y-16">
                        {/* Header */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h1 className="text-4xl font-light tracking-tight text-foreground">
                                    Technical Analysis Report
                                </h1>
                                <p className="text-sm text-foreground/50 font-mono">
                                    {displayResults.url}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="lg:hidden"
                                    onClick={() => setShowMobileTOC(true)}
                                >
                                    <FaChartLine className="w-4 h-4 mr-2" />
                                    Contents
                                </Button>
                                <Button
                                    onClick={() => router.push("/")}
                                    variant="outline"
                                >
                                    New Scan
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => router.push("/scan?url=" + encodeURIComponent(displayResults.url))}
                                >
                                    Re-scan
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={handleExportToPDF}
                                    disabled={isExporting}
                                >
                                    {isExporting ? 'Exporting...' : 'Export to PDF'}
                                </Button>
                            </div>
                        </div>

                        {/* Real Scan Data Display */}
                        {displayResults.pageInfo && (
                            <div className="border border-border/40 rounded p-6 space-y-6">
                                <div className="space-y-1">
                                    <h2 className="text-lg font-light text-foreground">Live Scan Results</h2>
                                    <p className="text-xs text-foreground/50">Real data captured from the scanned website</p>
                                </div>
                                <div className="grid gap-6 md:grid-cols-3">
                                    <div className="space-y-1">
                                        <div className="text-3xl font-light text-foreground">{displayResults.pageInfo.scripts}</div>
                                        <div className="text-xs text-foreground/50">Scripts Found</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-3xl font-light text-foreground">{displayResults.pageInfo.links}</div>
                                        <div className="text-xs text-foreground/50">Links Found</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-3xl font-light text-foreground">{displayResults.pageInfo.images}</div>
                                        <div className="text-xs text-foreground/50">Images Found</div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-border/40 space-y-2">
                                    <div className="text-sm">
                                        <span className="text-foreground/50">Page Title:</span> <span className="text-foreground">{displayResults.pageInfo.title || 'N/A'}</span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-foreground/50">Cookies:</span> <span className="text-foreground">{displayResults.pageInfo.cookies || 0}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Overall Score & Status */}
                        <ScoreOverview results={displayResults} totalScore={totalScore} serverSideTrackingPlatform={displayResults.serverSideTrackingPlatform} />

                        {/* Detailed Scores */}
                        <DetailedScores results={displayResults} />

                        {/* Marketing Scripts Checklist */}
                        <MarketingScripts results={displayResults} />

                        {/* Performance Metrics */}
                        <PerformanceMetrics results={displayResults} />

                        {/* GTM Analysis Section */}
                        <GTMAnalysis results={displayResults} />

                        {/* Tagstack Insights - Container Health */}
                        <TagstackInsights results={displayResults} />

                        {/* Martech Summary */}
                        <MartechSummary results={displayResults} />

                        {/* JSON-LD Structured Data */}
                        <JsonLdAnalysis results={displayResults} />

                        {/* Cookie Status */}
                        <PrivacyCookies results={displayResults} />

                        {/* DataLayer Inspection */}
                        <DataLayerInspection dataLayer={displayResults.dataLayer} />

                        {/* Scan Metadata */}
                        <div className="border border-border/40 rounded p-6 space-y-6">
                            <h2 className="text-lg font-light text-foreground">Scan Metadata</h2>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-1">
                                    <div className="text-xs text-foreground/50 uppercase tracking-wide">Target URL</div>
                                    <div className="font-mono text-sm text-foreground break-all">{displayResults.url}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-foreground/50 uppercase tracking-wide">Scan Timestamp</div>
                                    <div className="text-sm text-foreground">{new Date(displayResults.scannedAt).toLocaleString()}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-foreground/50 uppercase tracking-wide">Scanner Version</div>
                                    <div className="text-sm text-foreground">Omnipixel v2.0.0</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-foreground/50 uppercase tracking-wide">Analysis Engine</div>
                                    <div className="text-sm text-foreground">Browser Automation + AI Analysis</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Table of Contents */}
                {showMobileTOC && (
                    <TableOfContents
                        activeSection={activeSection}
                        onSectionClick={scrollToSection}
                        isMobile={true}
                        onClose={() => setShowMobileTOC(false)}
                    />
                )}
            </div>
        </div>
    );
}

export default function ResultsPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-foreground/20 border-t-foreground"></div>
            </div>
        }>
            <ResultsContent />
        </Suspense>
    );
}
