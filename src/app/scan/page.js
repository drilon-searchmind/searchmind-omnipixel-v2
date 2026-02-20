"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import ScannerBox from "@/components/scan/scanner-box";
import ScanInfoBox from "@/components/scan/scan-info-box";

const SCAN_STEPS = [
    { id: 1, title: "Initializing Scanner", description: "Setting up scanning environment" },
    { id: 2, title: "Navigating to URL", description: "Connecting to the target website" },
    { id: 3, title: "Waiting for Page Load", description: "Allowing page to load completely" },
    { id: 4, title: "Accepting Cookies", description: "Automatically accepting cookie consent" },
    { id: 5, title: "Analyzing Performance", description: "Fetching Core Web Vitals and metrics" },
    { id: 6, title: "Scanning GTM Containers", description: "Detecting Google Tag Manager implementations" },
    { id: 7, title: "Tagstack Analysis", description: "Analyzing GTM container with Tagstack" },
    { id: 8, title: "Scanning Marketing Pixels", description: "Detecting Meta Pixel, TikTok, LinkedIn, and Google Ads" },
    { id: 9, title: "Scanning JSON-LD Structured Data", description: "Extracting and validating JSON-LD schemas" },
    { id: 10, title: "Finalizing Results", description: "Preparing scan results" },
];

function ScanContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const url = searchParams.get("url");
    const referrer = searchParams.get("referrer");
    const customerId = searchParams.get("customerId");

    const [currentStep, setCurrentStep] = useState(0);
    const [isScanning, setIsScanning] = useState(true);
    const [error, setError] = useState(null);
    const [statusMessages, setStatusMessages] = useState([]);
    const [scanData, setScanData] = useState({});

    useEffect(() => {
        if (!url) {
            router.push("/");
            return;
        }

        startScanning(url);
    }, [url, router]);

    const startScanning = async (targetUrl) => {
        try {
            // Use Server-Sent Events for real-time progress updates
            console.log('Starting scan with streaming updates for URL:', targetUrl);

            // Start the scan with streaming enabled
            const response = await fetch('/api/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: targetUrl, stream: true }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API returned ${response.status}: ${errorText}`);
            }

            // Read the stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let scanResults = null;

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    console.log('Stream ended');
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            console.log('Received SSE data:', data);

                            if (data.type === 'progress') {
                                // Update UI step based on progress
                                setCurrentStep(data.step);
                                console.log(`Step ${data.step}: ${data.message}`);
                                
                                // Add message to status messages for scanner box
                                setStatusMessages(prev => [
                                    ...prev,
                                    {
                                        type: 'info',
                                        text: data.message || `Executing step ${data.step}...`,
                                        timestamp: Date.now(),
                                        id: `progress-${Date.now()}-${Math.random()}`
                                    }
                                ]);
                                
                                // Update scan data incrementally if available
                                if (data.data) {
                                    setScanData(prev => ({ ...prev, ...data.data }));
                                }
                            } else if (data.type === 'error') {
                                throw new Error(data.message);
                            } else if (data.type === 'complete') {
                                if (data.success) {
                                    scanResults = data.data;
                                    console.log('Scan completed successfully:', scanResults);
                                    
                                    // Update scan data for info box
                                    setScanData(scanResults);

                                    // Step 10: Finalizing (UI-only step)
                                    setCurrentStep(10);

                                    // Store scan results in localStorage to avoid URL size limits
                                    // Generate a unique session ID (without "scan_" prefix to avoid duplication)
                                    const sessionId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
                                    const storageKey = `scan_${sessionId}`;
                                    
                                    console.log('📦 Storing scan results in localStorage');
                                    console.log('   SessionId:', sessionId);
                                    console.log('   Storage key:', storageKey);
                                    console.log('   Target URL:', targetUrl);
                                    
                                    // Check if localStorage is available
                                    if (typeof Storage === 'undefined' || typeof localStorage === 'undefined') {
                                        console.error('❌ localStorage is not available in this browser');
                                        throw new Error('localStorage is not supported');
                                    }
                                    
                                    // Check if localStorage is accessible (some browsers block it in private mode)
                                    try {
                                        const testKey = '__localStorage_test__';
                                        localStorage.setItem(testKey, 'test');
                                        localStorage.removeItem(testKey);
                                    } catch (e) {
                                        console.error('❌ localStorage is not accessible:', e);
                                        throw new Error('localStorage is not accessible - may be blocked by browser');
                                    }
                                    
                                    const resultsJson = JSON.stringify(scanResults);
                                    console.log('   Scan results size:', resultsJson.length, 'characters');
                                    console.log('   GTM Info in results:', scanResults.gtmInfo ? 'Present' : 'Missing');
                                    console.log('   Tagstack Info in results:', scanResults.tagstackInfo ? 'Present' : 'Missing');
                                    console.log('   Scan results keys:', Object.keys(scanResults));
                                    
                                    // Check localStorage quota (typically 5-10MB)
                                    const estimatedSize = new Blob([resultsJson]).size;
                                    console.log('   Estimated size:', estimatedSize, 'bytes (~', Math.round(estimatedSize / 1024), 'KB)');
                                    
                                    try {
                                        // Clear old scan data if localStorage is getting full
                                        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
                                        const now = Date.now();
                                        const keysToRemove = [];
                                        for (let i = 0; i < localStorage.length; i++) {
                                            const key = localStorage.key(i);
                                            if (key && key.startsWith('scan_')) {
                                                try {
                                                    const timestamp = parseInt(key.split('_')[1]);
                                                    if (timestamp && (now - timestamp) > maxAge) {
                                                        keysToRemove.push(key);
                                                    }
                                                } catch (e) {
                                                    // If we can't parse the timestamp, remove old keys anyway
                                                    keysToRemove.push(key);
                                                }
                                            }
                                        }
                                        keysToRemove.forEach(key => {
                                            console.log('   Removing old scan data:', key);
                                            localStorage.removeItem(key);
                                        });
                                        
                                        // Try to store the data
                                        localStorage.setItem(storageKey, resultsJson);
                                        console.log('   ✅ localStorage.setItem() called successfully');
                                        
                                        // Verify it was stored immediately
                                        const verify = localStorage.getItem(storageKey);
                                        if (verify) {
                                            console.log('✅ Scan results stored and verified in localStorage');
                                            console.log('   Stored data size:', verify.length, 'characters');
                                            console.log('   Storage key exists:', localStorage.getItem(storageKey) !== null);
                                            
                                            // Verify the data structure
                                            try {
                                                const parsed = JSON.parse(verify);
                                                console.log('   ✅ Data can be parsed back:', Object.keys(parsed));
                                            } catch (parseError) {
                                                console.error('   ❌ Data cannot be parsed back:', parseError);
                                            }
                                        } else {
                                            console.error('❌ Failed to verify storage - data not found after storing');
                                            console.error('   Storage key after setItem:', localStorage.getItem(storageKey));
                                            setError('Failed to save scan results: Data not found after storing. Please try again.');
                                            setIsScanning(false);
                                            return; // Stop execution
                                        }
                                    } catch (error) {
                                        console.error('❌ Failed to store in localStorage:', error);
                                        console.error('   Error name:', error.name);
                                        console.error('   Error message:', error.message);
                                        console.error('   Error stack:', error.stack);
                                        
                                        if (error.name === 'QuotaExceededError') {
                                            console.error('   LocalStorage quota exceeded. Data too large.');
                                            console.error('   Try clearing old scan data or reducing data size.');
                                            setError('Failed to save scan results: Storage quota exceeded. Please clear browser data and try again.');
                                        } else {
                                            setError(`Failed to save scan results: ${error.message}. Please try again.`);
                                        }
                                        
                                        setIsScanning(false);
                                        return; // Don't redirect if storage failed
                                    }

                                    // Wait a moment before redirecting to ensure storage is complete
                                    setTimeout(() => {
                                        // Build results URL with all necessary parameters
                                        const params = new URLSearchParams();
                                        params.set("url", targetUrl);
                                        params.set("sessionId", sessionId);
                                        if (referrer) params.set("referrer", referrer);
                                        if (customerId) params.set("customerId", customerId);
                                        
                                        const resultsUrl = `/results?${params.toString()}`;
                                        console.log('🔀 Redirecting to results page');
                                        console.log('   SessionId in URL:', sessionId);
                                        console.log('   Referrer:', referrer);
                                        console.log('   CustomerId:', customerId);
                                        console.log('   Results URL:', resultsUrl);
                                        
                                        // Double-check the data is still in localStorage before redirecting
                                        const verifyBeforeRedirect = localStorage.getItem(storageKey);
                                        if (verifyBeforeRedirect) {
                                            console.log('   ✅ Verified data still in localStorage before redirect');
                                            console.log('   Data size:', verifyBeforeRedirect.length, 'characters');
                                            
                                            // List all scan keys for debugging
                                            const allScanKeys = [];
                                            for (let i = 0; i < localStorage.length; i++) {
                                                const key = localStorage.key(i);
                                                if (key && key.startsWith('scan_')) {
                                                    allScanKeys.push(key);
                                                }
                                            }
                                            console.log('   All scan keys in localStorage:', allScanKeys);
                                        } else {
                                            console.error('   ❌ WARNING: Data NOT found in localStorage before redirect!');
                                            console.error('   Storage key:', storageKey);
                                            console.error('   localStorage length:', localStorage.length);
                                            
                                            // List all keys for debugging
                                            const allKeys = [];
                                            for (let i = 0; i < localStorage.length; i++) {
                                                allKeys.push(localStorage.key(i));
                                            }
                                            console.error('   All localStorage keys:', allKeys);
                                            
                                            // Don't redirect if data is missing
                                            setError('Failed to save scan results. Please try again.');
                                            setIsScanning(false);
                                            return;
                                        }
                                        
                                        router.push(resultsUrl);
                                    }, 1000); // Wait 1 second before redirecting
                                } else {
                                    throw new Error(data.error || 'Scanning failed');
                                }
                            }
                        } catch (parseError) {
                            console.error('Failed to parse SSE data:', parseError, 'Line:', line);
                        }
                    }
                }
            }

        } catch (err) {
            console.error('Scan error:', err);
            setError(err.message);
            setIsScanning(false);
        }
    };

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center p-8">
                <div className="w-full max-w-md space-y-6">
                    <div className="space-y-2 text-center">
                        <h2 className="text-2xl font-light text-foreground">Scan Error</h2>
                        <p className="text-sm text-foreground/60">
                            An error occurred while scanning the URL
                        </p>
                    </div>
                    <div className="p-4 border border-border/40 rounded bg-background">
                        <p className="text-sm text-foreground/70 font-mono">{error}</p>
                    </div>
                    <Button onClick={() => router.push("/")} className="w-full">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-16 px-6">
            <div className="max-w-7xl mx-auto space-y-12 grid grid-cols-12 gap-6">
                <span className="col-span-6">
                    {/* Header */}
                    <div className="space-y-3 text-center">
                        <h1 className="text-3xl font-light text-foreground">Scanning URL</h1>
                        <p className="text-sm text-foreground/50 font-mono">
                            {url}
                        </p>
                    </div>

                    {/* Loading Indicator */}
                    {isScanning && (
                        <div className="text-center space-y-3 pt-4">
                            <div className="inline-block">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-foreground/20 border-t-foreground"></div>
                            </div>
                            <p className="text-sm text-foreground/50">
                                Please wait while we scan the website...
                            </p>

                            <div className="space-y-4">
                                <ScannerBox 
                                    currentStep={currentStep} 
                                    statusMessages={statusMessages}
                                    isScanning={isScanning}
                                />
                                <ScanInfoBox 
                                    currentStep={currentStep}
                                    scanData={scanData}
                                />
                            </div>
                        </div>
                    )}
                </span>

                <span className="col-span-6">
                    {/* Steps */}
                    <div className="space-y-3">
                        {SCAN_STEPS.map((step, index) => (
                            <div
                                key={step.id}
                                className={`flex items-start gap-4 p-5 border rounded transition-all ${index < currentStep
                                    ? "border-foreground/20 bg-foreground/5"
                                    : index === currentStep - 1
                                        ? "border-foreground/40 bg-foreground/10"
                                        : "border-border/40 bg-background"
                                    }`}
                            >
                                {/* Step Number/Icon */}
                                <div className="flex-shrink-0 mt-0.5">
                                    <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-normal transition-all ${index < currentStep
                                            ? "bg-foreground text-background"
                                            : index === currentStep - 1
                                                ? "bg-foreground text-background animate-pulse"
                                                : "bg-secondary text-foreground/40 border border-border/60"
                                            }`}
                                    >
                                        {index < currentStep ? (
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            step.id
                                        )}
                                    </div>
                                </div>

                                {/* Step Content */}
                                <div className="flex-1 space-y-1">
                                    <h3 className={`text-base font-normal ${index < currentStep
                                        ? "text-foreground"
                                        : index === currentStep - 1
                                            ? "text-foreground"
                                            : "text-foreground/60"
                                        }`}>
                                        {step.title}
                                    </h3>
                                    <p className={`text-sm ${index < currentStep
                                        ? "text-foreground/50"
                                        : index === currentStep - 1
                                            ? "text-foreground/50"
                                            : "text-foreground/40"
                                        }`}>
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </span>
            </div>
        </div>
    );
}

export default function ScanPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-foreground/20 border-t-foreground"></div>
            </div>
        }>
            <ScanContent />
        </Suspense>
    );
}
