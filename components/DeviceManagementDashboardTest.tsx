'use client'

import { useState, useEffect } from 'react'

export function DeviceManagementDashboard({ className }: { className?: string }) {
  const [devices, setDevices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      console.log('Fetching devices...')
      const response = await fetch('/api/iot/devices')
      const result = await response.json()
      console.log('Result:', result)
      
      if (result.success) {
        setDevices(result.devices)
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error:', error)
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return <div>Not mounted yet...</div>
  }

  if (isLoading) {
    return <div>Loading devices...</div>
  }

  return (
    <div className={className}>
      <h1>IoT Device Management</h1>
      <p>Found {devices.length} devices</p>
      <ul>
        {devices.map(device => (
          <li key={device.id}>
            {device.deviceId} - {device.deviceType} - {device.location}
          </li>
        ))}
      </ul>
    </div>
  )
}
