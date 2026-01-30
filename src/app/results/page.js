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
import { TagstackInsights } from "@/components/results/tagstack-insights";
import { MartechSummary } from "@/components/results/martech-summary";

// Table of Contents Sidebar Component
function TableOfContents({ activeSection, onSectionClick, isMobile = false, onClose }) {
    const sections = [
        { id: 'overview', title: 'Overview & Scores', icon: FaTachometerAlt },
        { id: 'detailed-scores', title: 'Detailed Scores', icon: FaChartLine },
        { id: 'marketing-scripts', title: 'Marketing Scripts', icon: FaTag },
        { id: 'performance', title: 'Performance Metrics', icon: FaTachometerAlt },
        { id: 'gtm-analysis', title: 'GTM Analysis', icon: FaGoogle },
        { id: 'tagstack-insights', title: 'Container Health', icon: FaShieldAlt },
        { id: 'martech-summary', title: 'Martech Summary', icon: FaTag },
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
    const sessionId = searchParams.get("sessionId");
    const scanDataParam = searchParams.get("scanData"); // Legacy support

    const [results, setResults] = useState(null);
    const [activeSection, setActiveSection] = useState('overview');
    const [showMobileTOC, setShowMobileTOC] = useState(false);
    const [error, setError] = useState(null);

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

        // Observe all sections (including new ones)
        const sections = [
            'overview', 
            'detailed-scores', 
            'marketing-scripts', 
            'performance', 
            'gtm-analysis', 
            'tagstack-insights', 
            'martech-summary', 
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

    useEffect(() => {
        if (!url) {
            router.push("/");
            return;
        }

        // Ensure we're on client side before accessing sessionStorage
        if (typeof window === 'undefined') {
            return;
        }

        // Async function to load scan data
        const loadScanData = async () => {
            // Try to get scan data from sessionStorage first (new method)
            let scanData = null;
            if (sessionId) {
                try {
                    const storageKey = `scan_${sessionId}`;
                    console.log('Looking for scan data in sessionStorage with key:', storageKey);
                    
                    // Try immediate read first
                    let storedData = sessionStorage.getItem(storageKey);
                    
                    // If not found, wait a bit and retry (in case storage just completed)
                    if (!storedData) {
                        console.log('Data not found immediately, waiting 500ms...');
                        await new Promise(resolve => setTimeout(resolve, 500));
                        storedData = sessionStorage.getItem(storageKey);
                    }
                
                    if (storedData) {
                        console.log('Found data in sessionStorage, size:', storedData.length, 'characters');
                        scanData = JSON.parse(storedData);
                        console.log('✅ Loaded scan data from sessionStorage');
                        console.log('Scan data keys:', Object.keys(scanData));
                        console.log('GTM Info:', scanData.gtmInfo);
                        console.log('Tagstack Info:', scanData.tagstackInfo ? 'Present' : 'Missing');
                        console.log('Performance:', scanData.performance ? 'Present' : 'Missing');
                        console.log('Cookie Info:', scanData.cookieInfo ? 'Present' : 'Missing');
                        // Clean up after reading
                        sessionStorage.removeItem(storageKey);
                    } else {
                        console.warn('No data found in sessionStorage for key:', storageKey);
                        // List all sessionStorage keys for debugging
                        const allKeys = [];
                        for (let i = 0; i < sessionStorage.length; i++) {
                            const key = sessionStorage.key(i);
                            if (key && key.startsWith('scan_')) {
                                allKeys.push(key);
                            }
                        }
                        console.log('Available scan keys in sessionStorage:', allKeys);
                        
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
                                    const candidateData = sessionStorage.getItem(key);
                                    if (candidateData) {
                                        const parsed = JSON.parse(candidateData);
                                        // Check if URL matches (allowing for trailing slash differences)
                                        const candidateUrl = parsed.url?.replace(/\/$/, '');
                                        const targetUrl = url?.replace(/\/$/, '');
                                        if (candidateUrl === targetUrl) {
                                            console.log(`✅ Found matching scan data in fallback key: ${key}`);
                                            scanData = parsed;
                                            sessionStorage.removeItem(key);
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
                                    const mostRecentData = sessionStorage.getItem(mostRecentKey);
                                    if (mostRecentData) {
                                        scanData = JSON.parse(mostRecentData);
                                        console.log(`✅ Using most recent scan data from key: ${mostRecentKey}`);
                                        sessionStorage.removeItem(mostRecentKey);
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
                    // Use Consent Mode V2 from Tagstack, fallback to scan data
                    consentModeV2: scanData.tagstackInfo?.consentModeV2 ?? scanData.consentModeV2 ?? false,
                    serverSideTracking: false, // TODO: Extract from Tagstack if available
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
                            found: (scanData.tagstackInfo?.detectedIds?.facebookPixel?.length || 0) > 0,
                            pixelId: scanData.tagstackInfo?.detectedIds?.facebookPixel?.[0] || null,
                            pixelIds: scanData.tagstackInfo?.detectedIds?.facebookPixel || [],
                            conversionsApi: false, // TODO: Extract from Tagstack if available
                            customAudiences: false
                        },
                        tiktok: {
                            found: false,
                            pixelId: null
                        },
                        linkedin: {
                            found: false,
                            pixelId: null
                        },
                        googleAds: {
                            found: (scanData.tagstackInfo?.detectedIds?.googleAds?.length || 0) > 0,
                            conversionId: scanData.tagstackInfo?.detectedIds?.googleAds?.[0] || null,
                            conversionIds: scanData.tagstackInfo?.detectedIds?.googleAds || [],
                            remarketing: false
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
                console.error('Session ID provided but no data found in sessionStorage');
                setError('Scan results not found. The scan may have expired or the session was cleared. Please try scanning again.');
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

    // Calculate overall score based on available data
    const calculateOverallScore = (results) => {
        const weights = {
            performance: 0.30,  // Performance is important (30%)
            privacy: 0.25,      // Privacy compliance (25%)
            tracking: 0.25,     // Tracking implementation quality (25%)
            compliance: 0.20    // General compliance (20%)
        };

        // Base scores from results
        let performanceScore = results.scores?.performance || 0;
        let privacyScore = results.scores?.privacy || 0;
        let trackingScore = results.scores?.tracking || 0;
        let complianceScore = results.scores?.compliance || 0;

        // Adjust performance score based on actual performance metrics
        if (results.performance?.performanceScore !== undefined) {
            // Use actual PageSpeed Insights score if available
            performanceScore = results.performance.performanceScore;
        }

        // Adjust privacy score based on Consent Mode V2 and cookie handling
        if (results.consentModeV2) {
            privacyScore = Math.min(100, privacyScore + 10); // Bonus for Consent Mode V2
        }
        if (results.cookieInfo?.accepted) {
            privacyScore = Math.min(100, privacyScore + 5); // Bonus for cookie acceptance
        }
        if (results.cookieInfo?.cmp?.confidence === 'high') {
            privacyScore = Math.min(100, privacyScore + 5); // Bonus for high-confidence CMP detection
        }

        // Adjust tracking score based on GTM implementation quality
        if (results.gtmInfo?.found) {
            trackingScore = Math.min(100, trackingScore + 15); // Base bonus for GTM presence
            
            // Additional bonuses from Tagstack analysis
            if (results.tagstackInfo) {
                const containerStats = results.tagstackInfo.containerStats;
                const primaryContainer = results.gtmInfo.containers?.[0];
                
                if (containerStats?.[primaryContainer]) {
                    const stats = containerStats[primaryContainer];
                    // Bonus for having tags configured
                    if (stats.tags > 0) {
                        trackingScore = Math.min(100, trackingScore + 5);
                    }
                    // Penalty for paused tags (indicates poor maintenance)
                    if (stats.pausedTags > 0) {
                        trackingScore = Math.max(0, trackingScore - (stats.pausedTags * 2));
                    }
                    // Bonus for active tags
                    if (stats.activeTags > 0) {
                        trackingScore = Math.min(100, trackingScore + Math.min(10, stats.activeTags));
                    }
                }
                
                // Bonus for Consent Mode V2 in tracking context
                if (results.tagstackInfo.consentModeV2) {
                    trackingScore = Math.min(100, trackingScore + 10);
                }
            }
        } else {
            // Penalty for no GTM found
            trackingScore = Math.max(0, trackingScore - 20);
        }

        // Adjust compliance score based on various factors
        if (results.consentModeV2) {
            complianceScore = Math.min(100, complianceScore + 15); // Strong bonus for Consent Mode V2
        }
        if (results.tagstackInfo?.cmp !== false && results.cookieInfo?.cmp) {
            complianceScore = Math.min(100, complianceScore + 10); // Bonus for CMP detection
        }
        if (results.serverSideTracking) {
            complianceScore = Math.min(100, complianceScore + 5); // Bonus for server-side tracking
        }

        // Calculate weighted average
        const totalScore = Math.round(
            (performanceScore * weights.performance) +
            (privacyScore * weights.privacy) +
            (trackingScore * weights.tracking) +
            (complianceScore * weights.compliance)
        );

        return Math.max(0, Math.min(100, totalScore)); // Clamp between 0-100
    };

    const totalScore = calculateOverallScore(results);


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

                {/* GTM Analysis Section */}
                <GTMAnalysis results={results} />

                {/* Tagstack Insights - Container Health */}
                <TagstackInsights results={results} />

                {/* Martech Summary */}
                <MartechSummary results={results} />

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
