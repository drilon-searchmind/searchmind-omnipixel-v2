import { FaTachometerAlt } from "react-icons/fa";

export function PerformanceMetrics({ results }) {
    const getScoreColor = (metric, value) => {
        // Core Web Vitals scoring thresholds
        const thresholds = {
            firstContentfulPaint: { good: 1800, needsImprovement: 3000 },
            largestContentfulPaint: { good: 2500, needsImprovement: 4000 },
            firstInputDelay: { good: 100, needsImprovement: 300 },
            cumulativeLayoutShift: { good: 0.1, needsImprovement: 0.25 },
            totalBlockingTime: { good: 200, needsImprovement: 600 },
            speedIndex: { good: 3400, needsImprovement: 5800 },
            timeToInteractive: { good: 3800, needsImprovement: 7300 }
        };

        const threshold = thresholds[metric];
        if (!threshold) return 'text-foreground/50';

        if (value <= threshold.good) return 'text-foreground';
        if (value <= threshold.needsImprovement) return 'text-foreground/70';
        return 'text-foreground/50';
    };

    const formatMetric = (value, unit = 'ms') => {
        if (unit === 'ms') return `${value}ms`;
        if (unit === 's') return `${(value / 1000).toFixed(1)}s`;
        return value;
    };

    const metrics = [
        { key: 'firstContentfulPaint', label: 'First Contentful Paint', value: results.performance.firstContentfulPaint, unit: 'ms' },
        { key: 'largestContentfulPaint', label: 'Largest Contentful Paint', value: results.performance.largestContentfulPaint, unit: 'ms' },
        { key: 'firstInputDelay', label: 'First Input Delay', value: results.performance.firstInputDelay, unit: 'ms' },
        { key: 'cumulativeLayoutShift', label: 'Cumulative Layout Shift', value: results.performance.cumulativeLayoutShift, unit: '', formatter: (v) => v.toFixed(3) },
        { key: 'totalBlockingTime', label: 'Total Blocking Time', value: results.performance.totalBlockingTime, unit: 'ms' },
        { key: 'speedIndex', label: 'Speed Index', value: results.performance.speedIndex, unit: 'ms' },
        { key: 'timeToInteractive', label: 'Time to Interactive', value: results.performance.timeToInteractive, unit: 'ms' },
        { key: 'loadTime', label: 'Page Load Time', value: results.performance.loadTime, unit: 's' }
    ];

    return (
        <div id="performance" className="space-y-8 bg-foreground/10 py-20 px-6 rounded">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <FaTachometerAlt className="w-5 h-5 text-foreground/50" />
                    <h2 className="text-2xl font-light text-foreground">Core Web Vitals & Performance</h2>
                </div>
                <p className="text-sm text-foreground/50">
                    Google Core Web Vitals metrics and performance indicators
                </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {metrics.map((metric) => (
                    <div key={metric.key} className="space-y-2">
                        <div className="flex justify-between items-start">
                            <span className="text-sm font-light text-foreground/70 leading-tight">
                                {metric.label}
                            </span>
                            <span className={`text-lg font-light ${getScoreColor(metric.key, metric.value)}`}>
                                {metric.formatter ? metric.formatter(metric.value) : formatMetric(metric.value, metric.unit)}
                            </span>
                        </div>
                        <div className="text-xs text-foreground/50">
                            {metric.key === 'firstContentfulPaint' && 'Time to first content render'}
                            {metric.key === 'largestContentfulPaint' && 'Time to largest content render'}
                            {metric.key === 'firstInputDelay' && 'Response time to user input'}
                            {metric.key === 'cumulativeLayoutShift' && 'Visual stability score'}
                            {metric.key === 'totalBlockingTime' && 'Time page is blocked from responding'}
                            {metric.key === 'speedIndex' && 'Time for page to become visually complete'}
                            {metric.key === 'timeToInteractive' && 'Time for page to become fully interactive'}
                            {metric.key === 'loadTime' && 'Total time to load the page'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}