import { FaTachometerAlt, FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from "react-icons/fa";

export function PerformanceMetrics({ results }) {
    const getScoreStatus = (metric, value) => {
        // Core Web Vitals scoring thresholds
        const thresholds = {
            firstContentfulPaint: { good: 1800, needsImprovement: 3000 },
            largestContentfulPaint: { good: 2500, needsImprovement: 4000 },
            firstInputDelay: { good: 100, needsImprovement: 300 },
            cumulativeLayoutShift: { good: 0.1, needsImprovement: 0.25 },
            timeToFirstByte: { good: 600, needsImprovement: 1000 },
            speedIndex: { good: 3400, needsImprovement: 5800 },
            timeToInteractive: { good: 3800, needsImprovement: 7300 }
        };

        const threshold = thresholds[metric];
        if (!threshold) return { status: 'unknown', color: 'text-black/30', icon: null };

        if (value <= threshold.good) {
            return { status: 'good', color: 'text-emerald-800', icon: FaCheckCircle };
        }
        if (value <= threshold.needsImprovement) {
            return { status: 'needs-improvement', color: 'text-amber-600', icon: FaExclamationTriangle };
        }
        return { status: 'poor', color: 'text-amber-600', icon: FaTimesCircle };
    };

    const formatMetric = (value, unit = 'ms') => {
        if (unit === 'ms') return `${value}ms`;
        if (unit === 's') return `${(value / 1000).toFixed(1)}s`;
        return value;
    };

    const performance = results.performance || {};
    
    const coreWebVitals = [
        { key: 'firstContentfulPaint', label: 'First Contentful Paint', shortLabel: 'FCP', value: performance.firstContentfulPaint, unit: 'ms' },
        { key: 'largestContentfulPaint', label: 'Largest Contentful Paint', shortLabel: 'LCP', value: performance.largestContentfulPaint, unit: 'ms' },
        { key: 'firstInputDelay', label: 'First Input Delay', shortLabel: 'FID', value: performance.firstInputDelay, unit: 'ms' },
        { key: 'cumulativeLayoutShift', label: 'Cumulative Layout Shift', shortLabel: 'CLS', value: performance.cumulativeLayoutShift, unit: '', formatter: (v) => v.toFixed(3) },
    ];

    const performanceMetrics = [
        { key: 'timeToFirstByte', label: 'First Byte Time', shortLabel: 'FBT', value: performance.timeToFirstByte, unit: 'ms' },
        { key: 'speedIndex', label: 'Speed Index', shortLabel: 'SI', value: performance.speedIndex, unit: 'ms' },
        { key: 'timeToInteractive', label: 'Time to Interactive', shortLabel: 'TTI', value: performance.timeToInteractive, unit: 'ms' },
        { key: 'loadTime', label: 'Page Load Time', shortLabel: 'Load', value: performance.loadTime, unit: 's' },
    ];

    return (
        <div id="performance" className="space-y-8">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <FaTachometerAlt className="w-5 h-5 text-foreground/50" />
                    <h2 className="text-2xl font-light text-foreground">Core Web Vitals & Performance</h2>
                </div>
                <p className="text-sm text-foreground/50">
                    Google Core Web Vitals metrics and performance indicators
                </p>
            </div>

            {/* Dashboard Container - Black Background */}
            <div className="bg-foreground text-background rounded-lg py-10 px-6 space-y-8 mb-20">
                {/* Overall Performance Score */}
                {performance.performanceScore !== undefined && (
                    <div className="border-b border-white/20 pb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-light text-white/70 uppercase tracking-wider mb-4">Performance Score</h3>
                                {/* Circular Progress Chart */}
                                <div className="relative w-32 h-32 mx-auto mb-4">
                                    {/* Background circle */}
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                                        <circle
                                            cx="60"
                                            cy="60"
                                            r="50"
                                            stroke="rgba(255,255,255,0.1)"
                                            strokeWidth="8"
                                            fill="none"
                                        />
                                        {/* Progress circle */}
                                        <circle
                                            cx="60"
                                            cy="60"
                                            r="50"
                                            stroke="white"
                                            strokeWidth="8"
                                            fill="none"
                                            strokeDasharray={`${2 * Math.PI * 50}`}
                                            strokeDashoffset={`${2 * Math.PI * 50 * (1 - performance.performanceScore / 100)}`}
                                            strokeLinecap="round"
                                            className="transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    {/* Score text in center */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="text-3xl font-light text-white">{performance.performanceScore}</div>
                                            <div className="text-xs font-light text-white/60 uppercase tracking-wide">Score</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right space-y-1">
                                <div className="text-xs text-white/50 uppercase tracking-wide">Best Practices</div>
                                <div className="text-lg font-light text-white">{performance.bestPracticesScore || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Core Web Vitals Grid */}
                <div>
                    <h3 className="text-sm font-light text-white/70 uppercase tracking-wider mb-4">Core Web Vitals</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {coreWebVitals.map((metric) => {
                            const scoreStatus = getScoreStatus(metric.key, metric.value);
                            const Icon = scoreStatus.icon;
                            return (
                                <div key={metric.key} className="bg-white/95 border rounded p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-light text-black uppercase tracking-wide">
                                            {metric.shortLabel}
                                        </span>
                                        {Icon && <Icon className={`w-4 h-4 ${scoreStatus.color}`} />}
                                    </div>
                                    <div className="space-y-1">
                                        <div className={`text-2xl font-light ${scoreStatus.color}`}>
                                            {metric.formatter ? metric.formatter(metric.value) : formatMetric(metric.value, metric.unit)}
                                        </div>
                                        <div className="text-xs text-foreground/50 font-light">
                                            {metric.label}
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-white/10">
                                        <div className="text-xs text-foreground/40 capitalize">{scoreStatus.status.replace('-', ' ')}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Additional Performance Metrics */}
                <div>
                    <h3 className="text-sm font-light text-foreground/70 uppercase tracking-wider mb-4">Additional Metrics</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {performanceMetrics.map((metric) => {
                            const scoreStatus = getScoreStatus(metric.key, metric.value);
                            const Icon = scoreStatus.icon;
                            return (
                                <div key={metric.key} className="bg-white/95 border rounded p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-light text-foreground/60 uppercase tracking-wide">
                                            {metric.shortLabel}
                                        </span>
                                        {Icon && <Icon className={`w-4 h-4 ${scoreStatus.color}`} />}
                                    </div>
                                    <div className="space-y-1">
                                        <div className={`text-2xl font-light ${scoreStatus.color}`}>
                                            {metric.formatter ? metric.formatter(metric.value) : formatMetric(metric.value, metric.unit)}
                                        </div>
                                        <div className="text-xs text-foreground/50 font-light">
                                            {metric.label}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}