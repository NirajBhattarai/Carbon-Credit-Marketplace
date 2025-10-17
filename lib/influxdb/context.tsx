'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

export interface SensorData {
  deviceId: string;
  deviceType: 'SEQUESTER' | 'EMITTER';
  apiKey?: string;
  walletAddress?: string;
  co2: number;
  humidity: number;
  credits: number;
  emissions: number;
  offset: boolean;
  timestamp: number;
  location?: string;
  ip?: string;
  mac?: string;
}

export interface InfluxDBContextType {
  connectionState: 'connected' | 'disconnected' | 'connecting' | 'error';
  messages: SensorData[];
  sequesterDevices: Set<string>;
  emitterDevices: Set<string>;
  getDeviceCount: () => { sequester: number; emitter: number; total: number };
  clearMessages: () => void;
  refreshData: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const InfluxDBContext = createContext<InfluxDBContextType | undefined>(
  undefined
);

export function useInfluxDB(): InfluxDBContextType {
  const context = useContext(InfluxDBContext);
  if (!context) {
    throw new Error('useInfluxDB must be used within an InfluxDBProvider');
  }
  return context;
}

interface InfluxDBProviderProps {
  children: React.ReactNode;
}

export function InfluxDBProvider({ children }: InfluxDBProviderProps) {
  const [connectionState, setConnectionState] = useState<
    'connected' | 'disconnected' | 'connecting' | 'error'
  >('disconnected');
  const [messages, setMessages] = useState<SensorData[]>([]);
  const [sequesterDevices, setSequesterDevices] = useState<Set<string>>(
    new Set()
  );
  const [emitterDevices, setEmitterDevices] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  // Fetch data from InfluxDB API
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setConnectionState('connecting');

      const response = await fetch(
        '/api/timeseries/query?limit=100&startTime=-1h'
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Transform InfluxDB data to SensorData format
        const sensorData: SensorData[] = result.data.map((point: any) => ({
          deviceId: point.device_id || 'unknown',
          deviceType: point.device_type || 'SEQUESTER',
          apiKey: point.api_key,
          walletAddress: point.wallet_address,
          co2: point.co2 || 0,
          humidity: point.humidity || 0,
          credits: point.credits || 0,
          emissions: point.emissions || 0,
          offset: point.offset || false,
          timestamp: new Date(point._time).getTime(),
          location: point.location,
          ip: point.ip,
          mac: point.mac,
        }));

        // Update messages (keep last 100)
        setMessages(prev => {
          const combined = [...sensorData, ...prev];
          const unique = combined.filter(
            (item, index, self) =>
              index ===
              self.findIndex(
                t =>
                  t.deviceId === item.deviceId && t.timestamp === item.timestamp
              )
          );
          return unique.slice(0, 100);
        });

        // Update device sets
        const sequesterSet = new Set<string>();
        const emitterSet = new Set<string>();

        sensorData.forEach(data => {
          if (data.deviceType === 'SEQUESTER') {
            sequesterSet.add(data.deviceId);
          } else if (data.deviceType === 'EMITTER') {
            emitterSet.add(data.deviceId);
          }
        });

        setSequesterDevices(sequesterSet);
        setEmitterDevices(emitterSet);
        setConnectionState('connected');

        console.log(
          `📊 Fetched ${sensorData.length} data points from InfluxDB`
        );
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('❌ Error fetching InfluxDB data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setConnectionState('error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh data function
  const refreshData = useCallback(async () => {
    await fetchData();
    setLastRefresh(Date.now());
  }, [fetchData]);

  // Clear messages function
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Get device count
  const getDeviceCount = useCallback(() => {
    return {
      sequester: sequesterDevices.size,
      emitter: emitterDevices.size,
      total: sequesterDevices.size + emitterDevices.size,
    };
  }, [sequesterDevices, emitterDevices]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  const contextValue: InfluxDBContextType = {
    connectionState,
    messages,
    sequesterDevices,
    emitterDevices,
    getDeviceCount,
    clearMessages,
    refreshData,
    isLoading,
    error,
  };

  return (
    <InfluxDBContext.Provider value={contextValue}>
      {children}
    </InfluxDBContext.Provider>
  );
}
