'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Debounce utility function
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export interface InfluxDBQueryParams {
  deviceId?: string;
  deviceType?: 'SEQUESTER' | 'EMITTER';
  walletAddress?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
  measurement?: string;
}

export interface InfluxDBDataPoint {
  _time: string;
  _measurement: string;
  _field: string;
  _value: number | string | boolean;
  device_id?: string;
  device_type?: string;
  wallet_address?: string;
  api_key?: string;
  location?: string;
  ip?: string;
  mac?: string;
  co2?: number;
  humidity?: number;
  credits?: number;
  emissions?: number;
  offset?: boolean;
}

export interface InfluxDBStats {
  totalPoints: number;
  deviceCount: number;
  avgCO2: number;
  avgHumidity: number;
  totalCredits: number;
  totalEmissions: number;
  timeRange: {
    start: string;
    end: string;
  };
}

/**
 * Custom hook for fetching InfluxDB IoT data
 */
export function useInfluxDBQuery(params: InfluxDBQueryParams = {}) {
  const [data, setData] = useState<InfluxDBDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize query parameters to prevent unnecessary re-renders
  const memoizedParams = useMemo(
    () => params,
    [
      params.deviceId,
      params.deviceType,
      params.walletAddress,
      params.startTime,
      params.endTime,
      params.limit,
      params.measurement,
    ]
  );

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (memoizedParams.deviceId)
        queryParams.append('deviceId', memoizedParams.deviceId);
      if (memoizedParams.deviceType)
        queryParams.append('deviceType', memoizedParams.deviceType);
      if (memoizedParams.walletAddress)
        queryParams.append('walletAddress', memoizedParams.walletAddress);
      if (memoizedParams.startTime)
        queryParams.append('startTime', memoizedParams.startTime);
      if (memoizedParams.endTime)
        queryParams.append('endTime', memoizedParams.endTime);
      if (memoizedParams.limit)
        queryParams.append('limit', memoizedParams.limit.toString());
      if (memoizedParams.measurement)
        queryParams.append('measurement', memoizedParams.measurement);

      const response = await fetch(
        `/api/iot/data?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching InfluxDB data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchData();
  }, [
    params.deviceId,
    params.deviceType,
    params.walletAddress,
    params.startTime,
    params.endTime,
    params.limit,
    params.measurement,
  ]);

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * Custom hook for fetching InfluxDB statistics
 */
export function useInfluxDBStats(params: InfluxDBQueryParams = {}) {
  const [stats, setStats] = useState<InfluxDBStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize query parameters to prevent unnecessary re-renders
  const memoizedParams = useMemo(
    () => params,
    [
      params.deviceId,
      params.deviceType,
      params.walletAddress,
      params.startTime,
      params.endTime,
    ]
  );

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (memoizedParams.deviceId)
        queryParams.append('deviceId', memoizedParams.deviceId);
      if (memoizedParams.deviceType)
        queryParams.append('deviceType', memoizedParams.deviceType);
      if (memoizedParams.walletAddress)
        queryParams.append('walletAddress', memoizedParams.walletAddress);
      if (memoizedParams.startTime)
        queryParams.append('startTime', memoizedParams.startTime);
      if (memoizedParams.endTime)
        queryParams.append('endTime', memoizedParams.endTime);

      const response = await fetch(
        `/api/iot/data?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.stats) {
        setStats(result.stats);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching InfluxDB stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchStats();
  }, [
    params.deviceId,
    params.deviceType,
    params.walletAddress,
    params.startTime,
    params.endTime,
  ]);

  return { stats, isLoading, error, refetch: fetchStats };
}

/**
 * Custom hook for real-time InfluxDB data updates
 */
export function useInfluxDBRealtime(
  params: InfluxDBQueryParams = {},
  intervalMs: number = 30000
) {
  const [data, setData] = useState<InfluxDBDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Memoize query parameters to prevent unnecessary re-renders
  const memoizedParams = useMemo(
    () => params,
    [
      params.deviceId,
      params.deviceType,
      params.walletAddress,
      params.startTime,
      params.endTime,
      params.limit,
      params.measurement,
    ]
  );

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (memoizedParams.deviceId)
        queryParams.append('deviceId', memoizedParams.deviceId);
      if (memoizedParams.deviceType)
        queryParams.append('deviceType', memoizedParams.deviceType);
      if (memoizedParams.walletAddress)
        queryParams.append('walletAddress', memoizedParams.walletAddress);
      if (memoizedParams.startTime)
        queryParams.append('startTime', memoizedParams.startTime || '-1h');
      if (memoizedParams.endTime)
        queryParams.append('endTime', memoizedParams.endTime || 'now()');
      if (memoizedParams.limit)
        queryParams.append('limit', memoizedParams.limit.toString());
      if (memoizedParams.measurement)
        queryParams.append('measurement', memoizedParams.measurement);

      const response = await fetch(
        `/api/iot/data?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
        setIsConnected(true);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching InfluxDB data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up interval for real-time updates
    const interval = setInterval(fetchData, intervalMs);

    return () => clearInterval(interval);
  }, [
    memoizedParams.deviceId,
    memoizedParams.deviceType,
    memoizedParams.walletAddress,
    memoizedParams.startTime,
    memoizedParams.endTime,
    memoizedParams.limit,
    memoizedParams.measurement,
    intervalMs,
  ]);

  return { data, isLoading, error, isConnected, refetch: fetchData };
}

/**
 * Custom hook for device-specific InfluxDB data
 */
export function useDeviceData(deviceId: string, timeRange: string = '-24h') {
  return useInfluxDBQuery({
    deviceId,
    startTime: timeRange,
    limit: 1000,
  });
}

/**
 * Custom hook for wallet-specific InfluxDB data
 */
export function useWalletData(
  walletAddress: string,
  timeRange: string = '-24h'
) {
  return useInfluxDBQuery({
    walletAddress,
    startTime: timeRange,
    limit: 1000,
  });
}

/**
 * Custom hook for device type filtering
 */
export function useDeviceTypeData(
  deviceType: 'SEQUESTER' | 'EMITTER',
  timeRange: string = '-24h'
) {
  return useInfluxDBQuery({
    deviceType,
    startTime: timeRange,
    limit: 1000,
  });
}
