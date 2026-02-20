"use client";

import { Button } from "@/components/ui/button";
import { FaChartLine } from "react-icons/fa";

export function ResultsHeader({ url, onNewScan, onRescan, onExportPDF, isExporting, onShowMobileTOC }) {
    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <h1 className="text-4xl font-light tracking-tight text-foreground">
                    Technical Analysis Report
                </h1>
                <p className="text-sm text-foreground/50 font-mono">
                    {url}
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <Button
                    variant="outline"
                    size="sm"
                    className="lg:hidden"
                    onClick={onShowMobileTOC}
                >
                    <FaChartLine className="w-4 h-4 mr-2" />
                    Contents
                </Button>
                <Button onClick={onNewScan} variant="outline">
                    New Scan
                </Button>
                <Button variant="outline" onClick={onRescan}>
                    Re-scan
                </Button>
                <Button variant="ghost" onClick={onExportPDF} disabled={isExporting}>
                    {isExporting ? 'Exporting...' : 'Export to PDF'}
                </Button>
            </div>
        </div>
    );
}
