'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/Loading'

interface DashboardData {
  totalCredits: number
  totalCo2Reduced: number
  totalEnergySaved: number
  averageTemperatureImpact: number
  averageHumidityImpact: number
  onlineStatus: boolean
  lastUpdated: string
  recentHistory: Array<{
    creditsEarned: number
    co2Reduced: number
    energySaved: number
    source: string
    timestamp: string
  }>
}

interface UserCredits {
  credits: number
  co2Reduced: number
  energySaved: number
  temperatureImpact: number
  humidityImpact: number
  isOnline: boolean
  timestamp: string
}

export function UserDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
    fetchUserCredits()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/user/dashboard')
      const result = await response.json()

      if (result.success) {
        setDashboardData(result.data)
      } else {
        setError('Failed to fetch dashboard data')
      }
    } catch (err) {
      setError('Error fetching dashboard data')
      console.error('Dashboard fetch error:', err)
    }
  }

  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/user/credits')
      const result = await response.json()

      if (result.success) {
        setUserCredits(result.data)
      } else {
        setError('Failed to fetch user credits')
      }
    } catch (err) {
      setError('Error fetching user credits')
      console.error('Credits fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    setLoading(true)
    setError(null)
    fetchDashboardData()
    fetchUserCredits()
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  }

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString()
  }

  if (loading) {
    return <Loading />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={refreshData} variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Button onClick={refreshData} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Credits</p>
              <p className="text-2xl font-bold text-green-600">
                {formatNumber(dashboardData?.totalCredits || 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">CO₂ Reduced</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatNumber(dashboardData?.totalCo2Reduced || 0)} kg
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Energy Saved</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatNumber(dashboardData?.totalEnergySaved || 0)} kWh
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <div className="flex items-center space-x-2">
                <Badge variant={dashboardData?.onlineStatus ? 'success' : 'secondary'}>
                  {dashboardData?.onlineStatus ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </div>
            <div className={`p-3 rounded-full ${dashboardData?.onlineStatus ? 'bg-green-100' : 'bg-gray-100'}`}>
              <div className={`w-3 h-3 rounded-full ${dashboardData?.onlineStatus ? 'bg-green-500' : 'bg-gray-400'}`} />
            </div>
          </div>
        </Card>
      </div>

      {/* Current Credits */}
      {userCredits && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Current Credits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Credits</p>
              <p className="text-lg font-semibold">{formatNumber(userCredits.credits)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Temperature Impact</p>
              <p className="text-lg font-semibold">{formatNumber(userCredits.temperatureImpact)}°C</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Humidity Impact</p>
              <p className="text-lg font-semibold">{formatNumber(userCredits.humidityImpact)}%</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {formatTimestamp(userCredits.timestamp)}
          </p>
        </Card>
      )}

      {/* Recent History */}
      {dashboardData?.recentHistory && dashboardData.recentHistory.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {dashboardData.recentHistory.map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">+{formatNumber(entry.creditsEarned)} credits</p>
                    <p className="text-sm text-gray-600">
                      {formatNumber(entry.co2Reduced)} kg CO₂ • {formatNumber(entry.energySaved)} kWh
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline">{entry.source}</Badge>
                  <p className="text-sm text-gray-500">{formatTimestamp(entry.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Earnings Summary */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Earnings Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Environmental Impact</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">CO₂ Reduction:</span>
                <span className="font-semibold">{formatNumber(dashboardData?.totalCo2Reduced || 0)} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Energy Saved:</span>
                <span className="font-semibold">{formatNumber(dashboardData?.totalEnergySaved || 0)} kWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Temp Impact:</span>
                <span className="font-semibold">{formatNumber(dashboardData?.averageTemperatureImpact || 0)}°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Humidity Impact:</span>
                <span className="font-semibold">{formatNumber(dashboardData?.averageHumidityImpact || 0)}%</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Performance</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Credits:</span>
                <span className="font-semibold text-green-600">{formatNumber(dashboardData?.totalCredits || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Device Status:</span>
                <Badge variant={dashboardData?.onlineStatus ? 'success' : 'secondary'}>
                  {dashboardData?.onlineStatus ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="text-sm">{formatTimestamp(dashboardData?.lastUpdated || '')}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
