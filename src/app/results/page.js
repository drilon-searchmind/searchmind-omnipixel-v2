"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    FaGoogle,
    FaFacebook,
    FaTiktok,
    FaLinkedin,
    FaTag,
    FaChartLine,
    FaCheck,
    FaTimes,
    FaServer,
    FaShieldAlt,
    FaTachometerAlt
} from "react-icons/fa";

function ResultsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const url = searchParams.get("url");
    const scanDataParam = searchParams.get("scanData");

    const [results, setResults] = useState(null);

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
                    performance: {
                        loadTime: 2.3,
                        firstContentfulPaint: 1.2,
                        largestContentfulPaint: 3.1,
                        firstInputDelay: 45,
                        cumulativeLayoutShift: 0.08,
                        totalBlockingTime: 120,
                        speedIndex: 2.8,
                        timeToInteractive: 2.5
                    },
                    cookiesAccepted: true,
                    cookieProvider: "Cookiebot",
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
                loadTime: 2.3,
                firstContentfulPaint: 1.2,
                largestContentfulPaint: 3.1,
                firstInputDelay: 45,
                cumulativeLayoutShift: 0.08,
                totalBlockingTime: 120,
                speedIndex: 2.8,
                timeToInteractive: 2.5
            },

            cookiesAccepted: true,
            cookieProvider: "Cookiebot",

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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Calculate total score
    const totalScore = Math.round(
        (results.scores.privacy + results.scores.performance + results.scores.tracking + results.scores.compliance) / 4
    );

    // Script icons mapping
    const scriptIcons = {
        gtm: <FaTag className="w-5 h-5 text-primary" />,
        ga4: <FaGoogle className="w-5 h-5 text-primary" />,
        meta: <FaFacebook className="w-5 h-5 text-primary" />,
        tiktok: <FaTiktok className="w-5 h-5 text-foreground" />,
        linkedin: <FaLinkedin className="w-5 h-5 text-primary" />,
        googleAds: <FaChartLine className="w-5 h-5 text-primary" />
    };

    const scriptNames = {
        gtm: "Google Tag Manager",
        ga4: "Google Analytics 4",
        meta: "Meta Pixel",
        tiktok: "TikTok Pixel",
        linkedin: "LinkedIn Insight",
        googleAds: "Google Ads"
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-5xl font-bold tracking-tight text-foreground">
                        Technical Analysis Report
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Comprehensive tracking and performance analysis for{" "}
                        <span className="font-mono font-semibold text-foreground">{results.url}</span>
                    </p>
                    <div className="flex justify-center gap-4 mt-6">
                        <Button onClick={() => router.push("/")}>
                            New Scan
                        </Button>
                        <Button variant="outline" onClick={() => router.push("/scan?url=" + encodeURIComponent(results.url))}>
                            Re-scan
                        </Button>
                        <Button variant="ghost" onClick={() => window.print()}>
                            Export Report
                        </Button>
                    </div>
                </div>

                {/* Real Scan Data Display */}
                {results.pageInfo && (
                    <Card className="bg-blue-50 border-blue-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FaTachometerAlt className="w-5 h-5 text-blue-600" />
                                Live Scan Results
                            </CardTitle>
                            <CardDescription>
                                Real data captured from the scanned website
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{results.pageInfo.scripts}</div>
                                    <div className="text-sm text-muted-foreground">Scripts Found</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{results.pageInfo.links}</div>
                                    <div className="text-sm text-muted-foreground">Links Found</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{results.pageInfo.images}</div>
                                    <div className="text-sm text-muted-foreground">Images Found</div>
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-white rounded border">
                                <div className="text-sm">
                                    <strong>Page Title:</strong> {results.pageInfo.title || 'N/A'}
                                </div>
                                <div className="text-sm mt-1">
                                    <strong>Cookies:</strong> {results.pageInfo.cookies || 0}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Overall Score & Status */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-20 mb-20">
                    <Card className="bg-[var(--color-primary-searchmind)] text-white col-span-1 py-5">
                        <CardHeader className="pb-5">
                            <CardTitle className="text-xl">Overall Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-5xl font-bold text-emerald-500">{totalScore}/100</div>
                            <div className="text-xs mt-3">
                                Combined technical score
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2 ">
                                <FaTachometerAlt className="w-5 h-5" />
                                Performance Score
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-emerald-500">{results.scores.performance}/100</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Core Web Vitals optimized
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FaShieldAlt className="w-5 h-5" />
                                Consent Mode V2
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                {results.consentModeV2 ? (
                                    <><FaCheck className="w-5 h-5 text-emerald-500" /> <span className="font-semibold text-emerald-500">Enabled</span></>
                                ) : (
                                    <><FaTimes className="w-5 h-5 text-red-500" /> <span className="font-semibold text-red-500">Disabled</span></>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FaServer className="w-5 h-5" />
                                Server-side Tracking
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                {results.serverSideTracking ? (
                                    <><FaCheck className="w-5 h-5 text-emerald-500" /> <span className="font-semibold text-emerald-500">Active</span></>
                                ) : (
                                    <><FaTimes className="w-5 h-5 text-red-500" /> <span className="font-semibold text-red-500">Not Detected</span></>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Scores */}
                <Card className="mt-10 mb-10">
                    <CardHeader>
                        <CardTitle>Detailed Scores</CardTitle>
                        <CardDescription>
                            Breakdown of technical compliance and optimization scores
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {Object.entries(results.scores).map(([category, score]) => (
                                <div key={category} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium capitalize">{category}</span>
                                        <span className="text-lg font-bold">{score}/100</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${score >= 90 ? 'bg-accent' :
                                                    score >= 70 ? 'bg-primary' : 'bg-destructive'
                                                }`}
                                            style={{ width: `${score}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Marketing Scripts Checklist */}
                <Card className="mt-10 mb-10 bg-slate-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FaTag className="w-6 h-6" />
                            Marketing Scripts Analysis
                        </CardTitle>
                        <CardDescription>
                            Detected marketing and analytics implementations with technical details
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            {Object.entries(results.marketingScripts).map(([key, data]) => (
                                <div key={key} className={`p-4 border rounded-lg transition-colors ${data.found
                                        ? 'bg-accent/10 border-accent/20 hover:bg-accent/20'
                                        : 'bg-muted border-border'
                                    }`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            {scriptIcons[key]}
                                            <div>
                                                <div className="font-semibold">{scriptNames[key]}</div>
                                                {data.found && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {data.containerId && `Container: ${data.containerId}`}
                                                        {data.measurementId && `Measurement: ${data.measurementId}`}
                                                        {data.pixelId && `Pixel: ${data.pixelId}`}
                                                        {data.conversionId && `Conversion: ${data.conversionId}`}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {data.found ? (
                                                <><FaCheck className="w-4 h-4 text-emerald-500" /> <span className="text-sm font-medium text-emerald-500">Detected</span></>
                                            ) : (
                                                <><FaTimes className="w-4 h-4 text-muted-foreground" /> <span className="text-sm font-medium text-muted-foreground">Not Found</span></>
                                            )}
                                        </div>
                                    </div>
                                    {data.found && (
                                        <div className="space-y-1 text-xs text-muted-foreground">
                                            {data.version && <div>Version: {data.version}</div>}
                                            {data.lastUpdated && <div>Last Updated: {data.lastUpdated}</div>}
                                            {data.enhancedEcommerce && <div>✓ Enhanced E-commerce</div>}
                                            {data.conversionsApi && <div>✓ Conversions API</div>}
                                            {data.remarketing && <div>✓ Remarketing</div>}
                                            {data.customAudiences && <div>✓ Custom Audiences</div>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Performance Metrics */}
                <Card className="mt-10 mb-10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FaTachometerAlt className="w-6 h-6" />
                            Core Web Vitals & Performance
                        </CardTitle>
                        <CardDescription>
                            Google Core Web Vitals metrics and performance indicators
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Load Time</div>
                                <div className="text-2xl font-bold">{results.performance.loadTime}s</div>
                                <div className={`text-xs font-medium ${results.performance.loadTime < 3 ? 'text-emerald-500' :
                                        results.performance.loadTime < 5 ? 'text-primary' : 'text-destructive'
                                    }`}>
                                    {results.performance.loadTime < 3 ? 'Good' : results.performance.loadTime < 5 ? 'Needs improvement' : 'Poor'}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">First Contentful Paint</div>
                                <div className="text-2xl font-bold">{results.performance.firstContentfulPaint}s</div>
                                <div className={`text-xs font-medium ${results.performance.firstContentfulPaint < 1.8 ? 'text-emerald-500' :
                                        results.performance.firstContentfulPaint < 3 ? 'text-primary' : 'text-destructive'
                                    }`}>
                                    {results.performance.firstContentfulPaint < 1.8 ? 'Good' : results.performance.firstContentfulPaint < 3 ? 'Needs improvement' : 'Poor'}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Largest Contentful Paint</div>
                                <div className="text-2xl font-bold">{results.performance.largestContentfulPaint}s</div>
                                <div className={`text-xs font-medium ${results.performance.largestContentfulPaint < 2.5 ? 'text-emerald-500' :
                                        results.performance.largestContentfulPaint < 4 ? 'text-primary' : 'text-destructive'
                                    }`}>
                                    {results.performance.largestContentfulPaint < 2.5 ? 'Good' : results.performance.largestContentfulPaint < 4 ? 'Needs improvement' : 'Poor'}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Cumulative Layout Shift</div>
                                <div className="text-2xl font-bold">{results.performance.cumulativeLayoutShift}</div>
                                <div className={`text-xs font-medium ${results.performance.cumulativeLayoutShift < 0.1 ? 'text-emerald-500' :
                                        results.performance.cumulativeLayoutShift < 0.25 ? 'text-primary' : 'text-destructive'
                                    }`}>
                                    {results.performance.cumulativeLayoutShift < 0.1 ? 'Good' : results.performance.cumulativeLayoutShift < 0.25 ? 'Needs improvement' : 'Poor'}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">First Input Delay</div>
                                <div className="text-2xl font-bold">{results.performance.firstInputDelay}ms</div>
                                <div className={`text-xs font-medium ${results.performance.firstInputDelay < 100 ? 'text-emerald-500' :
                                        results.performance.firstInputDelay < 300 ? 'text-primary' : 'text-destructive'
                                    }`}>
                                    {results.performance.firstInputDelay < 100 ? 'Good' : results.performance.firstInputDelay < 300 ? 'Needs improvement' : 'Poor'}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Total Blocking Time</div>
                                <div className="text-2xl font-bold">{results.performance.totalBlockingTime}ms</div>
                                <div className={`text-xs font-medium ${results.performance.totalBlockingTime < 200 ? 'text-emerald-500' :
                                        results.performance.totalBlockingTime < 600 ? 'text-primary' : 'text-destructive'
                                    }`}>
                                    {results.performance.totalBlockingTime < 200 ? 'Good' : results.performance.totalBlockingTime < 600 ? 'Needs improvement' : 'Poor'}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Speed Index</div>
                                <div className="text-2xl font-bold">{results.performance.speedIndex}s</div>
                                <div className={`text-xs font-medium ${results.performance.speedIndex < 3.4 ? 'text-emerald-500' :
                                        results.performance.speedIndex < 5.8 ? 'text-primary' : 'text-destructive'
                                    }`}>
                                    {results.performance.speedIndex < 3.4 ? 'Good' : results.performance.speedIndex < 5.8 ? 'Needs improvement' : 'Poor'}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Time to Interactive</div>
                                <div className="text-2xl font-bold">{results.performance.timeToInteractive}s</div>
                                <div className={`text-xs font-medium ${results.performance.timeToInteractive < 3.8 ? 'text-emerald-500' :
                                        results.performance.timeToInteractive < 7.3 ? 'text-primary' : 'text-destructive'
                                    }`}>
                                    {results.performance.timeToInteractive < 3.8 ? 'Good' : results.performance.timeToInteractive < 7.3 ? 'Needs improvement' : 'Poor'}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* GTM Analysis Section (Placeholder) */}
                <Card className="opacity-60 mt-20 mb-20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FaTag className="w-6 h-6" />
                            Google Tag Manager Analysis
                        </CardTitle>
                        <CardDescription>
                            Detailed GTM container analysis and optimization recommendations
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12">
                            <FaTag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <div className="text-lg font-medium text-muted-foreground mb-2">
                                GTM Analysis Coming Soon
                            </div>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                Advanced GTM container analysis, trigger optimization, and tag management
                                recommendations will be available in a future update.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Cookie Status */}
                <Card className="mt-10 mb-10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FaShieldAlt className="w-6 h-6" />
                            Privacy & Cookies
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${results.cookiesAccepted ? 'bg-accent' : 'bg-destructive'}`}></div>
                                <div>
                                    <div className="font-medium">Cookie Consent</div>
                                    <div className="text-sm text-muted-foreground">
                                        {results.cookiesAccepted ? 'Automatically accepted' : 'Manual consent required'}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-medium">{results.cookieProvider}</div>
                                <div className="text-sm text-muted-foreground">Cookie Provider</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Scan Metadata */}
                <Card>
                    <CardHeader>
                        <CardTitle>Scan Metadata</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Target URL</div>
                                <div className="font-mono text-sm break-all">{results.url}</div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Scan Timestamp</div>
                                <div className="text-sm">{new Date(results.scannedAt).toLocaleString()}</div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Scanner Version</div>
                                <div className="text-sm">Omnipixel v2.0.0</div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Analysis Engine</div>
                                <div className="text-sm">Browser Automation + AI Analysis</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function ResultsPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        }>
            <ResultsContent />
        </Suspense>
    );
}
