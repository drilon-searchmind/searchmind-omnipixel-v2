"use client";

import { useEffect, useState, useRef } from 'react';

export default function ScannerBox({ currentStep, statusMessages = [], isScanning = true }) {
    const [displayMessages, setDisplayMessages] = useState([]);
    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);

    // Update messages when statusMessages prop changes
    useEffect(() => {
        if (statusMessages.length > 0) {
            // Merge new messages with existing ones, avoiding duplicates
            setDisplayMessages(prev => {
                const existingIds = new Set(prev.map(m => m.id));
                const newMessages = statusMessages.filter(m => m.id && !existingIds.has(m.id));
                return [...prev, ...newMessages];
            });
        }
    }, [statusMessages]);

    // Auto-scroll to bottom within the container only (not the whole page)
    useEffect(() => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            // Use setTimeout to ensure DOM has updated, then scroll to bottom
            const timeoutId = setTimeout(() => {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            }, 50);
            
            return () => clearTimeout(timeoutId);
        }
    }, [displayMessages, currentStep]);

    // Generate technical status messages based on current step
    useEffect(() => {
        const stepMessages = {
            1: [
                { type: 'info', text: 'Initializing Puppeteer browser...', timestamp: Date.now() },
                { type: 'info', text: 'Platform: win32', timestamp: Date.now() + 100 },
                { type: 'success', text: 'Browser initialized successfully', timestamp: Date.now() + 500 },
            ],
            2: [
                { type: 'info', text: 'Creating new page for URL...', timestamp: Date.now() },
                { type: 'info', text: 'Viewport set', timestamp: Date.now() + 200 },
                { type: 'info', text: 'User agent set', timestamp: Date.now() + 300 },
                { type: 'info', text: 'Navigating to target...', timestamp: Date.now() + 400 },
                { type: 'success', text: 'Successfully navigated', timestamp: Date.now() + 1000 },
            ],
            3: [
                { type: 'info', text: 'Waiting for DOMContentLoaded...', timestamp: Date.now() },
                { type: 'info', text: 'Waiting for network idle...', timestamp: Date.now() + 500 },
                { type: 'success', text: 'Page load completed', timestamp: Date.now() + 1500 },
            ],
            4: [
                { type: 'info', text: 'Attempting to accept cookies and detect CMP provider...', timestamp: Date.now() },
                { type: 'info', text: 'Scanning for cookie consent banners...', timestamp: Date.now() + 300 },
                { type: 'info', text: 'Checking cookies for Google Consent Mode V2 properties...', timestamp: Date.now() + 600 },
                { type: 'success', text: 'Successfully accepted cookies', timestamp: Date.now() + 1200 },
            ],
            5: [
                { type: 'info', text: 'Fetching PageSpeed Insights API...', timestamp: Date.now() },
                { type: 'info', text: 'Analyzing Core Web Vitals...', timestamp: Date.now() + 500 },
                { type: 'success', text: 'Performance metrics retrieved', timestamp: Date.now() + 2000 },
            ],
            6: [
                { type: 'info', text: 'Getting HTML content for GTM scan...', timestamp: Date.now() },
                { type: 'info', text: 'Scanning HTML for GTM containers...', timestamp: Date.now() + 300 },
                { type: 'info', text: 'Checking window.google_tag_manager...', timestamp: Date.now() + 600 },
                { type: 'info', text: 'GTM is active (dataLayer contains gtm.js events)', timestamp: Date.now() + 900 },
                { type: 'success', text: 'GTM containers found', timestamp: Date.now() + 1500 },
            ],
            7: [
                { type: 'info', text: 'Calling Tagstack API...', timestamp: Date.now() },
                { type: 'info', text: 'Analyzing GTM container structure...', timestamp: Date.now() + 500 },
                { type: 'info', text: 'Extracting tags, triggers, and variables...', timestamp: Date.now() + 1000 },
                { type: 'success', text: 'Tagstack analysis completed', timestamp: Date.now() + 2500 },
            ],
            8: [
                { type: 'info', text: 'Scanning for marketing pixels...', timestamp: Date.now() },
                { type: 'info', text: 'Checking for Meta Pixel (Facebook)...', timestamp: Date.now() + 300 },
                { type: 'info', text: 'Checking for TikTok Pixel...', timestamp: Date.now() + 600 },
                { type: 'info', text: 'Checking for LinkedIn Insight Tag...', timestamp: Date.now() + 900 },
                { type: 'info', text: 'Checking for Google Ads...', timestamp: Date.now() + 1200 },
                { type: 'success', text: 'Pixel scanning completed', timestamp: Date.now() + 1800 },
            ],
            9: [
                { type: 'info', text: 'Compiling scan results...', timestamp: Date.now() },
                { type: 'info', text: 'Storing results in localStorage...', timestamp: Date.now() + 300 },
                { type: 'success', text: 'Scan completed successfully', timestamp: Date.now() + 600 },
            ],
        };

        if (stepMessages[currentStep]) {
            const newMessages = stepMessages[currentStep].map(msg => ({
                ...msg,
                id: `${currentStep}-${msg.timestamp}`,
            }));
            setDisplayMessages(prev => {
                // Remove messages from previous step and add new ones
                const filtered = prev.filter(m => !m.id?.startsWith(`${currentStep}-`));
                return [...filtered, ...newMessages];
            });
        }
    }, [currentStep]);

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            fractionalSecondDigits: 3
        });
    };

    const getStatusIcon = (type) => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✗';
            case 'warning':
                return '⚠';
            default:
                return '→';
        }
    };

    const getStatusColor = (type) => {
        switch (type) {
            case 'success':
                return 'text-green-500';
            case 'error':
                return 'text-red-500';
            case 'warning':
                return 'text-yellow-500';
            default:
                return 'text-[#778da9]';
        }
    };

    return (
        <div className="border border-border/40 rounded-lg bg-[#1E2928] overflow-hidden shadow-lg">
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-border/40 bg-[#1E2928] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
                    </div>
                    <span className="text-xs font-mono text-[#e0e1dd]/70 ml-2">scanner.exe</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-mono text-green-500/90">RUNNING</span>
                </div>
            </div>

            {/* Terminal Content */}
            <div 
                ref={scrollContainerRef}
                className="p-4 font-mono text-xs h-[400px] overflow-y-auto bg-[#1E2928] scrollbar-thin scrollbar-thumb-[#415a77]/50 scrollbar-track-transparent"
            >
                <div className="space-y-1">
                    {displayMessages.length === 0 ? (
                        <div className="text-[#e0e1dd]/50">
                            <span className="text-green-500/70">$</span> Waiting for scan to start...
                        </div>
                    ) : (
                        displayMessages.map((msg, index) => (
                            <div
                                key={msg.id || index}
                                className="flex items-start gap-3 text-[#e0e1dd]/90 hover:text-[#e0e1dd] transition-colors"
                            >
                                <span className="text-[#778da9]/60 flex-shrink-0">
                                    [{formatTimestamp(msg.timestamp)}]
                                </span>
                                <span className={`flex-shrink-0 ${getStatusColor(msg.type)}`}>
                                    {getStatusIcon(msg.type)}
                                </span>
                                <span className="flex-1">{msg.text}</span>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Cursor blink effect */}
                {isScanning && (
                    <div className="flex items-start gap-3 mt-1">
                        <span className="text-[#778da9]/60 flex-shrink-0">
                            [{formatTimestamp(Date.now())}]
                        </span>
                        <span className="text-green-500/70 flex-shrink-0">→</span>
                        <span className="flex-1">
                            <span className="text-[#e0e1dd]/70">Executing step {currentStep}...</span>
                            <span 
                                className="inline-block w-2 h-4 bg-green-500/80 ml-1" 
                                style={{ 
                                    animation: 'blink 0.5s steps(2, end) infinite' 
                                }}
                            ></span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
