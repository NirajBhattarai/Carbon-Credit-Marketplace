'use client'

import React, { useState, useEffect } from 'react'
import { useMQTT, SensorData } from '@/lib/mqtt/context'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface RealTimeDashboardProps {
  className?: string
}

export function RealTimeDashboard({ className }: RealTimeDashboardProps) {
  const { 
    connectionState, 
    messages, 
    sequesterDevices, 
    emitterDevices, 
    getDeviceCount,
    clearMessages 
  } = useMQTT()
  
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const deviceCount = getDeviceCount()

  // Format timestamp for display
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  // Get device type color
  const getDeviceTypeColor = (deviceType: 'SEQUESTER' | 'EMITTER') => {
    return deviceType === 'SEQUESTER' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
  }

  // Get CO2 level color based on value
  const getCO2LevelColor = (co2: number) => {
    if (co2 < 400) return 'text-green-600'
    if (co2 < 800) return 'text-yellow-600'
    if (co2 < 1200) return 'text-orange-600'
    return 'text-red-600'
  }

  // Get CO2 level description
  const getCO2LevelDescription = (co2: number) => {
    if (co2 < 400) return 'Excellent'
    if (co2 < 800) return 'Good'
    if (co2 < 1200) return 'Moderate'
    return 'Poor'
  }

  // Render device data card
  const renderDeviceCard = (deviceId: string, data: SensorData, deviceType: 'SEQUESTER' | 'EMITTER') => {
    const isSelected = selectedDevice === deviceId
    
    return (
      <Card 
        key={deviceId}
        className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
        }`}
        onClick={() => setSelectedDevice(isSelected ? null : deviceId)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`p-1 rounded ${deviceType === 'SEQUESTER' ? 'bg-green-100' : 'bg-orange-100'}`}>
              {deviceType === 'SEQUESTER' ? (
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{deviceId}</h3>
              {data.walletAddress && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="font-mono text-xs">{data.walletAddress.slice(0, 4)}...{data.walletAddress.slice(-3)}</span>
                </div>
              )}
              {data.apiKey && (
                <div className="flex items-center space-x-1 text-xs text-blue-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <span className="font-mono text-xs">{data.apiKey.slice(0, 6)}...</span>
                </div>
              )}
            </div>
          </div>
          <Badge className={getDeviceTypeColor(deviceType)}>
            {deviceType}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="flex items-center space-x-1 mb-1">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-sm text-gray-600">CO₂</span>
            </div>
            <div className={`text-lg font-semibold ${getCO2LevelColor(data.c)}`}>
              {data.c} ppm
            </div>
            <div className="text-xs text-gray-500">
              {getCO2LevelDescription(data.c)}
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-1 mb-1">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              <span className="text-sm text-gray-600">Humidity</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {data.h}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center space-x-1 mb-1">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span className="text-sm text-gray-600">Credits</span>
            </div>
            <div className="text-lg font-semibold text-green-600">
              {data.cr.toFixed(1)}
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-1 mb-1">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
              <span className="text-sm text-gray-600">Emissions</span>
            </div>
            <div className="text-lg font-semibold text-orange-600">
              {data.e.toFixed(1)}
            </div>
          </div>
        </div>

        {data.location && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{data.location}</span>
            </div>
          </div>
        )}
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Real-Time IoT Data</h2>
          <p className="text-gray-600">Live sensor data from carbon credit devices</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'primary' : 'outline'}
            size="sm"
          >
            {autoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}
          </Button>
          
          <Button
            onClick={clearMessages}
            variant="outline"
            size="sm"
          >
            Clear Messages
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              connectionState.isConnected ? 'bg-green-500' : 
              connectionState.isConnecting ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <div>
              <h3 className="font-semibold text-gray-900">
                MQTT Connection Status
              </h3>
              <p className="text-sm text-gray-600">
                {connectionState.isConnected ? 'Connected' : 
                 connectionState.isConnecting ? 'Connecting...' : 'Disconnected'}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-600">
              Devices: {deviceCount.sequesters} Sequesters, {deviceCount.emitters} Emitters
            </div>
            <div className="text-sm text-gray-600">
              Messages: {messages.length}
            </div>
            <div className="text-sm text-gray-600">
              Active Wallets: {Array.from(new Set([...Array.from(sequesterDevices.values()), ...Array.from(emitterDevices.values())].map(d => d.walletAddress).filter(Boolean))).length}
            </div>
          </div>
        </div>
        
        {connectionState.error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {connectionState.error}
            </p>
          </div>
        )}
      </Card>

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sequester Devices */}
        {Array.from(sequesterDevices.entries()).map(([deviceId, data]) => 
          renderDeviceCard(deviceId, data, 'SEQUESTER')
        )}
        
        {/* Emitter Devices */}
        {Array.from(emitterDevices.entries()).map(([deviceId, data]) => 
          renderDeviceCard(deviceId, data, 'EMITTER')
        )}
        
        {/* No devices message */}
        {deviceCount.sequesters === 0 && deviceCount.emitters === 0 && (
          <div className="col-span-full">
            <Card className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Devices Connected</h3>
              <p className="text-gray-600 mb-4">
                Start your IoT devices to see real-time sensor data here.
              </p>
              <div className="text-sm text-gray-500">
                <p>Make sure your devices are:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Connected to WiFi</li>
                  <li>Running the carbon credit simulator</li>
                  <li>Publishing to MQTT broker</li>
                </ul>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Recent Messages */}
      {messages.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Messages</h3>
            <Badge className="bg-blue-100 text-blue-800">
              {messages.length} messages
            </Badge>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {messages.slice(0, 10).map((message, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge className={getDeviceTypeColor(message.deviceType)}>
                    {message.deviceType}
                  </Badge>
                  <div className="flex flex-col">
                    <span className="text-sm font-mono text-gray-600">
                      {message.topic}
                    </span>
                    {message.payload.walletAddress && (
                      <span className="text-xs text-gray-500 font-mono">
                        💳 {message.payload.walletAddress.slice(0, 4)}...{message.payload.walletAddress.slice(-3)}
                      </span>
                    )}
                    {message.payload.apiKey && (
                      <span className="text-xs text-blue-500 font-mono">
                        🔑 {message.payload.apiKey.slice(0, 6)}...
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
