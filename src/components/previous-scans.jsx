"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FaHistory, FaTrash, FaExternalLinkAlt } from 'react-icons/fa';

export default function PreviousScans() {
    const router = useRouter();
    const [scans, setScans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadPreviousScans();
    }, []);

    const loadPreviousScans = () => {
        try {
            if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
                setIsLoading(false);
                return;
            }

            const allScans = [];
            
            // Get all localStorage keys that start with 'scan_'
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('scan_')) {
                    try {
                        const data = localStorage.getItem(key);
                        if (data) {
                            const scanData = JSON.parse(data);
                            // Extract sessionId from key (format: scan_${sessionId})
                            const sessionId = key.replace('scan_', '');
                            
                            allScans.push({
                                key,
                                sessionId,
                                url: scanData.url || 'Unknown URL',
                                scannedAt: scanData.scannedAt || new Date(parseInt(sessionId)).toISOString(),
                                timestamp: parseInt(sessionId) || Date.now()
                            });
                        }
                    } catch (e) {
                        console.warn(`Failed to parse scan data for key ${key}:`, e);
                    }
                }
            }

            // Sort by timestamp (newest first)
            allScans.sort((a, b) => b.timestamp - a.timestamp);
            
            setScans(allScans);
        } catch (error) {
            console.error('Error loading previous scans:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewScan = (scan) => {
        // Navigate to results page with sessionId
        router.push(`/results?url=${encodeURIComponent(scan.url)}&sessionId=${scan.sessionId}`);
    };

    const handleClearScans = () => {
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
            return;
        }

        if (confirm('Are you sure you want to clear all previous scans? This cannot be undone.')) {
            try {
                // Remove all scan_ keys from localStorage
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('scan_')) {
                        keysToRemove.push(key);
                    }
                }
                
                keysToRemove.forEach(key => localStorage.removeItem(key));
                
                setScans([]);
                console.log(`Cleared ${keysToRemove.length} previous scan(s)`);
            } catch (error) {
                console.error('Error clearing scans:', error);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="border border-border/40 rounded p-4 bg-background">
                <div className="text-sm text-foreground/50">Loading previous scans...</div>
            </div>
        );
    }

    if (scans.length === 0) {
        return null; // Don't show anything if there are no scans
    }

    return (
        <div className="border border-border/40 rounded p-4 bg-background relative z-100">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <FaHistory className="w-3.5 h-3.5 text-foreground/50" />
                    <h3 className="text-sm font-light text-foreground">Your Previous Scans</h3>
                    <span className="text-xs text-foreground/40">({scans.length})</span>
                </div>
                {scans.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearScans}
                        className="h-7 px-2 text-xs text-foreground/60 hover:text-foreground hover:bg-secondary/50"
                    >
                        <FaTrash className="w-3 h-3 mr-1" />
                        Clear
                    </Button>
                )}
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {scans.map((scan) => (
                    <div
                        key={scan.key}
                        className="flex items-center justify-between gap-3 p-2 rounded hover:bg-secondary/30 transition-colors border border-border/20"
                    >
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-light text-foreground truncate">
                                {scan.url}
                            </div>
                            <div className="text-xs text-foreground/40 mt-0.5">
                                {new Date(scan.scannedAt).toLocaleString()}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewScan(scan)}
                            className="h-7 px-3 text-xs text-foreground/70 hover:text-foreground hover:bg-secondary/50 flex-shrink-0"
                        >
                            <FaExternalLinkAlt className="w-3 h-3 mr-1.5" />
                            View
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
