'use client';

import React, { useState, useEffect } from 'react';
import { useMQTT, SensorData } from '@/lib/mqtt/context';
import { useInfluxDBQuery, InfluxDBDataPoint } from '@/lib/hooks/useInfluxDB';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MultiMetricChart } from '@/components/RealTimeChart';

interface TimeSeriesDataPageProps {
  className?: string;
}

interface ChartDataPoint {
  timestamp: number;
  value: number;
  label: string;
}

export function TimeSeriesDataPage({ className }: TimeSeriesDataPageProps) {
  const { connectionState, sequesterDevices, emitterDevices, getDeviceCount } =
    useMQTT();

  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [deviceMetrics, setDeviceMetrics] = useState<
    Map<
      string,
      {
        deviceId: string;
        deviceType: 'SEQUESTER' | 'EMITTER';
        walletAddress?: string;
        apiKey?: string;
        location?: string;
        co2Data: ChartDataPoint[];
        humidityData: ChartDataPoint[];
        creditsData: ChartDataPoint[];
        emissionsData: ChartDataPoint[];
      }
    >
  >(new Map());

  const deviceCount = getDeviceCount();

  // Query parameters for historical data
  const queryParams = {
    startTime: `-${timeRange}`,
    limit: 1000,
    measurement: 'sensor_data',
  };

  const { data: historicalData, isLoading: historicalLoading } =
    useInfluxDBQuery(queryParams);

  // Process device metrics and create chart data
  useEffect(() => {
    const metricsMap = new Map();

    // Process sequester devices (Creators)
    sequesterDevices.forEach((data, deviceId) => {
      const deviceHistoricalData =
        historicalData?.filter(
          point =>
            point.device_id === deviceId ||
            point.mac === data.mac ||
            point.api_key === data.apiKey
        ) || [];

      const chartData = processChartData(deviceHistoricalData);

      metricsMap.set(deviceId, {
        deviceId,
        deviceType: 'SEQUESTER',
        walletAddress: data.walletAddress,
        apiKey: data.apiKey,
        location: data.location,
        ...chartData,
      });
    });

    // Process emitter devices (Burners)
    emitterDevices.forEach((data, deviceId) => {
      const deviceHistoricalData =
        historicalData?.filter(
          point =>
            point.device_id === deviceId ||
            point.mac === data.mac ||
            point.api_key === data.apiKey
        ) || [];

      const chartData = processChartData(deviceHistoricalData);

      metricsMap.set(deviceId, {
        deviceId,
        deviceType: 'EMITTER',
        walletAddress: data.walletAddress,
        apiKey: data.apiKey,
        location: data.location,
        ...chartData,
      });
    });

    setDeviceMetrics(metricsMap);
  }, [sequesterDevices, emitterDevices, historicalData]);

  const processChartData = (historicalData: InfluxDBDataPoint[]) => {
    const co2Data: ChartDataPoint[] = [];
    const humidityData: ChartDataPoint[] = [];
    const creditsData: ChartDataPoint[] = [];
    const emissionsData: ChartDataPoint[] = [];

    historicalData.forEach(point => {
      const timestamp = new Date(point._time).getTime();

      if (point.co2 !== undefined) {
        co2Data.push({
          timestamp,
          value: point.co2,
          label: `CO₂: ${point.co2.toFixed(1)} ppm`,
        });
      }

      if (point.humidity !== undefined) {
        humidityData.push({
          timestamp,
          value: point.humidity,
          label: `Humidity: ${point.humidity.toFixed(1)}%`,
        });
      }

      if (point.credits !== undefined) {
        creditsData.push({
          timestamp,
          value: point.credits,
          label: `Credits: ${point.credits.toFixed(1)}`,
        });
      }

      if (point.emissions !== undefined) {
        emissionsData.push({
          timestamp,
          value: point.emissions,
          label: `Emissions: ${point.emissions.toFixed(1)}`,
        });
      }
    });

    // Sort by timestamp
    const sortByTimestamp = (a: ChartDataPoint, b: ChartDataPoint) =>
      a.timestamp - b.timestamp;

    return {
      co2Data: co2Data.sort(sortByTimestamp),
      humidityData: humidityData.sort(sortByTimestamp),
      creditsData: creditsData.sort(sortByTimestamp),
      emissionsData: emissionsData.sort(sortByTimestamp),
    };
  };

  const getDeviceTypeColor = (deviceType: 'SEQUESTER' | 'EMITTER') => {
    return deviceType === 'SEQUESTER'
      ? 'bg-green-100 text-green-800'
      : 'bg-orange-100 text-orange-800';
  };

  const getDeviceTypeIcon = (deviceType: 'SEQUESTER' | 'EMITTER') => {
    return deviceType === 'SEQUESTER' ? (
      <svg
        className='w-5 h-5 text-green-600'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M13 10V3L4 14h7v7l9-11h-7z'
        />
      </svg>
    ) : (
      <svg
        className='w-5 h-5 text-orange-600'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z'
        />
      </svg>
    );
  };

  const renderDeviceSelector = () => (
    <Card className='p-4'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>
        Select Device for Charts
      </h3>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {Array.from(deviceMetrics.entries()).map(([deviceId, metrics]) => (
          <div
            key={deviceId}
            className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedDevice === deviceId
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() =>
              setSelectedDevice(selectedDevice === deviceId ? null : deviceId)
            }
          >
            <div className='flex items-center space-x-3 mb-2'>
              <div
                className={`p-2 rounded-lg ${metrics.deviceType === 'SEQUESTER' ? 'bg-green-100' : 'bg-orange-100'}`}
              >
                {getDeviceTypeIcon(metrics.deviceType)}
              </div>
              <div className='flex-1'>
                <h4 className='font-semibold text-gray-900'>{deviceId}</h4>
                <Badge className={getDeviceTypeColor(metrics.deviceType)}>
                  {metrics.deviceType === 'SEQUESTER'
                    ? '🌱 Creator'
                    : '🔥 Burner'}
                </Badge>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-2 text-sm text-gray-600'>
              <div>CO₂: {metrics.co2Data.length} pts</div>
              <div>Humidity: {metrics.humidityData.length} pts</div>
              <div>Credits: {metrics.creditsData.length} pts</div>
              <div>Emissions: {metrics.emissionsData.length} pts</div>
            </div>

            {metrics.walletAddress && (
              <div className='mt-2 text-xs text-gray-500 font-mono'>
                💳 {metrics.walletAddress.slice(0, 6)}...
                {metrics.walletAddress.slice(-4)}
              </div>
            )}
          </div>
        ))}
      </div>

      {deviceMetrics.size === 0 && (
        <div className='text-center py-8 text-gray-500'>
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
            No Devices Available
          </h3>
          <p className='text-gray-600'>
            No IoT devices are currently connected or sending data.
          </p>
        </div>
      )}
    </Card>
  );

  const renderSelectedDeviceCharts = () => {
    if (!selectedDevice || !deviceMetrics.has(selectedDevice)) {
      return (
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
              Select a Device
            </h3>
            <p className='text-gray-600'>
              Choose a device from the list above to view its time-series
              charts.
            </p>
          </div>
        </Card>
      );
    }

    const metrics = deviceMetrics.get(selectedDevice)!;

    return (
      <MultiMetricChart
        deviceId={selectedDevice}
        deviceType={metrics.deviceType}
        co2Data={metrics.co2Data}
        humidityData={metrics.humidityData}
        creditsData={metrics.creditsData}
        emissionsData={metrics.emissionsData}
      />
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>
            Time-Series Data Visualization
          </h2>
          <p className='text-gray-600'>
            Interactive charts for burner and creator device sensor data
          </p>
        </div>

        <div className='flex items-center space-x-3'>
          <Badge
            className={`px-3 py-1 ${
              connectionState.isConnected
                ? 'bg-green-100 text-green-800'
                : connectionState.isConnecting
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
            }`}
          >
            {connectionState.isConnected
              ? '🟢'
              : connectionState.isConnecting
                ? '🟡'
                : '🔴'}{' '}
            MQTT{' '}
            {connectionState.isConnected
              ? 'Connected'
              : connectionState.isConnecting
                ? 'Connecting'
                : 'Disconnected'}
          </Badge>
        </div>
      </div>

      {/* Controls */}
      <Card className='p-4'>
        <div className='flex flex-wrap gap-4 items-center'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Time Range
            </label>
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
              className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='1h'>Last Hour</option>
              <option value='6h'>Last 6 Hours</option>
              <option value='24h'>Last 24 Hours</option>
              <option value='7d'>Last 7 Days</option>
              <option value='30d'>Last 30 Days</option>
            </select>
          </div>

          <div className='ml-auto'>
            <div className='text-sm text-gray-600'>
              <span className='font-medium'>
                {deviceCount.sequesters + deviceCount.emitters}
              </span>{' '}
              devices connected
              <span className='ml-4'>
                <span className='text-green-600'>{deviceCount.sequesters}</span>{' '}
                creators,{' '}
                <span className='text-orange-600'>{deviceCount.emitters}</span>{' '}
                burners
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Device Selector */}
      {renderDeviceSelector()}

      {/* Charts */}
      {renderSelectedDeviceCharts()}

      {/* Loading State */}
      {historicalLoading && (
        <Card className='p-8 text-center'>
          <div className='flex items-center justify-center space-x-2'>
            <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500'></div>
            <span className='text-gray-600'>Loading historical data...</span>
          </div>
        </Card>
      )}
    </div>
  );
}
