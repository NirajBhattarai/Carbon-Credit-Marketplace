'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import mqtt, { MqttClient } from 'mqtt';
import {
  writeSensorData,
  writeConnectionEvent,
  writeHeartbeatData,
  writeAlertData,
  initializeInfluxDB,
} from '@/lib/influxdb';

// MQTT Configuration
const MQTT_CONFIG = {
  broker: process.env.NEXT_PUBLIC_MQTT_BROKER || 'ws://localhost:9001',
  options: {
    clientId: `carbon_credit_frontend_${Math.random().toString(16).substr(2, 8)}`,
    username: process.env.NEXT_PUBLIC_MQTT_USERNAME || '',
    password: process.env.NEXT_PUBLIC_MQTT_PASSWORD || '',
    clean: true,
    reconnectPeriod: 5000,
    connectTimeout: 30 * 1000,
  },
};

// Topic patterns from the IoT devices
const TOPICS = {
  CARBON_SEQUESTER: 'carbon_sequester/#',
  SEQUESTER_DATA: 'carbon_sequester/+/sensor_data',
  // New pattern for API key based topics
  API_KEY_TOPICS: 'carbon_credit/+/#', // Subscribe to all topics under carbon_credit/{apiKey}/#
};

// Data interfaces
export interface SensorData {
  device_id?: string;
  mac?: string;
  ip?: string;
  location?: string;
  type?: string;
  device_type?: 'SEQUESTER';
  version?: string;
  // New format with avg/max/min values
  avg_c?: number; // Average CO2 reading
  max_c?: number; // Maximum CO2 reading
  min_c?: number; // Minimum CO2 reading
  avg_h?: number; // Average humidity reading
  max_h?: number; // Maximum humidity reading
  min_h?: number; // Minimum humidity reading
  samples?: number; // Number of samples
  // Legacy format (for backward compatibility)
  c?: number; // CO2 reading (legacy)
  h?: number; // Humidity reading (legacy)
  // Common fields
  cr: number; // Carbon credits
  e: number; // Emissions
  o: boolean; // Offset status
  t: number; // Timestamp
  credits_avail?: number; // Available credits
  // Heartbeat fields
  status?: string; // Device status
  uptime?: number; // Device uptime
  rssi?: number; // Signal strength
  // Alert fields
  alert_type?: string; // Type of alert
  message?: string; // Alert message
  co2?: number; // CO2 level at alert time
  credits?: number; // Credits at alert time
  walletAddress?: string; // User's wallet address extracted from topic
  apiKey?: string; // API key extracted from topic
}

export interface MQTTMessage {
  topic: string;
  payload: SensorData;
  timestamp: number;
  deviceType: 'SEQUESTER';
}

export interface MQTTConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastConnected: number | null;
  reconnectAttempts: number;
}

interface MQTTContextType {
  // Connection state
  connectionState: MQTTConnectionState;

  // Data
  messages: MQTTMessage[];
  sequesterDevices: Map<string, SensorData>;

  // Actions
  connect: () => void;
  disconnect: () => void;
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;
  publish: (topic: string, message: string) => void;

  // Utilities
  getLatestData: (deviceId: string) => SensorData | null;
  getDeviceCount: () => { sequesters: number };
  clearMessages: () => void;
}

const MQTTContext = createContext<MQTTContextType | undefined>(undefined);

