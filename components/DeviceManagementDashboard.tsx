'use client'

import { useState, useEffect } from 'react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { IoTDeviceRegistration } from './IoTDeviceRegistration'
import { LoadingPage } from './Loading'

interface IoTDevice {
  id: string
  deviceId: string
  deviceType: 'CREATOR' | 'BURNER'
  location: string
  projectName: string
  description?: string
  isActive: boolean
  lastSeen?: string
  createdAt: string
  updatedAt: string
}

interface DeviceManagementDashboardProps {
  className?: string
}

export function DeviceManagementDashboard({ className }: DeviceManagementDashboardProps) {
  const [devices, setDevices] = useState<IoTDevice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'CREATOR' | 'BURNER'>('ALL')
  const [sortBy, setSortBy] = useState<'createdAt' | 'lastSeen' | 'deviceId'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const fetchDevices = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/iot/devices')
      const result = await response.json()

      if (result.success) {
        setDevices(result.devices)
        setError(null)
      } else {
        setError(result.message || 'Failed to fetch devices')
      }
    } catch (err) {
      console.error('Error fetching devices:', err)
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  const handleDeviceRegistered = (newDevice: IoTDevice) => {
    setDevices(prev => [newDevice, ...prev])
  }

  const filteredDevices = devices.filter(device => 
    filter === 'ALL' || device.deviceType === filter
  )

  const sortedDevices = [...filteredDevices].sort((a, b) => {
    let aValue: string | number
    let bValue: string | number

    switch (sortBy) {
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      case 'lastSeen':
        aValue = a.lastSeen ? new Date(a.lastSeen).getTime() : 0
        bValue = b.lastSeen ? new Date(b.lastSeen).getTime() : 0
        break
      case 'deviceId':
        aValue = a.deviceId.toLowerCase()
        bValue = b.deviceId.toLowerCase()
        break
      default:
        return 0
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  const getDeviceStatusColor = (device: IoTDevice) => {
    if (!device.isActive) return 'bg-gray-500'
    if (!device.lastSeen) return 'bg-yellow-500'
    
    const lastSeen = new Date(device.lastSeen)
    const now = new Date()
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60)
    
    if (diffMinutes > 60) return 'bg-red-500'
    if (diffMinutes > 15) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getDeviceStatusText = (device: IoTDevice) => {
    if (!device.isActive) return 'Inactive'
    if (!device.lastSeen) return 'Never Connected'
    
    const lastSeen = new Date(device.lastSeen)
    const now = new Date()
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60)
    
    if (diffMinutes > 60) return 'Offline'
    if (diffMinutes > 15) return 'Warning'
    return 'Online'
  }

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Never'
    
    const date = new Date(lastSeen)
    const now = new Date()
    const diffMinutes = (now.getTime() - date.getTime()) / (1000 * 60)
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${Math.floor(diffMinutes)}m ago`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <LoadingPage message="Loading IoT devices..." />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">IoT Device Management</h2>
          <p className="text-gray-600">Manage your CREATOR and BURNER devices</p>
        </div>
        <IoTDeviceRegistration onDeviceRegistered={handleDeviceRegistered} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{devices.length}</div>
            <div className="text-sm text-gray-600">Total Devices</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {devices.filter(d => d.deviceType === 'CREATOR').length}
            </div>
            <div className="text-sm text-gray-600">CREATOR Devices</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {devices.filter(d => d.deviceType === 'BURNER').length}
            </div>
            <div className="text-sm text-gray-600">BURNER Devices</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {devices.filter(d => {
                if (!d.isActive || !d.lastSeen) return false
                const diffMinutes = (new Date().getTime() - new Date(d.lastSeen).getTime()) / (1000 * 60)
                return diffMinutes <= 15
              }).length}
            </div>
            <div className="text-sm text-gray-600">Online Devices</div>
          </div>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'ALL' | 'CREATOR' | 'BURNER')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Devices</option>
              <option value="CREATOR">CREATOR Only</option>
              <option value="BURNER">BURNER Only</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'lastSeen' | 'deviceId')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt">Created Date</option>
              <option value="lastSeen">Last Seen</option>
              <option value="deviceId">Device ID</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          
          <div className="ml-auto">
            <Button onClick={fetchDevices} variant="secondary">
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-red-800">
            <strong>Error:</strong> {error}
          </div>
        </Card>
      )}

      {/* Devices List */}
      {sortedDevices.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-lg font-medium mb-2">No devices found</h3>
            <p className="text-sm">
              {filter === 'ALL' 
                ? 'Register your first IoT device to get started.'
                : `No ${filter} devices found. Try changing the filter or register a new device.`
              }
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedDevices.map((device) => (
            <Card key={device.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {device.deviceId}
                    </h3>
                    <Badge 
                      variant={device.deviceType === 'CREATOR' ? 'success' : 'warning'}
                    >
                      {device.deviceType}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getDeviceStatusColor(device)}`} />
                      <span className="text-sm text-gray-600">
                        {getDeviceStatusText(device)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <strong>Location:</strong> {device.location}
                    </div>
                    <div>
                      <strong>Project:</strong> {device.projectName}
                    </div>
                    <div>
                      <strong>Last Seen:</strong> {formatLastSeen(device.lastSeen)}
                    </div>
                    <div>
                      <strong>Registered:</strong> {new Date(device.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {device.description && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>Description:</strong> {device.description}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  <Button size="sm" variant="secondary">
                    View Details
                  </Button>
                  <Button size="sm" variant="secondary">
                    Configure
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
