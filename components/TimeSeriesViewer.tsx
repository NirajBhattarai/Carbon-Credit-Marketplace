'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface TimeSeriesData {
  deviceId: string
  deviceType: 'SEQUESTER' | 'EMITTER'
  walletAddress: string
  apiKey: string
  location: string
  ip: string
  mac: string
  timeSeries: Array<{
    timestamp: number
    co2?: number
    humidity?: number
    credits?: number
    emissions?: number
    offset?: boolean
  }>
}

interface DeviceStats {
  deviceId: string
  deviceType: 'SEQUESTER' | 'EMITTER'
  walletAddress: string
  apiKey: string
  location: string
  stats: {
    co2: { avg: number; min: number; max: number }
    humidity: { avg: number; min: number; max: number }
    credits: { avg: number; min: number; max: number }
    emissions: { avg: number; min: number; max: number }
    dataPoints: number
    firstSeen: string
    lastSeen: string
  }
}

interface TimeSeriesViewerProps {
  className?: string
}

export function TimeSeriesViewer({ className }: TimeSeriesViewerProps) {
  const [data, setData] = useState<TimeSeriesData[]>([])
  const [stats, setStats] = useState<DeviceStats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'raw' | 'stats'>('raw')
  const [timeRange, setTimeRange] = useState('24h')
  const [deviceFilter, setDeviceFilter] = useState('')

  // Fetch time-series data
  const fetchTimeSeriesData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        startTime: `-${timeRange}`,
        limit: '1000'
      })
      
      if (deviceFilter) {
        params.append('deviceId', deviceFilter)
      }

      const response = await fetch(`/api/timeseries/query?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to fetch data')
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  // Fetch device statistics
  const fetchDeviceStats = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        period: timeRange
      })
      
      if (deviceFilter) {
        params.append('deviceId', deviceFilter)
      }

      const response = await fetch(`/api/timeseries/stats?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
      } else {
        setError(result.error || 'Failed to fetch statistics')
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  // Load data when component mounts or filters change
  useEffect(() => {
    if (viewMode === 'raw') {
      fetchTimeSeriesData()
    } else {
      fetchDeviceStats()
    }
  }, [viewMode, timeRange, deviceFilter])

  // Format timestamp for display
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  // Format time range for display
  const formatTimeRange = (range: string) => {
    const ranges: { [key: string]: string } = {
      '1h': 'Last Hour',
      '6h': 'Last 6 Hours',
      '24h': 'Last 24 Hours',
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days'
    }
    return ranges[range] || range
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Time-Series Data Viewer</h2>
          <p className="text-gray-600">View and analyze MQTT sensor data from InfluxDB</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setViewMode('raw')}
            variant={viewMode === 'raw' ? 'primary' : 'outline'}
            size="sm"
          >
            Raw Data
          </Button>
          <Button
            onClick={() => setViewMode('stats')}
            variant={viewMode === 'stats' ? 'primary' : 'outline'}
            size="sm"
          >
            Statistics
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Range
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Device Filter (Optional)
            </label>
            <input
              type="text"
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              placeholder="Enter device ID..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <Button
              onClick={viewMode === 'raw' ? fetchTimeSeriesData : fetchDeviceStats}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Loading...' : 'Refresh Data'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-800 font-medium">Error</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </Card>
      )}

      {/* Data Display */}
      {viewMode === 'raw' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Raw Time-Series Data ({formatTimeRange(timeRange)})
            </h3>
            <Badge className="bg-blue-100 text-blue-800">
              {data.length} devices
            </Badge>
          </div>
          
          {data.map((device) => (
            <Card key={`${device.deviceId}_${device.walletAddress}`} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Badge className={device.deviceType === 'SEQUESTER' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                    {device.deviceType}
                  </Badge>
                  <div>
                    <h4 className="font-semibold text-gray-900">{device.deviceId}</h4>
                    <p className="text-sm text-gray-500">
                      💳 {device.walletAddress.slice(0, 6)}...{device.walletAddress.slice(-4)}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {device.timeSeries.length} data points
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2">Timestamp</th>
                      <th className="text-right py-2">CO₂ (ppm)</th>
                      <th className="text-right py-2">Humidity (%)</th>
                      <th className="text-right py-2">Credits</th>
                      <th className="text-right py-2">Emissions</th>
                      <th className="text-center py-2">Offset</th>
                    </tr>
                  </thead>
                  <tbody>
                    {device.timeSeries.slice(0, 10).map((point, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2 text-gray-600">
                          {formatTimestamp(point.timestamp)}
                        </td>
                        <td className="py-2 text-right font-mono">
                          {point.co2?.toFixed(0) || '-'}
                        </td>
                        <td className="py-2 text-right font-mono">
                          {point.humidity?.toFixed(1) || '-'}
                        </td>
                        <td className="py-2 text-right font-mono text-green-600">
                          {point.credits?.toFixed(1) || '-'}
                        </td>
                        <td className="py-2 text-right font-mono text-orange-600">
                          {point.emissions?.toFixed(1) || '-'}
                        </td>
                        <td className="py-2 text-center">
                          {point.offset !== undefined ? (
                            <Badge className={point.offset ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {point.offset ? 'Yes' : 'No'}
                            </Badge>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {device.timeSeries.length > 10 && (
                  <div className="text-center mt-2 text-sm text-gray-500">
                    Showing first 10 of {device.timeSeries.length} data points
                  </div>
                )}
              </div>
            </Card>
          ))}
          
          {data.length === 0 && !loading && (
            <Card className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Found</h3>
              <p className="text-gray-600">
                No time-series data found for the selected time range and filters.
              </p>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Device Statistics ({formatTimeRange(timeRange)})
            </h3>
            <Badge className="bg-blue-100 text-blue-800">
              {stats.length} devices
            </Badge>
          </div>
          
          {stats.map((device) => (
            <Card key={`${device.deviceId}_${device.walletAddress}`} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Badge className={device.deviceType === 'SEQUESTER' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                    {device.deviceType}
                  </Badge>
                  <div>
                    <h4 className="font-semibold text-gray-900">{device.deviceId}</h4>
                    <p className="text-sm text-gray-500">
                      💳 {device.walletAddress.slice(0, 6)}...{device.walletAddress.slice(-4)}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {device.stats.dataPoints} data points
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">
                    {device.stats.co2.avg.toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-600">CO₂ Avg (ppm)</div>
                  <div className="text-xs text-gray-500">
                    {device.stats.co2.min.toFixed(0)} - {device.stats.co2.max.toFixed(0)}
                  </div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">
                    {device.stats.humidity.avg.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Humidity Avg</div>
                  <div className="text-xs text-gray-500">
                    {device.stats.humidity.min.toFixed(1)}% - {device.stats.humidity.max.toFixed(1)}%
                  </div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {device.stats.credits.avg.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Credits Avg</div>
                  <div className="text-xs text-gray-500">
                    {device.stats.credits.min.toFixed(1)} - {device.stats.credits.max.toFixed(1)}
                  </div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">
                    {device.stats.emissions.avg.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Emissions Avg</div>
                  <div className="text-xs text-gray-500">
                    {device.stats.emissions.min.toFixed(1)} - {device.stats.emissions.max.toFixed(1)}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>First Seen: {formatTimestamp(new Date(device.stats.firstSeen).getTime())}</span>
                  <span>Last Seen: {formatTimestamp(new Date(device.stats.lastSeen).getTime())}</span>
                </div>
              </div>
            </Card>
          ))}
          
          {stats.length === 0 && !loading && (
            <Card className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Statistics Found</h3>
              <p className="text-gray-600">
                No device statistics found for the selected time range and filters.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
