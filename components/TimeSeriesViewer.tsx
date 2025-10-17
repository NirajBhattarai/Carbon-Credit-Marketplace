'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  useInfluxDBQuery,
  useInfluxDBStats,
  useInfluxDBRealtime,
  InfluxDBDataPoint,
  InfluxDBStats,
} from '@/lib/hooks/useInfluxDB';

interface TimeSeriesViewerProps {
  className?: string;
}

export function TimeSeriesViewer({ className }: TimeSeriesViewerProps) {
  const [viewMode, setViewMode] = useState<'raw' | 'stats'>('raw');
  const [timeRange, setTimeRange] = useState('24h');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<
    'SEQUESTER' | 'EMITTER' | 'ALL'
  >('ALL');
  const [walletFilter, setWalletFilter] = useState('');
  const [realtimeMode, setRealtimeMode] = useState(false);

  // Query parameters for InfluxDB
  const queryParams = {
    deviceId: deviceFilter || undefined,
    deviceType: deviceTypeFilter !== 'ALL' ? deviceTypeFilter : undefined,
    walletAddress: walletFilter || undefined,
    startTime: `-${timeRange}`,
    limit: 1000,
    measurement: 'sensor_data',
  };

  // Use appropriate hook based on mode
  const {
    data: rawData,
    isLoading: rawLoading,
    error: rawError,
    refetch: refetchRaw,
  } = useInfluxDBQuery(queryParams);
  const {
    stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useInfluxDBStats(queryParams);
  const {
    data: realtimeData,
    isLoading: realtimeLoading,
    error: realtimeError,
    isConnected,
  } = useInfluxDBRealtime(queryParams, 30000);

  // Use realtime data if in realtime mode, otherwise use regular data
  const currentData = realtimeMode ? realtimeData : rawData;
  const currentLoading = realtimeMode ? realtimeLoading : rawLoading;
  const currentError = realtimeMode ? realtimeError : rawError;

  // Format timestamp for display
  const formatTimestamp = (timestamp: string | number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Format time range for display
  const formatTimeRange = (range: string) => {
    const ranges: { [key: string]: string } = {
      '1h': 'Last Hour',
      '6h': 'Last 6 Hours',
      '24h': 'Last 24 Hours',
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days',
    };
    return ranges[range] || range;
  };

  // Get device type color
  const getDeviceTypeColor = (deviceType: 'SEQUESTER' | 'EMITTER') => {
    return deviceType === 'SEQUESTER'
      ? 'bg-green-100 text-green-800'
      : 'bg-orange-100 text-orange-800';
  };

  // Process data for display
  const processedData =
    currentData?.reduce((acc: any[], point: InfluxDBDataPoint) => {
      const existingDevice = acc.find(d => d.deviceId === point.device_id);

      if (existingDevice) {
        existingDevice.timeSeries.push({
          timestamp: new Date(point._time).getTime(),
          co2: point.co2,
          humidity: point.humidity,
          credits: point.credits,
          emissions: point.emissions,
          offset: point.offset,
        });
      } else {
        acc.push({
          deviceId: point.device_id || 'unknown',
          deviceType: point.device_type || 'SEQUESTER',
          walletAddress: point.wallet_address || 'unknown',
          apiKey: point.api_key || 'unknown',
          location: point.location || 'unknown',
          ip: point.ip || 'unknown',
          mac: point.mac || 'unknown',
          timeSeries: [
            {
              timestamp: new Date(point._time).getTime(),
              co2: point.co2,
              humidity: point.humidity,
              credits: point.credits,
              emissions: point.emissions,
              offset: point.offset,
            },
          ],
        });
      }

      return acc;
    }, []) || [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>
            Time-Series Data Viewer
          </h2>
          <p className='text-gray-600'>
            View and analyze sensor data from InfluxDB
            {realtimeMode && (
              <span className='ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                🔴 Live
              </span>
            )}
          </p>
        </div>

        <div className='flex items-center space-x-3'>
          <Button
            onClick={() => setRealtimeMode(!realtimeMode)}
            variant={realtimeMode ? 'primary' : 'outline'}
            size='sm'
          >
            {realtimeMode ? '🔄 Live Mode' : '📊 Static Mode'}
          </Button>
          <Button
            onClick={() => setViewMode('raw')}
            variant={viewMode === 'raw' ? 'primary' : 'outline'}
            size='sm'
          >
            Raw Data
          </Button>
          <Button
            onClick={() => setViewMode('stats')}
            variant={viewMode === 'stats' ? 'primary' : 'outline'}
            size='sm'
          >
            Statistics
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className='p-4'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Time Range
            </label>
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='1h'>Last Hour</option>
              <option value='6h'>Last 6 Hours</option>
              <option value='24h'>Last 24 Hours</option>
              <option value='7d'>Last 7 Days</option>
              <option value='30d'>Last 30 Days</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Device Type
            </label>
            <select
              value={deviceTypeFilter}
              onChange={e =>
                setDeviceTypeFilter(
                  e.target.value as 'SEQUESTER' | 'EMITTER' | 'ALL'
                )
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='ALL'>All Devices</option>
              <option value='SEQUESTER'>Sequesters</option>
              <option value='EMITTER'>Emitters</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Device ID (Optional)
            </label>
            <input
              type='text'
              value={deviceFilter}
              onChange={e => setDeviceFilter(e.target.value)}
              placeholder='Enter device ID...'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Wallet Address (Optional)
            </label>
            <input
              type='text'
              value={walletFilter}
              onChange={e => setWalletFilter(e.target.value)}
              placeholder='Enter wallet address...'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
        </div>
      </Card>

      {/* Error Display */}
      {currentError && (
        <Card className='p-4 bg-red-50 border-red-200'>
          <div className='flex items-center space-x-2'>
            <svg
              className='w-5 h-5 text-red-500'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            <span className='text-red-800 font-medium'>Error</span>
          </div>
          <p className='text-red-700 mt-1'>{currentError}</p>
        </Card>
      )}

      {/* Loading State */}
      {currentLoading && (
        <Card className='p-8 text-center'>
          <div className='flex items-center justify-center space-x-2'>
            <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500'></div>
            <span className='text-gray-600'>
              {realtimeMode ? 'Loading real-time data...' : 'Loading data...'}
            </span>
          </div>
        </Card>
      )}

      {/* Data Display */}
      {!currentLoading && !currentError && (
        <>
          {viewMode === 'raw' ? (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Raw Time-Series Data ({formatTimeRange(timeRange)})
                </h3>
                <Badge className='bg-blue-100 text-blue-800'>
                  {processedData.length} devices
                </Badge>
              </div>

              {processedData.map(device => (
                <Card
                  key={`${device.deviceId}_${device.walletAddress}`}
                  className='p-4'
                >
                  <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center space-x-3'>
                      <Badge className={getDeviceTypeColor(device.deviceType)}>
                        {device.deviceType}
                      </Badge>
                      <div>
                        <h4 className='font-semibold text-gray-900'>
                          {device.walletAddress
                            ? `${device.walletAddress.slice(0, 4)}...${device.walletAddress.slice(-3)}`
                            : device.deviceId}
                        </h4>
                        <p className='text-sm text-gray-600'>
                          💳 Wallet Address
                        </p>
                      </div>
                    </div>
                    <div className='text-right text-sm text-gray-500'>
                      <div>{device.timeSeries.length} data points</div>
                      <div>
                        {formatTimestamp(device.timeSeries[0]?.timestamp)} -{' '}
                        {formatTimestamp(
                          device.timeSeries[device.timeSeries.length - 1]
                            ?.timestamp
                        )}
                      </div>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                    <div>
                      <div className='text-sm text-gray-600 mb-1'>
                        CO₂ (ppm)
                      </div>
                      <div className='text-lg font-semibold text-gray-900'>
                        {device.timeSeries[
                          device.timeSeries.length - 1
                        ]?.co2?.toFixed(1) || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className='text-sm text-gray-600 mb-1'>
                        Humidity (%)
                      </div>
                      <div className='text-lg font-semibold text-gray-900'>
                        {device.timeSeries[
                          device.timeSeries.length - 1
                        ]?.humidity?.toFixed(1) || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className='text-sm text-gray-600 mb-1'>Credits</div>
                      <div className='text-lg font-semibold text-green-600'>
                        {device.timeSeries[
                          device.timeSeries.length - 1
                        ]?.credits?.toFixed(1) || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className='text-sm text-gray-600 mb-1'>
                        Emissions
                      </div>
                      <div className='text-lg font-semibold text-orange-600'>
                        {device.timeSeries[
                          device.timeSeries.length - 1
                        ]?.emissions?.toFixed(1) || 'N/A'}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {processedData.length === 0 && (
                <Card className='p-8 text-center'>
                  <div className='text-gray-500'>
                    <svg
                      className='w-16 h-16 mx-auto mb-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1}
                        d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                      />
                    </svg>
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>
                      No Data Found
                    </h3>
                    <p className='text-gray-600'>
                      No time-series data found for the selected filters.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Device Statistics ({formatTimeRange(timeRange)})
                </h3>
                <Badge className='bg-green-100 text-green-800'>
                  {stats ? 'Stats Available' : 'No Stats'}
                </Badge>
              </div>

              {stats ? (
                <Card className='p-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-blue-600'>
                        {stats.totalPoints}
                      </div>
                      <div className='text-sm text-gray-600'>
                        Total Data Points
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-green-600'>
                        {stats.deviceCount}
                      </div>
                      <div className='text-sm text-gray-600'>
                        Active Devices
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-orange-600'>
                        {stats.avgCO2.toFixed(1)}
                      </div>
                      <div className='text-sm text-gray-600'>Avg CO₂ (ppm)</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-purple-600'>
                        {stats.avgHumidity.toFixed(1)}
                      </div>
                      <div className='text-sm text-gray-600'>
                        Avg Humidity (%)
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-green-600'>
                        {stats.totalCredits.toFixed(1)}
                      </div>
                      <div className='text-sm text-gray-600'>Total Credits</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-red-600'>
                        {stats.totalEmissions.toFixed(1)}
                      </div>
                      <div className='text-sm text-gray-600'>
                        Total Emissions
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className='p-8 text-center'>
                  <div className='text-gray-500'>
                    <svg
                      className='w-16 h-16 mx-auto mb-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1}
                        d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                      />
                    </svg>
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>
                      No Statistics Available
                    </h3>
                    <p className='text-gray-600'>
                      No statistics found for the selected filters.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
