"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function ResultsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const url = searchParams.get("url");

    const [results, setResults] = useState(null);

    useEffect(() => {
        if (!url) {
            router.push("/");
            return;
        }

        // Mock results - replace with actual scanning logic
        setResults({
            url: url,
            scannedAt: new Date().toISOString(),
            trackingData: {
                googleAnalytics: {
                    found: true,
                    version: "GA4",
                    trackingId: "G-XXXXXXXXXX"
                },
                facebookPixel: {
                    found: true,
                    pixelId: "123456789012345"
                },
                linkedin: {
                    found: false
                },
                twitter: {
                    found: false
                }
            },
            cookiesAccepted: true,
            cookieProvider: "Cookiebot",
            loadTime: "2.3s",
            scripts: 15,
            externalDomains: 8
        });
    }, [url, router]);

    if (!results) {
        return (
            <div className="flex min-h-screen items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">
                        Scan Results
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Analysis complete for <span className="font-mono">{results.url}</span>
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button onClick={() => router.push("/")}>
                            Scan Another URL
                        </Button>
                        <Button variant="outline" onClick={() => router.push("/scan?url=" + encodeURIComponent(results.url))}>
                            Re-scan
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Load Time
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{results.loadTime}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Scripts Found
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{results.scripts}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                External Domains
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{results.externalDomains}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Cookies Accepted
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${results.cookiesAccepted ? 'text-green-600' : 'text-red-600'}`}>
                                {results.cookiesAccepted ? 'Yes' : 'No'}
                            </div>
                            {results.cookieProvider && (
                                <div className="text-xs text-muted-foreground mt-1">
                                    via {results.cookieProvider}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Tracking Data */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tracking Pixels & Scripts</CardTitle>
                        <CardDescription>
                            Found tracking implementations on this website
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(results.trackingData).map(([platform, data]) => (
                                <div key={platform} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-3 h-3 rounded-full ${data.found ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <div>
                                            <div className="font-medium capitalize">
                                                {platform.replace(/([A-Z])/g, ' $1').trim()}
                                            </div>
                                            {data.found && (
                                                <div className="text-sm text-muted-foreground">
                                                    {data.version && `Version: ${data.version}`}
                                                    {data.trackingId && ` | ID: ${data.trackingId}`}
                                                    {data.pixelId && ` | Pixel: ${data.pixelId}`}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`text-sm font-medium ${data.found ? 'text-green-600' : 'text-gray-500'}`}>
                                        {data.found ? 'Found' : 'Not Found'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Scan Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Scan Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Scanned URL:</span>
                                <span className="font-mono">{results.url}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Scan Date:</span>
                                <span>{new Date(results.scannedAt).toLocaleString()}</span>
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
