'use client'

import React, { useEffect, useState } from 'react'
import { useMQTT } from '@/lib/mqtt/context'

export default function MQTTDebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const mqtt = useMQTT()

  useEffect(() => {
    const addLog = (message: string) => {
      setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
    }

    // Log MQTT connection status
    addLog(`MQTT Connected: ${mqtt.connectionState.isConnected}`)
    addLog(`MQTT Connecting: ${mqtt.connectionState.isConnecting}`)
    addLog(`MQTT Error: ${mqtt.connectionState.error || 'None'}`)
    addLog(`Sequester Devices: ${mqtt.sequesterDevices.size}`)
    addLog(`Emitter Devices: ${mqtt.emitterDevices.size}`)
    addLog(`Messages: ${mqtt.messages.length}`)

    // Log when connection state changes
    const interval = setInterval(() => {
      addLog(`Status - Connected: ${mqtt.connectionState.isConnected}, Devices: ${mqtt.sequesterDevices.size + mqtt.emitterDevices.size}`)
    }, 5000)

    return () => clearInterval(interval)
  }, [mqtt])

  const sendTestMessage = async () => {
    try {
      const response = await fetch('/api/mqtt/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'carbon_sequester/cc_test123/sensor_data',
          payload: {
            c: 450,
            h: 65,
            cr: 225.0,
            e: 13.0,
            o: true,
            t: Date.now()
          }
        })
      })
      
      if (response.ok) {
        setLogs(prev => [...prev, '✅ Test message sent successfully'])
      } else {
        setLogs(prev => [...prev, '❌ Failed to send test message'])
      }
    } catch (error) {
      setLogs(prev => [...prev, `❌ Error sending test message: ${error}`])
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">MQTT Debug Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* MQTT Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">MQTT Status</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Connected:</span>
                <span className={mqtt.connectionState.isConnected ? 'text-green-600' : 'text-red-600'}>
                  {mqtt.connectionState.isConnected ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Connecting:</span>
                <span className={mqtt.connectionState.isConnecting ? 'text-yellow-600' : 'text-gray-600'}>
                  {mqtt.connectionState.isConnecting ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Error:</span>
                <span className="text-red-600">
                  {mqtt.connectionState.error || 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sequester Devices:</span>
                <span className="text-blue-600">{mqtt.sequesterDevices.size}</span>
              </div>
              <div className="flex justify-between">
                <span>Emitter Devices:</span>
                <span className="text-blue-600">{mqtt.emitterDevices.size}</span>
              </div>
              <div className="flex justify-between">
                <span>Messages:</span>
                <span className="text-blue-600">{mqtt.messages.length}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-y-4">
              <button
                onClick={() => mqtt.connect()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Connect to MQTT
              </button>
              <button
                onClick={() => mqtt.disconnect()}
                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Disconnect from MQTT
              </button>
              <button
                onClick={sendTestMessage}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Send Test Message
              </button>
              <button
                onClick={() => setLogs([])}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear Logs
              </button>
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>

        {/* Recent Messages */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent MQTT Messages</h2>
          <div className="space-y-2">
            {mqtt.messages.length === 0 ? (
              <div className="text-gray-500">No messages received yet...</div>
            ) : (
              mqtt.messages.slice(0, 5).map((message, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded">
                  <div className="font-semibold">Topic: {message.topic}</div>
                  <div className="text-sm text-gray-600">
                    Device Type: {message.deviceType}
                  </div>
                  <div className="text-sm text-gray-600">
                    Timestamp: {new Date(message.timestamp).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    CO2: {message.payload.c} ppm, Credits: {message.payload.cr}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
