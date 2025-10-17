'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import mqtt, { MqttClient } from 'mqtt'
import { writeSensorData, writeConnectionEvent, initializeInfluxDB } from '@/lib/influxdb'

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
  }
}

// Topic patterns from the IoT devices
const TOPICS = {
  CARBON_EMITTER: 'carbon_emitter/#',
  CARBON_SEQUESTER: 'carbon_sequester/#',
  EMITTER_DATA: 'carbon_emitter/+/sensor_data',
  SEQUESTER_DATA: 'carbon_sequester/+/sensor_data',
  COMMANDS: 'carbon_emitter/commands'
}

// Data interfaces
export interface SensorData {
  device_id?: string
  mac?: string
  ip?: string
  location?: string
  type?: string
  version?: string
  c: number  // CO2 reading
  h: number  // Humidity reading
  cr: number // Carbon credits
  e: number  // Emissions
  o: boolean // Offset status
  t: number  // Timestamp
  walletAddress?: string  // User's wallet address extracted from topic
  apiKey?: string  // API key extracted from topic
}

export interface MQTTMessage {
  topic: string
  payload: SensorData
  timestamp: number
  deviceType: 'SEQUESTER' | 'EMITTER'
}

export interface MQTTConnectionState {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  lastConnected: number | null
  reconnectAttempts: number
}

interface MQTTContextType {
  // Connection state
  connectionState: MQTTConnectionState
  
  // Data
  messages: MQTTMessage[]
  sequesterDevices: Map<string, SensorData>
  emitterDevices: Map<string, SensorData>
  
  // Actions
  connect: () => void
  disconnect: () => void
  subscribe: (topic: string) => void
  unsubscribe: (topic: string) => void
  publish: (topic: string, message: string) => void
  
  // Utilities
  getLatestData: (deviceId: string) => SensorData | null
  getDeviceCount: () => { sequesters: number; emitters: number }
  clearMessages: () => void
}

const MQTTContext = createContext<MQTTContextType | undefined>(undefined)

