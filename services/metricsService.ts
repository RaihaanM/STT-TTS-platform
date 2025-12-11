
export interface MetricEvent {
  id: string;
  timestamp: number;
  eventType: 'stt' | 'translation' | 'tts' | 'pipeline';
  latencyMs: number;
  metadata?: Record<string, any>;
}

const METRICS_KEY = 'langlink-metrics';

export const metricsService = {
  /**
   * measures the execution time of an async function
   */
  measureStageLatency: async <T>(
    stageName: MetricEvent['eventType'],
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<{ result: T; latencyMs: number }> => {
    const start = performance.now();
    try {
      const result = await fn();
      const end = performance.now();
      const latencyMs = Math.round(end - start);

      metricsService.logEvent(stageName, latencyMs, metadata);
      return { result, latencyMs };
    } catch (error) {
      // Log failure with 0 latency or specific error marker if needed
      throw error;
    }
  },

  logEvent: (eventType: MetricEvent['eventType'], latencyMs: number, metadata?: Record<string, any>) => {
    const event: MetricEvent = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      eventType,
      latencyMs,
      metadata: {
        ...metadata,
        online: navigator.onLine,
        userAgent: navigator.userAgent,
      },
    };

    try {
      const existing = JSON.parse(localStorage.getItem(METRICS_KEY) || '[]');
      // Keep last 1000 records
      const updated = [event, ...existing].slice(0, 1000);
      localStorage.setItem(METRICS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save metrics', e);
    }
  },

  getMetrics: (): MetricEvent[] => {
    try {
      return JSON.parse(localStorage.getItem(METRICS_KEY) || '[]');
    } catch {
      return [];
    }
  },

  clearMetrics: () => {
    localStorage.removeItem(METRICS_KEY);
  }
};