export function MQTTProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<MqttClient | null>(null);
  const [connectionState, setConnectionState] = useState<MQTTConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastConnected: null,
    reconnectAttempts: 0,
  });

  const [messages, setMessages] = useState<MQTTMessage[]>([]);
  const [sequesterDevices, setSequesterDevices] = useState<
    Map<string, SensorData>
  >(new Map());

  // Initialize InfluxDB on mount
  useEffect(() => {
    const initInfluxDB = async () => {
      const success = initializeInfluxDB();
      if (success) {
        console.log('✅ InfluxDB initialized for MQTT data storage');
      } else {
        console.warn(
          '⚠️ InfluxDB initialization failed - MQTT data will not be stored'
        );
      }
    };

    initInfluxDB();
  }, []);

  // Extract API key from topic (handles both old and new formats)
  const extractApiKeyFromTopic = useCallback((topic: string): string | null => {
    try {
      console.log('🔍 Extracting API key from topic:', topic);

      // New format: carbon_credit/{apiKey}/sensor_data or carbon_credit/{apiKey}/#
      if (topic.startsWith('carbon_credit/')) {
        const parts = topic.split('/');
        console.log('📝 Topic parts:', parts);

        if (parts.length >= 2) {
          const apiKey = parts[1];
          console.log('🔑 Potential API key from path:', apiKey);

          // Check if it looks like an API key (starts with cc_)
          if (apiKey && apiKey.startsWith('cc_')) {
            console.log('✅ Valid API key found in path:', apiKey);
            return apiKey;
          } else {
            console.log('❌ API key does not start with cc_:', apiKey);
          }
        }
      }

      // Legacy format: topic is directly the API key (e.g., cc_c98d3c07dfad46e3259a2ad23724cd37b23acfb0195ba6ac10cfb71c3afd753f)
      if (topic.startsWith('cc_')) {
        console.log('✅ API key found as direct topic:', topic);
        return topic;
      }

      // Legacy format: carbon_emitter/{apiKey}/sensor_data or carbon_sequester/{apiKey}/sensor_data
      const parts = topic.split('/');
      console.log('📝 Topic parts:', parts);

      if (parts.length >= 2) {
        const apiKey = parts[1];
        console.log('🔑 Potential API key from path:', apiKey);

        // Check if it looks like an API key (starts with cc_)
        if (apiKey && apiKey.startsWith('cc_')) {
          console.log('✅ Valid API key found in path:', apiKey);
          return apiKey;
        } else {
          console.log('❌ API key does not start with cc_:', apiKey);
        }
      }

      console.log('❌ No valid API key found in topic');
      return null;
    } catch (error) {
      console.error('Error extracting API key from topic:', error);
      return null;
    }
  }, []);

  // Fetch wallet address from database using API key
  const fetchWalletAddressByApiKey = useCallback(
    async (apiKey: string): Promise<string | null> => {
      try {
        console.log('🔍 Fetching wallet address for API key:', apiKey);

        const response = await fetch(
          `/api/mqtt/wallet-address?apiKey=${encodeURIComponent(apiKey)}`
        );

        console.log('📡 API response status:', response.status);

        if (!response.ok) {
          console.error(
            `❌ Failed to fetch wallet address for API key: ${apiKey}, status: ${response.status}`
          );
          return null;
        }

        const data = await response.json();
        console.log('📊 API response data:', data);

        if (data.success && data.data?.walletAddress) {
          console.log('✅ Wallet address found:', data.data.walletAddress);
          return data.data.walletAddress;
        }

        console.log('❌ No wallet address found in response');
        return null;
      } catch (error) {
        console.error('❌ Error fetching wallet address:', error);
        return null;
      }
    },
    []
  );

  // Track which API keys we've already attempted to create devices for
  const attemptedDeviceCreation = useRef<Set<string>>(new Set());

  // Auto-create IoT device when MQTT data is received
  const autoCreateIoTDevice = useCallback(
    async (
      deviceData: SensorData,
      walletAddress: string,
      apiKey: string
    ): Promise<void> => {
      try {
        // Check if we've already attempted to create a device for this API key
        if (attemptedDeviceCreation.current.has(apiKey)) {
          console.log(
            'ℹ️ Device creation already attempted for API key:',
            apiKey
          );
          return;
        }

        console.log('🔧 Auto-creating IoT device for wallet:', walletAddress);

        // Mark this API key as attempted
        attemptedDeviceCreation.current.add(apiKey);

        // Use MAC address as device ID, fallback to device_id, then generate unique ID
        const deviceId =
          deviceData.mac ||
          deviceData.device_id ||
          `${apiKey}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log(
          `🔧 Using device ID: ${deviceId} (MAC: ${deviceData.mac}, device_id: ${deviceData.device_id})`
        );

        const devicePayload = {
          deviceId: deviceId,
          deviceType:
            deviceData.device_type ||
            (deviceData.type === 'sequester' ? 'SEQUESTER' : 'SEQUESTER'),
          location: deviceData.location || 'Unknown Location',
          projectName: `Auto-created Device ${new Date().toISOString().split('T')[0]}`,
          description: `Device auto-created from MQTT data on ${new Date().toISOString()}`,
        };

        const response = await fetch('/api/iot/auto-create-device', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...devicePayload,
            apiKey: apiKey,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(
            '✅ IoT device auto-created successfully:',
            result.device?.id
          );
        } else {
          console.log(
            'ℹ️ Device might already exist or creation failed:',
            response.status
          );
          // Remove from attempted set if creation failed, so we can retry later
          attemptedDeviceCreation.current.delete(apiKey);
        }
      } catch (error) {
        console.error('❌ Error auto-creating IoT device:', error);
        // Remove from attempted set if creation failed, so we can retry later
        attemptedDeviceCreation.current.delete(apiKey);
      }
    },
    []
  );

  // Parse MQTT message payload
  const parseMessage = useCallback(
    async (topic: string, payload: Buffer): Promise<MQTTMessage | null> => {
      try {
        const data = JSON.parse(payload.toString()) as SensorData;
        const timestamp = Date.now();

        // Extract API key from topic
        const apiKey = extractApiKeyFromTopic(topic);

        // Fetch wallet address from database using API key
        let walletAddress: string | null = null;
        if (apiKey) {
          walletAddress = await fetchWalletAddressByApiKey(apiKey);

          // Auto-create IoT device if wallet address is found
          if (walletAddress) {
            await autoCreateIoTDevice(data, walletAddress, apiKey);
          }
        }

        // Determine device type based on topic or payload
        let deviceType: 'SEQUESTER' = 'SEQUESTER';

        // For new format (API key as topic), determine type from payload or default to SEQUESTER
        if (topic.startsWith('cc_')) {
          // Check payload for device type hints
          // All devices are now sequester devices
          deviceType = 'SEQUESTER';
        } else {
          // Old format: all devices are now sequester devices
          deviceType = 'SEQUESTER';
        }

        // Add wallet address and API key to sensor data
        const enrichedData: SensorData = {
          ...data,
          walletAddress: walletAddress || undefined,
          apiKey: apiKey || undefined,
        };

        return {
          topic,
          payload: enrichedData,
          timestamp,
          deviceType,
        };
      } catch (error) {
        console.error('Failed to parse MQTT message:', error);
        return null;
      }
    },
    [extractApiKeyFromTopic, fetchWalletAddressByApiKey, autoCreateIoTDevice]
  );

  // Handle incoming messages
  const handleMessage = useCallback(
    async (topic: string, payload: Buffer) => {
      const message = await parseMessage(topic, payload);
      if (!message) return;

      // Add to messages list (keep last 100 messages)
      setMessages(prev => {
        const newMessages = [message, ...prev].slice(0, 100);
        return newMessages;
      });

      // Route message to appropriate InfluxDB function based on message type
      try {
        const deviceId =
          message.payload.mac ||
          message.payload.device_id ||
          topic.split('/')[1] ||
          'unknown';
        const deviceType = message.deviceType;
        const apiKey = message.payload.apiKey;
        const walletAddress = message.payload.walletAddress;
        const timestamp = message.timestamp;
        const ip = message.payload.ip;
        const mac = message.payload.mac;

        // Determine message type based on payload structure
        if (message.payload.type === 'heartbeat' || message.payload.status) {
          // Handle heartbeat data
          const heartbeatData = {
            deviceId,
            deviceType,
            apiKey,
            walletAddress,
            status: message.payload.status || 'unknown',
            uptime:
              typeof message.payload.uptime === 'number'
                ? message.payload.uptime
                : 0,
            rssi:
              typeof message.payload.rssi === 'number'
                ? message.payload.rssi
                : 0,
            timestamp,
            ip,
            mac,
          };

          console.log(`💓 Saving heartbeat data to InfluxDB:`, {
            deviceId: heartbeatData.deviceId,
            status: heartbeatData.status,
            uptime: heartbeatData.uptime,
          });

          const success = await writeHeartbeatData(heartbeatData);
        } else if (
          message.payload.type === 'alert' ||
          message.payload.alert_type
        ) {
          // Handle alert data
          const alertData = {
            deviceId,
            deviceType,
            apiKey,
            walletAddress,
            alertType: message.payload.alert_type || 'unknown',
            message: message.payload.message || 'No message',
            co2:
              typeof message.payload.co2 === 'number' ? message.payload.co2 : 0,
            credits:
              typeof message.payload.credits === 'number'
                ? message.payload.credits
                : 0,
            timestamp,
            ip,
            mac,
          };

          console.log(`🚨 Saving alert data to InfluxDB:`, {
            deviceId: alertData.deviceId,
            alertType: alertData.alertType,
            co2: alertData.co2,
          });

          const success = await writeAlertData(alertData);
        } else {
          // Handle sensor data (default case)
          // Validate and provide default values for required fields
          // Handle both new format (avg_c, max_c, min_c) and legacy format (c, h)
          const co2Value =
            typeof message.payload.avg_c === 'number'
              ? message.payload.avg_c
              : typeof message.payload.c === 'number'
                ? message.payload.c
                : 0;
          const humidityValue =
            typeof message.payload.avg_h === 'number'
              ? message.payload.avg_h
              : typeof message.payload.h === 'number'
                ? message.payload.h
                : 0;

          const sensorData = {
            deviceId,
            deviceType,
            apiKey,
            walletAddress,
            co2: co2Value,
            humidity: humidityValue,
            credits:
              typeof message.payload.cr === 'number' ? message.payload.cr : 0,
            emissions:
              typeof message.payload.e === 'number' ? message.payload.e : 0,
            offset:
              typeof message.payload.o === 'boolean'
                ? message.payload.o
                : false,
            timestamp,
            location: message.payload.location,
            ip,
            mac,
            // Additional fields for new format
            avgCo2:
              typeof message.payload.avg_c === 'number'
                ? message.payload.avg_c
                : undefined,
            maxCo2:
              typeof message.payload.max_c === 'number'
                ? message.payload.max_c
                : undefined,
            minCo2:
              typeof message.payload.min_c === 'number'
                ? message.payload.min_c
                : undefined,
            avgHumidity:
              typeof message.payload.avg_h === 'number'
                ? message.payload.avg_h
                : undefined,
            maxHumidity:
              typeof message.payload.max_h === 'number'
                ? message.payload.max_h
                : undefined,
            minHumidity:
              typeof message.payload.min_h === 'number'
                ? message.payload.min_h
                : undefined,
            samples:
              typeof message.payload.samples === 'number'
                ? message.payload.samples
                : undefined,
            creditsAvailable:
              typeof message.payload.credits_avail === 'number'
                ? message.payload.credits_avail
                : undefined,
          };

          console.log(`📊 Saving sensor data to InfluxDB:`, {
            deviceId: sensorData.deviceId,
            deviceType: sensorData.deviceType,
            walletAddress: sensorData.walletAddress
              ? `${sensorData.walletAddress.slice(0, 6)}...${sensorData.walletAddress.slice(-4)}`
              : 'unknown',
            apiKey: sensorData.apiKey
              ? `${sensorData.apiKey.slice(0, 6)}...`
              : 'unknown',
            co2: sensorData.co2,
            credits: sensorData.credits,
          });

          const success = await writeSensorData(sensorData);
        }
      } catch (error) {
        console.error('❌ Failed to save sensor data to InfluxDB:', error);
        console.error('Error details:', {
          topic,
          deviceType: message.deviceType,
          walletAddress: message.payload.walletAddress,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Update device data maps
      // Use MAC address as device ID if available, otherwise fallback to device_id, API key, or topic
      const deviceId =
        message.payload.mac ||
        message.payload.device_id ||
        message.payload.apiKey ||
        topic.split('/')[1] ||
        'unknown';

      // All devices are now sequester devices
      setSequesterDevices(prev => {
        const newMap = new Map(prev);
        newMap.set(deviceId, message.payload);
        return newMap;
      });
    },
    [parseMessage]
  );

  // Connect to MQTT broker
  const connect = useCallback(() => {
    if (client?.connected) return;

    setConnectionState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const mqttClient = mqtt.connect(MQTT_CONFIG.broker, MQTT_CONFIG.options);

      mqttClient.on('connect', () => {
        console.log('✅ MQTT Connected');
        setConnectionState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
          lastConnected: Date.now(),
          reconnectAttempts: 0,
        }));
        setClient(mqttClient);
      });

      mqttClient.on('message', handleMessage);

      mqttClient.on('error', error => {
        console.error('❌ MQTT Error:', error);
        setConnectionState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: error.message,
        }));
      });

      mqttClient.on('close', () => {
        console.log('🔌 MQTT Connection closed');
        setConnectionState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
        }));
      });

      mqttClient.on('reconnect', () => {
        console.log('🔄 MQTT Reconnecting...');
        setConnectionState(prev => ({
          ...prev,
          reconnectAttempts: prev.reconnectAttempts + 1,
        }));
      });

      mqttClient.on('offline', () => {
        console.log('📴 MQTT Offline');
        setConnectionState(prev => ({
          ...prev,
          isConnected: false,
        }));
      });
    } catch (error) {
      console.error('❌ Failed to create MQTT client:', error);
      setConnectionState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [client, handleMessage]);

  // Disconnect from MQTT broker
  const disconnect = useCallback(() => {
    if (client) {
      client.end();
      setClient(null);
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
      }));
    }
  }, [client]);

  // Subscribe to topic
  const subscribe = useCallback(
    (topic: string) => {
      if (client?.connected) {
        client.subscribe(topic, error => {
          if (error) {
            console.error(`❌ Failed to subscribe to ${topic}:`, error);
          } else {
            console.log(`✅ Subscribed to ${topic}`);
          }
        });
      }
    },
    [client]
  );

  // Unsubscribe from topic
  const unsubscribe = useCallback(
    (topic: string) => {
      if (client?.connected) {
        client.unsubscribe(topic, error => {
          if (error) {
            console.error(`❌ Failed to unsubscribe from ${topic}:`, error);
          } else {
            console.log(`✅ Unsubscribed from ${topic}`);
          }
        });
      }
    },
    [client]
  );

  // Publish message
  const publish = useCallback(
    (topic: string, message: string) => {
      if (client?.connected) {
        client.publish(topic, message, error => {
          if (error) {
            console.error(`❌ Failed to publish to ${topic}:`, error);
          } else {
            console.log(`✅ Published to ${topic}`);
          }
        });
      }
    },
    [client]
  );

  // Get latest data for a device
  const getLatestData = useCallback(
    (deviceId: string): SensorData | null => {
      return (
        sequesterDevices.get(deviceId) || null
      );
    },
    [sequesterDevices]
  );

  // Get device counts
  const getDeviceCount = useCallback(() => {
    return {
      sequesters: sequesterDevices.size,
    };
  }, [sequesterDevices]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Auto-subscribe to main topics when connected
  useEffect(() => {
    if (client?.connected) {
      // Subscribe to carbon sequester topics (old format)
      subscribe(TOPICS.CARBON_SEQUESTER);

      // Subscribe to API key based topics (new format)
      subscribe(TOPICS.API_KEY_TOPICS);

      console.log('📡 Subscribed to MQTT topics:', {
        carbonSequester: TOPICS.CARBON_SEQUESTER,
        apiKeyTopics: TOPICS.API_KEY_TOPICS,
      });
    }
  }, [client?.connected, subscribe]);

  const contextValue: MQTTContextType = {
    connectionState,
    messages,
      sequesterDevices,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    publish,
    getLatestData,
    getDeviceCount,
    clearMessages,
  };

  return (
    <MQTTContext.Provider value={contextValue}>{children}</MQTTContext.Provider>
  );
}

export function useMQTT() {
  const context = useContext(MQTTContext);
  if (context === undefined) {
    throw new Error('useMQTT must be used within a MQTTProvider');
  }
  return context;
}

// Export topics for use in components
export { TOPICS };
