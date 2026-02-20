"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";

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

// Import local components
import { IndicatorLine } from "./components/indicator-line";
import { TableOfContents } from "./components/table-of-contents";
import { ResultsHeader } from "./components/results-header";

// Import hooks
import { useResultsLoader } from "./hooks/use-results-loader";
import { useScoreSaver } from "./hooks/use-score-saver";
import { useIntersectionObserver } from "./hooks/use-intersection-observer";

// Import utilities
import { calculateScores } from "./utils/score-calculator";
import { exportToPDF } from "./utils/pdf-export";

function ResultsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const url = searchParams.get("url");
    const sessionId = searchParams.get("sessionId");
    const scanDataParam = searchParams.get("scanData");
    const referrer = searchParams.get("referrer");
    const customerId = searchParams.get("customerId");

    const [results, setResults] = useState(null);
    const [activeSection, setActiveSection] = useState('overview');
    const [showMobileTOC, setShowMobileTOC] = useState(false);
    const [error, setError] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const contentRef = useRef(null);

    // Load results from localStorage or URL params
    useResultsLoader(url, sessionId, scanDataParam, setResults, setError);

    // Save scores to MongoDB if referrer matches
    useScoreSaver(results, referrer, customerId);

    // Track active section using Intersection Observer
    useIntersectionObserver(results, setActiveSection);

    // Calculate scores
    const calculatedScores = useMemo(() => {
        if (!results) return null;
        return calculateScores(results);
    }, [results]);

    const totalScore = calculatedScores?.overall || 0;

    // Prepare display results with calculated scores
    const displayResults = useMemo(() => {
        if (!results) return null;
        return {
            ...results,
            scores: {
                performance: Math.round(calculatedScores?.performance || 0),
                privacy: Math.round(calculatedScores?.privacy || 0),
                tracking: Math.round(calculatedScores?.tracking || 0),
                compliance: Math.round(calculatedScores?.compliance || 0)
            }
        };
    }, [results, calculatedScores]);

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            const offsetTop = element.offsetTop - 100;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    };

    const handleExportToPDF = async () => {
        if (isExporting || !displayResults) return;

        setIsExporting(true);
        try {
            await exportToPDF(displayResults);
        } catch (error) {
            console.error('Failed to export PDF:', error);
            alert('Failed to export PDF. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleNewScan = () => {
        router.push("/");
    };

    const handleRescan = () => {
        if (displayResults?.url) {
            router.push("/scan?url=" + encodeURIComponent(displayResults.url));
        }
    };

    // Error state
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

    // Loading state
    if (!results || !displayResults) {
        return (
            <div className="flex min-h-screen items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-foreground/20 border-t-foreground"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-6">
            <div className="container max-w-7xl mx-auto results-content-container" ref={contentRef}>
                <div className="flex gap-12 relative">
                    {/* Table of Contents Sidebar */}
                    <div className="hidden lg:block w-56 flex-shrink-0">
                        <TableOfContents 
                            activeSection={activeSection} 
                            onSectionClick={scrollToSection} 
                        />
                    </div>
                    
                    {/* Vertical line and marker */}
                    <div className="hidden lg:block absolute left-[14rem] top-0 bottom-0 w-px pointer-events-none">
                        <IndicatorLine activeSection={activeSection} />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0 space-y-16">
                        {/* Header */}
                        <ResultsHeader
                            url={displayResults.url}
                            onNewScan={handleNewScan}
                            onRescan={handleRescan}
                            onExportPDF={handleExportToPDF}
                            isExporting={isExporting}
                            onShowMobileTOC={() => setShowMobileTOC(true)}
                        />

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
                        <ScoreOverview 
                            results={displayResults} 
                            totalScore={totalScore} 
                            serverSideTrackingPlatform={displayResults.serverSideTrackingPlatform} 
                        />

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
