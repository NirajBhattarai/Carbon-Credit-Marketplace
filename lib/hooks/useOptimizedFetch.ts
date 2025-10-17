import { useState, useEffect, useCallback, useRef } from 'react';

interface UseOptimizedFetchOptions {
  cacheTime?: number; // Cache time in milliseconds
  staleTime?: number; // Time before data is considered stale
  refetchInterval?: number; // Auto-refetch interval
  enabled?: boolean; // Whether to enable fetching
}

interface UseOptimizedFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isStale: boolean;
  lastUpdated: Date | null;
}

/**
 * Custom hook for optimized API calls with caching and debouncing
 */
export function useOptimizedFetch<T>(
  url: string,
  options: UseOptimizedFetchOptions = {}
): UseOptimizedFetchResult<T> {
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutes default cache
    staleTime = 2 * 60 * 1000, // 2 minutes default stale time
    refetchInterval,
    enabled = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(
    new Map()
  );
  const timeoutRef = useRef<NodeJS.Timeout>();
  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      if (!enabled) return;

      const cacheKey = url;
      const cached = cacheRef.current.get(cacheKey);
      const now = Date.now();

      // Check if we have valid cached data
      if (!forceRefresh && cached && now - cached.timestamp < cacheTime) {
        setData(cached.data);
        setLastUpdated(new Date(cached.timestamp));
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          setData(result.data);
          setLastUpdated(new Date());

          // Cache the result
          cacheRef.current.set(cacheKey, {
            data: result.data,
            timestamp: now,
          });
        } else {
          throw new Error(result.error || 'API request failed');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Fetch error:', errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [url, enabled, cacheTime]
  );

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  // Check if data is stale
  const isStale = lastUpdated
    ? Date.now() - lastUpdated.getTime() > staleTime
    : true;

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  // Set up auto-refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(() => {
        fetchData();
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled, fetchData]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    isStale,
    lastUpdated,
  };
}

/**
 * Hook for debounced API calls
 */
export function useDebouncedFetch<T>(
  url: string,
  dependencies: any[] = [],
  delay: number = 500
): UseOptimizedFetchResult<T> {
  const [debouncedUrl, setDebouncedUrl] = useState(url);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedUrl(url);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [url, delay, ...dependencies]);

  return useOptimizedFetch(debouncedUrl, {
    cacheTime: 3 * 60 * 1000, // 3 minutes for debounced calls
    staleTime: 1 * 60 * 1000, // 1 minute stale time
  });
}