export function MQTTProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<MqttClient | null>(null)
  const [connectionState, setConnectionState] = useState<MQTTConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastConnected: null,
    reconnectAttempts: 0
  })
  
  const [messages, setMessages] = useState<MQTTMessage[]>([])
  const [sequesterDevices, setSequesterDevices] = useState<Map<string, SensorData>>(new Map())
  const [emitterDevices, setEmitterDevices] = useState<Map<string, SensorData>>(new Map())

  // Initialize InfluxDB on mount
  useEffect(() => {
    const initInfluxDB = async () => {
      const success = initializeInfluxDB()
      if (success) {
        console.log('✅ InfluxDB initialized for MQTT data storage')
      } else {
        console.warn('⚠️ InfluxDB initialization failed - MQTT data will not be stored')
      }
    }
    
    initInfluxDB()
  }, [])

  // Extract API key from topic (assuming topic format: carbon_credit/{apiKey}/sensor_data)
  const extractApiKeyFromTopic = useCallback((topic: string): string | null => {
    try {
      // Handle different topic formats:
      // carbon_credit/{apiKey}/sensor_data
      // carbon_emitter/{apiKey}/sensor_data
      // carbon_sequester/{apiKey}/sensor_data
      const parts = topic.split('/')
      
      if (parts.length >= 2) {
        const apiKey = parts[1]
        // Check if it looks like an API key (starts with cc_)
        if (apiKey && apiKey.startsWith('cc_')) {
          return apiKey
        }
      }
      
      return null
    } catch (error) {
      console.error('Error extracting API key from topic:', error)
      return null
    }
  }, [])

  // Fetch wallet address from database using API key
  const fetchWalletAddressByApiKey = useCallback(async (apiKey: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/mqtt/wallet-address?apiKey=${encodeURIComponent(apiKey)}`)
      
      if (!response.ok) {
        console.error(`Failed to fetch wallet address for API key: ${apiKey}`)
        return null
      }

      const data = await response.json()
      
      if (data.success && data.data?.walletAddress) {
        return data.data.walletAddress
      }
      
      return null
    } catch (error) {
      console.error('Error fetching wallet address:', error)
      return null
    }
  }, [])

  // Parse MQTT message payload
  const parseMessage = useCallback(async (topic: string, payload: Buffer): Promise<MQTTMessage | null> => {
    try {
      const data = JSON.parse(payload.toString()) as SensorData
      const timestamp = Date.now()
      
      // Extract API key from topic
      const apiKey = extractApiKeyFromTopic(topic)
      
      // Fetch wallet address from database using API key
      let walletAddress: string | null = null
      if (apiKey) {
        walletAddress = await fetchWalletAddressByApiKey(apiKey)
      }
      
      // Determine device type based on topic
      let deviceType: 'SEQUESTER' | 'EMITTER' = 'SEQUESTER'
      if (topic.includes('carbon_emitter')) {
        deviceType = 'EMITTER'
      } else if (topic.includes('carbon_sequester')) {
        deviceType = 'SEQUESTER'
      }
      
      // Add wallet address and API key to sensor data
      const enrichedData: SensorData = {
        ...data,
        walletAddress: walletAddress || undefined,
        apiKey: apiKey || undefined
      }
      
      return {
        topic,
        payload: enrichedData,
        timestamp,
        deviceType
      }
    } catch (error) {
      console.error('Failed to parse MQTT message:', error)
      return null
    }
  }, [extractApiKeyFromTopic, fetchWalletAddressByApiKey])

  // Handle incoming messages
  const handleMessage = useCallback(async (topic: string, payload: Buffer) => {
    const message = await parseMessage(topic, payload)
    if (!message) return

    // Add to messages list (keep last 100 messages)
    setMessages(prev => {
      const newMessages = [message, ...prev].slice(0, 100)
      return newMessages
    })

    // Save sensor data to InfluxDB with wallet address as key
    try {
      const sensorData = {
        deviceId: message.payload.device_id || topic.split('/')[1] || 'unknown',
        deviceType: message.deviceType,
        apiKey: message.payload.apiKey,
        walletAddress: message.payload.walletAddress,
        co2: message.payload.c,
        humidity: message.payload.h,
        credits: message.payload.cr,
        emissions: message.payload.e,
        offset: message.payload.o,
        timestamp: message.timestamp,
        location: message.payload.location,
        ip: message.payload.ip,
        mac: message.payload.mac,
      }

      console.log(`📊 Saving MQTT data to InfluxDB:`, {
        deviceId: sensorData.deviceId,
        deviceType: sensorData.deviceType,
        walletAddress: sensorData.walletAddress ? `${sensorData.walletAddress.slice(0, 6)}...${sensorData.walletAddress.slice(-4)}` : 'unknown',
        apiKey: sensorData.apiKey ? `${sensorData.apiKey.slice(0, 6)}...` : 'unknown',
        co2: sensorData.co2,
        credits: sensorData.credits
      })

      const success = await writeSensorData(sensorData)
      
      if (success) {
        console.log(`✅ Successfully saved MQTT data to InfluxDB for wallet: ${sensorData.walletAddress ? sensorData.walletAddress.slice(0, 6) + '...' + sensorData.walletAddress.slice(-4) : 'unknown'}`)
      } else {
        console.warn(`⚠️ Failed to save MQTT data to InfluxDB for wallet: ${sensorData.walletAddress ? sensorData.walletAddress.slice(0, 6) + '...' + sensorData.walletAddress.slice(-4) : 'unknown'}`)
      }
    } catch (error) {
      console.error('❌ Failed to save sensor data to InfluxDB:', error)
      console.error('Error details:', {
        topic,
        deviceType: message.deviceType,
        walletAddress: message.payload.walletAddress,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Update device data maps
    // Use wallet address as device ID if available, otherwise fallback to API key or device_id
    const deviceId = message.payload.walletAddress || message.payload.apiKey || message.payload.device_id || topic.split('/')[1] || 'unknown'
    
    if (message.deviceType === 'SEQUESTER') {
      setSequesterDevices(prev => {
        const newMap = new Map(prev)
        newMap.set(deviceId, message.payload)
        return newMap
      })
    } else {
      setEmitterDevices(prev => {
        const newMap = new Map(prev)
        newMap.set(deviceId, message.payload)
        return newMap
      })
    }
  }, [parseMessage])

  // Connect to MQTT broker
  const connect = useCallback(() => {
    if (client?.connected) return

    setConnectionState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      const mqttClient = mqtt.connect(MQTT_CONFIG.broker, MQTT_CONFIG.options)

      mqttClient.on('connect', () => {
        console.log('✅ MQTT Connected')
        setConnectionState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
          lastConnected: Date.now(),
          reconnectAttempts: 0
        }))
        setClient(mqttClient)
      })

      mqttClient.on('message', handleMessage)

      mqttClient.on('error', (error) => {
        console.error('❌ MQTT Error:', error)
        setConnectionState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: error.message
        }))
      })

      mqttClient.on('close', () => {
        console.log('🔌 MQTT Connection closed')
        setConnectionState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false
        }))
      })

      mqttClient.on('reconnect', () => {
        console.log('🔄 MQTT Reconnecting...')
        setConnectionState(prev => ({
          ...prev,
          reconnectAttempts: prev.reconnectAttempts + 1
        }))
      })

      mqttClient.on('offline', () => {
        console.log('📴 MQTT Offline')
        setConnectionState(prev => ({
          ...prev,
          isConnected: false
        }))
      })

    } catch (error) {
      console.error('❌ Failed to create MQTT client:', error)
      setConnectionState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }, [client, handleMessage])

  // Disconnect from MQTT broker
  const disconnect = useCallback(() => {
    if (client) {
      client.end()
      setClient(null)
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false
      }))
    }
  }, [client])

  // Subscribe to topic
  const subscribe = useCallback((topic: string) => {
    if (client?.connected) {
      client.subscribe(topic, (error) => {
        if (error) {
          console.error(`❌ Failed to subscribe to ${topic}:`, error)
        } else {
          console.log(`✅ Subscribed to ${topic}`)
        }
      })
    }
  }, [client])

  // Unsubscribe from topic
  const unsubscribe = useCallback((topic: string) => {
    if (client?.connected) {
      client.unsubscribe(topic, (error) => {
        if (error) {
          console.error(`❌ Failed to unsubscribe from ${topic}:`, error)
        } else {
          console.log(`✅ Unsubscribed from ${topic}`)
        }
      })
    }
  }, [client])

  // Publish message
  const publish = useCallback((topic: string, message: string) => {
    if (client?.connected) {
      client.publish(topic, message, (error) => {
        if (error) {
          console.error(`❌ Failed to publish to ${topic}:`, error)
        } else {
          console.log(`✅ Published to ${topic}`)
        }
      })
    }
  }, [client])

  // Get latest data for a device
  const getLatestData = useCallback((deviceId: string): SensorData | null => {
    return sequesterDevices.get(deviceId) || emitterDevices.get(deviceId) || null
  }, [sequesterDevices, emitterDevices])

  // Get device counts
  const getDeviceCount = useCallback(() => {
    return {
      sequesters: sequesterDevices.size,
      emitters: emitterDevices.size
    }
  }, [sequesterDevices, emitterDevices])

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Auto-subscribe to main topics when connected
  useEffect(() => {
    if (client?.connected) {
      // Subscribe to carbon emitter and sequester topics
      subscribe(TOPICS.CARBON_EMITTER)
      subscribe(TOPICS.CARBON_SEQUESTER)
    }
  }, [client?.connected, subscribe])

  const contextValue: MQTTContextType = {
    connectionState,
    messages,
    sequesterDevices,
    emitterDevices,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    publish,
    getLatestData,
    getDeviceCount,
    clearMessages
  }

  return (
    <MQTTContext.Provider value={contextValue}>
      {children}
    </MQTTContext.Provider>
  )
}

export function useMQTT() {
  const context = useContext(MQTTContext)
  if (context === undefined) {
    throw new Error('useMQTT must be used within a MQTTProvider')
  }
  return context
}

// Export topics for use in components
export { TOPICS }
