"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { buildResults } from "@/lib/build-results";

/**
 * Hook to load scan results from localStorage or URL params
 */
export function useResultsLoader(url, sessionId, scanDataParam, setResults, setError) {
    const router = useRouter();

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

                    // Try immediate read first
                    let storedData = localStorage.getItem(storageKey);

                    // If not found, wait a bit and retry (in case storage just completed)
                    if (!storedData) {
                        console.log('Data not found immediately, waiting 500ms...');
                        await new Promise(resolve => setTimeout(resolve, 500));
                        storedData = localStorage.getItem(storageKey);
                    }

                    if (storedData) {
                        console.log('Found data in localStorage, size:', storedData.length, 'characters');
                        scanData = JSON.parse(storedData);
                        console.log('✅ Loaded scan data from localStorage');
                        
                        // Clean up old scans (older than 1 hour)
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
                        
                        // Fallback: Try to find the most recent scan data if exact match not found
                        const allKeys = [];
                        for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key && key.startsWith('scan_')) {
                                allKeys.push(key);
                            }
                        }

                        if (allKeys.length > 0) {
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
                                        const candidateUrl = parsed.url?.replace(/\/$/, '');
                                        const targetUrl = url?.replace(/\/$/, '');
                                        if (candidateUrl === targetUrl) {
                                            console.log(`✅ Found matching scan data in fallback key: ${key}`);
                                            scanData = parsed;
                                            localStorage.removeItem(key);
                                            break;
                                        }
                                    }
                                } catch (e) {
                                    console.warn(`Failed to parse candidate data from ${key}:`, e);
                                }
                            }

                            // Last resort: use the most recent scan data
                            if (!scanData && sortedKeys.length > 0) {
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
                    console.error('Failed to load scan data from localStorage:', error);
                }
            }

            // Fallback to URL parameter (legacy support)
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

                    setResults(buildResults(scanData, url));

                    console.log('✅ Results set with real scan data');
                    return;
                } catch (error) {
                    console.error('❌ Failed to process scan data:', error);
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
                    consentModeV2: true,
                    serverSideTracking: false,
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
                    scores: {
                        privacy: 85,
                        performance: 78,
                        tracking: 92,
                        compliance: 88
                    },
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
    }, [url, sessionId, scanDataParam, router, setResults, setError]);
}
