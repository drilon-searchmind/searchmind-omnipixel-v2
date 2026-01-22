"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SCAN_STEPS = [
    { id: 1, title: "Initializing Scanner", description: "Setting up scanning environment" },
    { id: 2, title: "Navigating to URL", description: "Connecting to the target website" },
    { id: 3, title: "Waiting for Page Load", description: "Allowing page to load completely" },
    { id: 4, title: "Accepting Cookies", description: "Automatically accepting cookie consent" },
    { id: 5, title: "Analyzing Tracking Data", description: "Scanning for tracking pixels and scripts" },
];

function ScanContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const url = searchParams.get("url");

    const [currentStep, setCurrentStep] = useState(0);
    const [isScanning, setIsScanning] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!url) {
            router.push("/");
            return;
        }

        startScanning(url);
    }, [url, router]);

    const startScanning = async (targetUrl) => {
        try {
            // Step 1: Initialize (simulate)
            setCurrentStep(1);
            await delay(500);

            // Step 2: Navigate to URL (call API)
            setCurrentStep(2);

            let response;
            try {
                console.log('Making API call to /api/scan with URL:', targetUrl);
                response = await fetch('/api/scan', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url: targetUrl }),
                });

                console.log('API response received:', response);
                console.log('API response status:', response.status);
                console.log('API response ok:', response.ok);
                console.log('API response type:', typeof response);
            } catch (fetchError) {
                console.error('Fetch error:', fetchError);
                throw new Error(`Network error: ${fetchError.message}`);
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API error response:', errorText);
                throw new Error(`API returned ${response.status}: ${errorText}`);
            }

            let scanResults;
            try {
                scanResults = await response.json();
                console.log('Scan results:', scanResults);
            } catch (jsonError) {
                console.error('JSON parse error:', jsonError);
                throw new Error(`Failed to parse API response: ${jsonError.message}`);
            }

            if (!scanResults.success) {
                throw new Error(scanResults.data?.error || scanResults.message || 'Scanning failed');
            }

            // Steps 2-4 completed via API (includes cookie acceptance)
            setCurrentStep(5);

            // Step 6: Analyze tracking data (simulate)
            await delay(2000);

            // Complete - redirect to results with scan data
            const resultsUrl = `/results?url=${encodeURIComponent(targetUrl)}&scanData=${encodeURIComponent(JSON.stringify(scanResults.data))}`;
            router.push(resultsUrl);

        } catch (err) {
            setError(err.message);
            setIsScanning(false);
        }
    };

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center p-8">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Scan Error</CardTitle>
                        <CardDescription>
                            An error occurred while scanning the URL
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{error}</p>
                        <Button onClick={() => router.push("/")} className="w-full">
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-8">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Scanning URL</CardTitle>
                    <CardDescription className="text-lg">
                        {url}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        {SCAN_STEPS.map((step, index) => (
                            <div
                                key={step.id}
                                className={`flex items-center space-x-4 p-4 rounded-lg border transition-colors ${
                                    index < currentStep
                                        ? "bg-green-50 border-green-200"
                                        : index === currentStep - 1
                                        ? "bg-blue-50 border-blue-200"
                                        : "bg-gray-50 border-gray-200"
                                }`}
                            >
                                <div
                                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                        index < currentStep
                                            ? "bg-green-500 text-white"
                                            : index === currentStep - 1
                                            ? "bg-blue-500 text-white animate-pulse"
                                            : "bg-gray-300 text-gray-600"
                                    }`}
                                >
                                    {index < currentStep ? (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        step.id
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-medium ${index < currentStep ? "text-green-800" : index === currentStep - 1 ? "text-blue-800" : "text-gray-600"}`}>
                                        {step.title}
                                    </h3>
                                    <p className={`text-sm ${index < currentStep ? "text-green-600" : index === currentStep - 1 ? "text-blue-600" : "text-gray-500"}`}>
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {isScanning && (
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="text-sm text-muted-foreground mt-2">
                                Please wait while we scan the website...
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function ScanPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        }>
            <ScanContent />
        </Suspense>
    );
}
