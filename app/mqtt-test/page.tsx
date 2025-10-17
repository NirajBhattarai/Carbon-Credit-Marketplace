'use client'

import React, { useEffect, useState } from 'react'
import { useMQTT } from '@/lib/mqtt/context'

export default function MQTTTestPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const mqtt = useMQTT()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `${timestamp}: ${message}`])
    console.log(`MQTT Test: ${message}`)
  }

  useEffect(() => {
    addLog('MQTT Test Page Loaded')
    addLog(`Initial Connection State: ${mqtt.connectionState.isConnected}`)
    
    // Force connection
    if (!mqtt.connectionState.isConnected && !mqtt.connectionState.isConnecting) {
      addLog('Attempting to connect to MQTT...')
      mqtt.connect()
    }
  }, [])

  useEffect(() => {
    if (mqtt.connectionState.isConnected !== isConnected) {
      setIsConnected(mqtt.connectionState.isConnected)
      addLog(`Connection State Changed: ${mqtt.connectionState.isConnected}`)
      
      if (mqtt.connectionState.isConnected) {
        addLog('✅ MQTT Connected Successfully!')
        addLog(`Sequester Devices: ${mqtt.sequesterDevices.size}`)
        addLog(`Emitter Devices: ${mqtt.emitterDevices.size}`)
        addLog(`Messages Received: ${mqtt.messages.length}`)
      } else if (mqtt.connectionState.error) {
        addLog(`❌ MQTT Connection Error: ${mqtt.connectionState.error}`)
      }
    }
  }, [mqtt.connectionState.isConnected, isConnected])

  const sendTestMessage = async () => {
    try {
      addLog('Sending test MQTT message...')
      
      const response = await fetch('/api/mqtt/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'carbon_sequester/cc_dfd4d3742159b53e68b4f2bae6df4132f2374c64b53a26b43cf6604e46c7e62a/sensor_data',
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
        addLog('✅ Test message sent successfully')
        addLog('Waiting 5 seconds for processing...')
        
        setTimeout(async () => {
          try {
            const dataResponse = await fetch('/api/timeseries/query?startTime=-1m&limit=5')
            const dataResult = await dataResponse.json()
            
            if (dataResult.success && dataResult.data.length > 0) {
              addLog(`✅ Data found in InfluxDB: ${dataResult.data.length} devices`)
              dataResult.data.forEach((device: any, index: number) => {
                addLog(`Device ${index + 1}: ${device.deviceId} - CO2: ${device.timeSeries[0]?.co2} ppm`)
              })
            } else {
              addLog('⚠️ No data found in InfluxDB')
            }
          } catch (error) {
            addLog(`❌ Error checking InfluxDB: ${error}`)
          }
        }, 5000)
      } else {
        addLog('❌ Failed to send test message')
      }
    } catch (error) {
      addLog(`❌ Error sending test message: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">MQTT to InfluxDB Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                onClick={() => {
                  addLog('Manual connect requested')
                  mqtt.connect()
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Connect to MQTT
              </button>
              <button
                onClick={() => {
                  addLog('Manual disconnect requested')
                  mqtt.disconnect()
                }}
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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Logs</h2>
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

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside text-blue-800 space-y-1">
            <li>Click "Connect to MQTT" to establish WebSocket connection</li>
            <li>Wait for "✅ MQTT Connected Successfully!" message</li>
            <li>Click "Send Test Message" to send CO2 data</li>
            <li>Check logs for data processing results</li>
            <li>Verify data appears in InfluxDB</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
