/**
 * MetricsService
 * Collects and reports performance, usage, and health metrics.
 */
class MetricsService {
    constructor() {
        this.metrics = {
            aiService: {
                requestCount: 0,
                errorCount: 0,
                circuitBreakerOpens: 0,
                responseTime: [],
                providerUsage: { openai: 0, gemini: 0, anthropic: 0 }
            },
            memoryService: {
                shortTermSize: 0,
                mediumTermSize: 0,
                longTermSize: 0,
                summarizationOperations: 0
            },
            contentEngine: {
                contentGenerated: 0,
                platformEngagement: { instagram: 0, twitter: 0, tiktok: 0 }
            },
            userExperience: {
                sessionDuration: [],
                featureUsage: {}
            }
        };

        this.startMetricsReporting();
    }

    incrementCounter(category, metric) {
        if (this.metrics[category] && typeof this.metrics[category][metric] === 'number') {
            this.metrics[category][metric]++;
        }
    }

    recordTiming(category, metric, value) {
        if (this.metrics[category] && Array.isArray(this.metrics[category][metric])) {
            this.metrics[category][metric].push(value);
            // Keep ring buffer of last 100
            if (this.metrics[category][metric].length > 100) {
                this.metrics[category][metric].shift();
            }
        }
    }

    recordAiRequest(provider, responseTime, success) {
        this.incrementCounter('aiService', 'requestCount');
        this.recordTiming('aiService', 'responseTime', responseTime);

        if (provider && this.metrics.aiService.providerUsage[provider] !== undefined) {
            this.metrics.aiService.providerUsage[provider]++;
        }

        if (!success) {
            this.incrementCounter('aiService', 'errorCount');
        }
    }

    recordCircuitBreakerOpen() {
        this.incrementCounter('aiService', 'circuitBreakerOpens');
    }

    startMetricsReporting() {
        // Report metrics every minute
        setInterval(() => {
            this.reportMetrics();
        }, 60000);
    }

    async reportMetrics() {
        const payload = {
            timestamp: Date.now(),
            metrics: this.metrics
        };

        console.log('[MetricsService] Reporting:', JSON.stringify(payload, null, 2));

        // Reset counters
        this.metrics.aiService.requestCount = 0;
        this.metrics.aiService.errorCount = 0;
        this.metrics.contentEngine.contentGenerated = 0;
    }
}

export const metricsService = new MetricsService();
