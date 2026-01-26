"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
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
    FaTachometerAlt
} from "react-icons/fa";

// Import result components
import { ScoreOverview } from "@/components/results/score-overview";
import { DetailedScores } from "@/components/results/detailed-scores";
import { MarketingScripts } from "@/components/results/marketing-scripts";
import { PerformanceMetrics } from "@/components/results/performance-metrics";
import { GTMAnalysis } from "@/components/results/gtm-analysis";
import { PrivacyCookies } from "@/components/results/privacy-cookies";

// Table of Contents Sidebar Component
function TableOfContents({ activeSection, onSectionClick, isMobile = false, onClose }) {
    const sections = [
        { id: 'overview', title: 'Overview & Scores', icon: FaTachometerAlt },
        { id: 'detailed-scores', title: 'Detailed Scores', icon: FaChartLine },
        { id: 'marketing-scripts', title: 'Marketing Scripts', icon: FaTag },
        { id: 'performance', title: 'Performance Metrics', icon: FaTachometerAlt },
        { id: 'gtm-analysis', title: 'GTM Analysis', icon: FaGoogle },
        { id: 'privacy-cookies', title: 'Privacy & Cookies', icon: FaShieldAlt }
    ];

    const handleSectionClick = (sectionId) => {
        onSectionClick(sectionId);
        if (isMobile && onClose) onClose();
    };

    return (
        <div className={`${isMobile ? 'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm' : 'sticky top-20 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto'}`}>
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
                                onClick={() => handleSectionClick(section.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm rounded transition-colors ${
                                    activeSection === section.id
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
    const scanDataParam = searchParams.get("scanData");

    const [results, setResults] = useState(null);
    const [activeSection, setActiveSection] = useState('overview');
    const [showMobileTOC, setShowMobileTOC] = useState(false);

    // Intersection Observer for active section tracking
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-80px 0px -50% 0px',
            threshold: 0
        };

        const observerCallback = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        // Observe all sections
        const sections = ['overview', 'detailed-scores', 'marketing-scripts', 'performance', 'gtm-analysis', 'privacy-cookies'];
        sections.forEach((sectionId) => {
            const element = document.getElementById(sectionId);
            if (element) observer.observe(element);
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

    useEffect(() => {
        if (!url) {
            router.push("/");
            return;
        }

        // Check if we have real scan data from the scanner
        if (scanDataParam) {
            try {
                const scanData = JSON.parse(decodeURIComponent(scanDataParam));
                // Merge real scan data with mock results
                setResults({
                    url: url,
                    scannedAt: new Date().toISOString(),
                    // Use real page info if available
                    pageInfo: scanData.pageInfo || null,
                    // Use real cookie info from scan
                    cookieInfo: scanData.cookieInfo || null,
                    // Use real performance data from scan
                    performance: scanData.performance || null,
                    // Keep mock data for other sections (will be replaced later)
                    consentModeV2: true,
                    serverSideTracking: false,
                    marketingScripts: {
                        gtm: {
                            found: true,
                            containerId: "GTM-XXXXXXX",
                            version: "v2",
                            lastUpdated: "2024-01-15"
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
                    scores: {
                        privacy: 85,
                        performance: 78,
                        tracking: 92,
                        compliance: 88
                    },
                    performance: scanData.performance || {
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
                    gtmAnalysis: {
                        containers: [],
                        triggers: [],
                        variables: [],
                        tags: []
                    }
                });
                return;
            } catch (error) {
                console.warn('Failed to parse scan data:', error);
                // Fall back to mock data
            }
        } else {
            // No scan data provided - redirect to scan page
            console.log('No scan data provided, redirecting to scan page');
            router.push('/');
            return;
        }

        // Enhanced mock results with new technical structure
        setResults({
            url: url,
            scannedAt: new Date().toISOString(),

            // Technical compliance indicators
            consentModeV2: true,
            serverSideTracking: false,

            // Marketing scripts with detailed technical info
            marketingScripts: {
                gtm: {
                    found: true,
                    containerId: "GTM-XXXXXXX",
                    version: "v2",
                    lastUpdated: "2024-01-15"
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

            // GTM Analysis placeholder (to be implemented)
            gtmAnalysis: {
                containers: [],
                triggers: [],
                variables: [],
                tags: []
            }
        });
    }, [url, router]);

    if (!results) {
        return (
            <div className="flex min-h-screen items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-foreground/20 border-t-foreground"></div>
            </div>
        );
    }

    // Calculate total score
    const totalScore = Math.round(
        (results.scores.privacy + results.scores.performance + results.scores.tracking + results.scores.compliance) / 4
    );


    return (
        <div className="min-h-screen py-12 px-6">
            <div className="container max-w-7xl mx-auto">
                <div className="flex gap-12">
                    {/* Table of Contents Sidebar */}
                    <div className="hidden lg:block w-56 flex-shrink-0">
                        <TableOfContents activeSection={activeSection} onSectionClick={scrollToSection} />
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
                                    {results.url}
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
                                    onClick={() => router.push("/scan?url=" + encodeURIComponent(results.url))}
                                >
                                    Re-scan
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    onClick={() => window.print()}
                                >
                                    Export
                                </Button>
                            </div>
                        </div>

                        {/* Real Scan Data Display */}
                        {results.pageInfo && (
                            <div className="border border-border/40 rounded p-6 space-y-6">
                                <div className="space-y-1">
                                    <h2 className="text-lg font-light text-foreground">Live Scan Results</h2>
                                    <p className="text-xs text-foreground/50">Real data captured from the scanned website</p>
                                </div>
                                <div className="grid gap-6 md:grid-cols-3">
                                    <div className="space-y-1">
                                        <div className="text-3xl font-light text-foreground">{results.pageInfo.scripts}</div>
                                        <div className="text-xs text-foreground/50">Scripts Found</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-3xl font-light text-foreground">{results.pageInfo.links}</div>
                                        <div className="text-xs text-foreground/50">Links Found</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-3xl font-light text-foreground">{results.pageInfo.images}</div>
                                        <div className="text-xs text-foreground/50">Images Found</div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-border/40 space-y-2">
                                    <div className="text-sm">
                                        <span className="text-foreground/50">Page Title:</span> <span className="text-foreground">{results.pageInfo.title || 'N/A'}</span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-foreground/50">Cookies:</span> <span className="text-foreground">{results.pageInfo.cookies || 0}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                {/* Overall Score & Status */}
                <ScoreOverview results={results} totalScore={totalScore} />

                {/* Detailed Scores */}
                <DetailedScores results={results} />

                {/* Marketing Scripts Checklist */}
                <MarketingScripts results={results} />

                {/* Performance Metrics */}
                <PerformanceMetrics results={results} />

                {/* GTM Analysis Section (Placeholder) */}
                <GTMAnalysis results={results} />

                {/* Cookie Status */}
                <PrivacyCookies results={results} />

                        {/* Scan Metadata */}
                        <div className="border border-border/40 rounded p-6 space-y-6">
                            <h2 className="text-lg font-light text-foreground">Scan Metadata</h2>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-1">
                                    <div className="text-xs text-foreground/50 uppercase tracking-wide">Target URL</div>
                                    <div className="font-mono text-sm text-foreground break-all">{results.url}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-foreground/50 uppercase tracking-wide">Scan Timestamp</div>
                                    <div className="text-sm text-foreground">{new Date(results.scannedAt).toLocaleString()}</div>
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
