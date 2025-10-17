'use client';

import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

export function usePerformanceMonitoring() {
  const metricsRef = useRef<PerformanceMetrics>({});

  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') return;

    // Monitor Core Web Vitals
    if ('web-vital' in window) {
      // This would require the web-vitals library
      // import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'
      // Example implementation:
      // getCLS((metric) => {
      //   metricsRef.current.cls = metric.value
      //   logMetric('CLS', metric.value)
      // })
      // getFID((metric) => {
      //   metricsRef.current.fid = metric.value
      //   logMetric('FID', metric.value)
      // })
      // getFCP((metric) => {
      //   metricsRef.current.fcp = metric.value
      //   logMetric('FCP', metric.value)
      // })
      // getLCP((metric) => {
      //   metricsRef.current.lcp = metric.value
      //   logMetric('LCP', metric.value)
      // })
      // getTTFB((metric) => {
      //   metricsRef.current.ttfb = metric.value
      //   logMetric('TTFB', metric.value)
      // })
    }

    // Monitor page load performance
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          logMetric(
            'Page Load Time',
            navEntry.loadEventEnd - navEntry.loadEventStart
          );
        }
      }
    });

    observer.observe({ entryTypes: ['navigation'] });

    return () => {
      observer.disconnect();
    };
  }, []);

  const logMetric = (name: string, value: number) => {
    // Log to analytics service
    console.log(`Performance Metric - ${name}:`, value);

    // Example: Send to analytics service
    // analytics.track('performance_metric', {
    //   metric_name: name,
    //   metric_value: value,
    //   timestamp: Date.now(),
    //   url: window.location.href
    // })
  };

  const getMetrics = () => metricsRef.current;

  return { getMetrics, logMetric };
}

// Hook for monitoring component render performance
export function useRenderPerformance(componentName: string) {
  const renderStartRef = useRef<number>(0);
  const renderCountRef = useRef<number>(0);

  useEffect(() => {
    renderStartRef.current = performance.now();
    renderCountRef.current += 1;

    return () => {
      const renderTime = performance.now() - renderStartRef.current;

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `${componentName} render #${renderCountRef.current}:`,
          `${renderTime.toFixed(2)}ms`
        );
      }
    };
  });

  return {
    renderCount: renderCountRef.current,
  };
}

// Hook for monitoring API call performance
export function useApiPerformance() {
  const logApiCall = (endpoint: string, duration: number, status: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `API Call - ${endpoint}:`,
        `${duration.toFixed(2)}ms (${status})`
      );
    }

    // Log to analytics service
    // analytics.track('api_performance', {
    //   endpoint,
    //   duration,
    //   status,
    //   timestamp: Date.now()
    // })
  };

  return { logApiCall };
}
