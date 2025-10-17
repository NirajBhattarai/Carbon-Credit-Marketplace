'use client';

import React, { useState, useEffect } from 'react';
import { useMQTT, SensorData } from '@/lib/mqtt/context';
import {
  useInfluxDBQuery,
  useInfluxDBStats,
  InfluxDBDataPoint,
} from '@/lib/hooks/useInfluxDB';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface IoTDeviceDashboardProps {
  className?: string;
}

interface DeviceMetrics {
  deviceId: string;
  deviceType: 'SEQUESTER' | 'EMITTER';
  walletAddress?: string;
  apiKey?: string;
  location?: string;
  currentData: SensorData;
  historicalData: InfluxDBDataPoint[];
  metrics: {
    avgCO2: number;
    maxCO2: number;
    minCO2: number;
    avgHumidity: number;
    totalCredits: number;
    totalEmissions: number;
    dataPoints: number;
    lastUpdate: Date;
  };
}

export function IoTDeviceDashboard({ className }: IoTDeviceDashboardProps) {
  const { connectionState, sequesterDevices, emitterDevices, getDeviceCount } =
    useMQTT();

  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [viewMode, setViewMode] = useState<
    'overview' | 'detailed' | 'analytics'
  >('overview');
  const [deviceMetrics, setDeviceMetrics] = useState<
    Map<string, DeviceMetrics>
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
  const { stats } = useInfluxDBStats(queryParams);

  // Process device metrics
  useEffect(() => {
    const metricsMap = new Map<string, DeviceMetrics>();

    // Process sequester devices (Creators)
    sequesterDevices.forEach((data, deviceId) => {
      const deviceHistoricalData =
        historicalData?.filter(
          point => point.device_id === deviceId || point.api_key === data.apiKey
        ) || [];

      const metrics = calculateDeviceMetrics(data, deviceHistoricalData);

      metricsMap.set(deviceId, {
        deviceId,
        deviceType: 'SEQUESTER',
        walletAddress: data.walletAddress,
        apiKey: data.apiKey,
        location: data.location,
        currentData: data,
        historicalData: deviceHistoricalData,
        metrics,
      });
    });

    // Process emitter devices (Burners)
    emitterDevices.forEach((data, deviceId) => {
      const deviceHistoricalData =
        historicalData?.filter(
          point => point.device_id === deviceId || point.api_key === data.apiKey
        ) || [];

      const metrics = calculateDeviceMetrics(data, deviceHistoricalData);

      metricsMap.set(deviceId, {
        deviceId,
        deviceType: 'EMITTER',
        walletAddress: data.walletAddress,
        apiKey: data.apiKey,
        location: data.location,
        currentData: data,
        historicalData: deviceHistoricalData,
        metrics,
      });
    });

    setDeviceMetrics(metricsMap);
  }, [sequesterDevices, emitterDevices, historicalData]);

  const calculateDeviceMetrics = (
    currentData: SensorData,
    historicalData: InfluxDBDataPoint[]
  ) => {
    // Helper function to safely get numeric value with fallback
    const getNumericValue = (value: any, fallback: number = 0): number => {
      if (typeof value === 'number' && !isNaN(value)) return value;
      return fallback;
    };

    // Extract values from current data, handling both MQTT and InfluxDB formats
    const currentCO2 = getNumericValue(
      (currentData as any).co2 || currentData.c || currentData.avg_c
    );
    const currentHumidity = getNumericValue(
      (currentData as any).humidity || currentData.h || currentData.avg_h
    );
    const currentCredits = getNumericValue(
      (currentData as any).credits || currentData.cr
    );
    const currentEmissions = getNumericValue(
      (currentData as any).emissions || currentData.e
    );

    if (historicalData.length === 0) {
      return {
        avgCO2: currentCO2,
        maxCO2: currentCO2,
        minCO2: currentCO2,
        avgHumidity: currentHumidity,
        totalCredits: currentCredits,
        totalEmissions: currentEmissions,
        dataPoints: 1,
        lastUpdate: new Date(),
      };
    }

    const co2Values = historicalData
      .map(d => d.co2)
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));
    const humidityValues = historicalData
      .map(d => d.humidity)
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));
    const creditsValues = historicalData
      .map(d => d.credits)
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));
    const emissionsValues = historicalData
      .map(d => d.emissions)
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));

    return {
      avgCO2:
        co2Values.length > 0
          ? co2Values.reduce((a: number, b: number) => a + b, 0) /
            co2Values.length
          : currentCO2,
      maxCO2: co2Values.length > 0 ? Math.max(...co2Values) : currentCO2,
      minCO2: co2Values.length > 0 ? Math.min(...co2Values) : currentCO2,
      avgHumidity:
        humidityValues.length > 0
          ? humidityValues.reduce((a: number, b: number) => a + b, 0) /
            humidityValues.length
          : currentHumidity,
      totalCredits:
        creditsValues.length > 0
          ? creditsValues.reduce((a: number, b: number) => a + b, 0)
          : currentCredits,
      totalEmissions:
        emissionsValues.length > 0
          ? emissionsValues.reduce((a: number, b: number) => a + b, 0)
          : currentEmissions,
      dataPoints: historicalData.length,
      lastUpdate: new Date(
        Math.max(...historicalData.map(d => new Date(d._time).getTime()))
      ),
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

  const getCO2LevelColor = (
    co2: number,
    deviceType: 'SEQUESTER' | 'EMITTER'
  ) => {
    if (deviceType === 'SEQUESTER') {
      // For sequester devices, lower CO2 is better
      if (co2 < 400) return 'text-green-600';
      if (co2 < 600) return 'text-yellow-600';
      if (co2 < 800) return 'text-orange-600';
      return 'text-red-600';
    } else {
      // For emitter devices, higher CO2 indicates more emissions
      if (co2 < 400) return 'text-green-600';
      if (co2 < 800) return 'text-yellow-600';
      if (co2 < 1200) return 'text-orange-600';
      return 'text-red-600';
    }
  };

  const getCO2LevelDescription = (
    co2: number,
    deviceType: 'SEQUESTER' | 'EMITTER'
  ) => {
    if (deviceType === 'SEQUESTER') {
      if (co2 < 400) return 'Excellent Sequestration';
      if (co2 < 600) return 'Good Sequestration';
      if (co2 < 800) return 'Moderate Sequestration';
      return 'Poor Sequestration';
    } else {
      if (co2 < 400) return 'Low Emissions';
      if (co2 < 800) return 'Moderate Emissions';
      if (co2 < 1200) return 'High Emissions';
      return 'Critical Emissions';
    }
  };

  const renderDeviceCard = (deviceId: string, metrics: DeviceMetrics) => {
    const isSelected = selectedDevice === deviceId;
    const { deviceType, currentData, metrics: deviceMetrics } = metrics;

    // Helper function to safely get numeric value with fallback
    const getNumericValue = (value: any, fallback: number = 0): number => {
      if (typeof value === 'number' && !isNaN(value)) return value;
      return fallback;
    };

    // Extract values from current data, handling both MQTT and InfluxDB formats
    const currentCO2 = getNumericValue(
      (currentData as any).co2 || currentData.c || currentData.avg_c
    );
    const currentHumidity = getNumericValue(
      (currentData as any).humidity || currentData.h || currentData.avg_h
    );
    const currentCredits = getNumericValue(
      (currentData as any).credits || currentData.cr
    );
    const currentEmissions = getNumericValue(
      (currentData as any).emissions || currentData.e
    );

    return (
      <Card
        key={deviceId}
        className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
        }`}
        onClick={() => setSelectedDevice(isSelected ? null : deviceId)}
      >
        {/* Device Header */}
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-3'>
            <div
              className={`p-2 rounded-lg ${deviceType === 'SEQUESTER' ? 'bg-green-100' : 'bg-orange-100'}`}
            >
              {getDeviceTypeIcon(deviceType)}
            </div>
            <div>
              <h3 className='font-semibold text-gray-900 text-lg'>
                {deviceId}
              </h3>
              <div className='flex items-center space-x-2 text-sm text-gray-600'>
                <Badge className={getDeviceTypeColor(deviceType)}>
                  {deviceType === 'SEQUESTER' ? '🌱 Creator' : '🔥 Burner'}
                </Badge>
                {currentData.walletAddress && (
                  <span className='font-mono text-xs'>
                    💳 {currentData.walletAddress.slice(0, 4)}...
                    {currentData.walletAddress.slice(-3)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className='text-right text-sm text-gray-500'>
            <div>
              Last Update: {deviceMetrics.lastUpdate.toLocaleTimeString()}
            </div>
            <div>{deviceMetrics.dataPoints} data points</div>
          </div>
        </div>

        {/* Current Metrics */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
          <div className='text-center'>
            <div className='text-sm text-gray-600 mb-1'>Current CO₂</div>
            <div
              className={`text-xl font-bold ${getCO2LevelColor(currentCO2, deviceType)}`}
            >
              {currentCO2} ppm
            </div>
            <div className='text-xs text-gray-500'>
              {getCO2LevelDescription(currentCO2, deviceType)}
            </div>
          </div>

          <div className='text-center'>
            <div className='text-sm text-gray-600 mb-1'>Humidity</div>
            <div className='text-xl font-bold text-gray-900'>
              {currentHumidity}%
            </div>
          </div>

          <div className='text-center'>
            <div className='text-sm text-gray-600 mb-1'>Credits</div>
            <div
              className={`text-xl font-bold ${deviceType === 'SEQUESTER' ? 'text-green-600' : 'text-orange-600'}`}
            >
              {currentCredits.toFixed(1)}
            </div>
            <div className='text-xs text-gray-500'>
              {deviceType === 'SEQUESTER' ? 'Generated' : 'Available'}
            </div>
          </div>

          <div className='text-center'>
            <div className='text-sm text-gray-600 mb-1'>Emissions</div>
            <div className='text-xl font-bold text-red-600'>
              {currentEmissions.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Historical Metrics */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200'>
          <div className='text-center'>
            <div className='text-sm text-gray-600 mb-1'>Avg CO₂</div>
            <div
              className={`text-lg font-semibold ${getCO2LevelColor(deviceMetrics.avgCO2, deviceType)}`}
            >
              {deviceMetrics.avgCO2.toFixed(1)} ppm
            </div>
          </div>

          <div className='text-center'>
            <div className='text-sm text-gray-600 mb-1'>CO₂ Range</div>
            <div className='text-lg font-semibold text-gray-900'>
              {deviceMetrics.minCO2.toFixed(0)}-
              {deviceMetrics.maxCO2.toFixed(0)}
            </div>
          </div>

          <div className='text-center'>
            <div className='text-sm text-gray-600 mb-1'>Total Credits</div>
            <div
              className={`text-lg font-semibold ${deviceType === 'SEQUESTER' ? 'text-green-600' : 'text-orange-600'}`}
            >
              {deviceMetrics.totalCredits.toFixed(1)}
            </div>
          </div>

          <div className='text-center'>
            <div className='text-sm text-gray-600 mb-1'>Total Emissions</div>
            <div className='text-lg font-semibold text-red-600'>
              {deviceMetrics.totalEmissions.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Device Status Indicators */}
        <div className='mt-4 pt-4 border-t border-gray-200'>
          <div className='flex items-center justify-between text-sm'>
            <div className='flex items-center space-x-4'>
              <div className='flex items-center space-x-1'>
                <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                <span className='text-gray-600'>Online</span>
              </div>
              {currentData.location && (
                <div className='flex items-center space-x-1 text-gray-600'>
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                    />
                  </svg>
                  <span>{currentData.location}</span>
                </div>
              )}
            </div>
            <div className='text-gray-500'>
              {deviceType === 'SEQUESTER'
                ? '🌱 Carbon Sequestration'
                : '🔥 Carbon Emission'}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const renderOverview = () => (
    <div className='space-y-6'>
      {/* System Overview */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card className='p-4'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-600'>
              {deviceCount.sequesters + deviceCount.emitters}
            </div>
            <div className='text-sm text-gray-600'>Total Devices</div>
          </div>
        </Card>
        <Card className='p-4'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-600'>
              {deviceCount.sequesters}
            </div>
            <div className='text-sm text-gray-600'>🌱 Creators</div>
          </div>
        </Card>
        <Card className='p-4'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-orange-600'>
              {deviceCount.emitters}
            </div>
            <div className='text-sm text-gray-600'>🔥 Burners</div>
          </div>
        </Card>
        <Card className='p-4'>
          <div className='text-center'>
            <div
              className={`text-2xl font-bold ${connectionState.isConnected ? 'text-green-600' : 'text-red-600'}`}
            >
              {connectionState.isConnected ? '🟢' : '🔴'}
            </div>
            <div className='text-sm text-gray-600'>MQTT Status</div>
          </div>
        </Card>
      </div>

      {/* Device Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {Array.from(deviceMetrics.entries()).map(([deviceId, metrics]) =>
          renderDeviceCard(deviceId, metrics)
        )}
      </div>

      {/* No devices message */}
      {deviceMetrics.size === 0 && (
        <Card className='p-8 text-center'>
          <div className='mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
            <svg
              className='w-8 h-8 text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z'
              />
            </svg>
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            No IoT Devices Connected
          </h3>
          <p className='text-gray-600 mb-4'>
            Start your burner and creator devices to see real-time carbon credit
            data.
          </p>
          <div className='text-sm text-gray-500'>
            <p>Make sure your devices are:</p>
            <ul className='list-disc list-inside mt-2 space-y-1'>
              <li>Connected to WiFi and MQTT broker</li>
              <li>Running the carbon credit simulator</li>
              <li>Sending data to InfluxDB</li>
              <li>Properly configured with API keys</li>
            </ul>
          </div>
        </Card>
      )}
    </div>
  );

  const renderDetailed = () => {
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
              Click on a device card to view detailed information.
            </p>
          </div>
        </Card>
      );
    }

    const deviceData = deviceMetrics.get(selectedDevice)!;
    const {
      deviceType,
      currentData,
      historicalData,
      metrics: deviceMetricsData,
    } = deviceData;

    // Helper function to safely get numeric value with fallback
    const getNumericValue = (value: any, fallback: number = 0): number => {
      if (typeof value === 'number' && !isNaN(value)) return value;
      return fallback;
    };

    // Extract values from current data, handling both MQTT and InfluxDB formats
    const currentCO2 = getNumericValue(
      (currentData as any).co2 || currentData.c || currentData.avg_c
    );
    const currentHumidity = getNumericValue(
      (currentData as any).humidity || currentData.h || currentData.avg_h
    );
    const currentCredits = getNumericValue(
      (currentData as any).credits || currentData.cr
    );
    const currentEmissions = getNumericValue(
      (currentData as any).emissions || currentData.e
    );

    return (
      <div className='space-y-6'>
        {/* Device Header */}
        <Card className='p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div
                className={`p-3 rounded-lg ${deviceType === 'SEQUESTER' ? 'bg-green-100' : 'bg-orange-100'}`}
              >
                {getDeviceTypeIcon(deviceType)}
              </div>
              <div>
                <h2 className='text-xl font-bold text-gray-900'>
                  {selectedDevice}
                </h2>
                <div className='flex items-center space-x-2'>
                  <Badge className={getDeviceTypeColor(deviceType)}>
                    {deviceType === 'SEQUESTER'
                      ? '🌱 Carbon Creator'
                      : '🔥 Carbon Burner'}
                  </Badge>
                  {currentData.walletAddress && (
                    <Badge className='bg-blue-100 text-blue-800'>
                      💳 {currentData.walletAddress.slice(0, 6)}...
                      {currentData.walletAddress.slice(-4)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button onClick={() => setSelectedDevice(null)} variant='outline'>
              Back to Overview
            </Button>
          </div>
        </Card>

        {/* Current Status */}
        <Card className='p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Current Status
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center p-4 bg-gray-50 rounded-lg'>
              <div className='text-sm text-gray-600 mb-1'>CO₂ Level</div>
              <div
                className={`text-2xl font-bold ${getCO2LevelColor(currentCO2, deviceType)}`}
              >
                {currentCO2} ppm
              </div>
              <div className='text-xs text-gray-500 mt-1'>
                {getCO2LevelDescription(currentCO2, deviceType)}
              </div>
            </div>
            <div className='text-center p-4 bg-gray-50 rounded-lg'>
              <div className='text-sm text-gray-600 mb-1'>Humidity</div>
              <div className='text-2xl font-bold text-gray-900'>
                {currentHumidity}%
              </div>
            </div>
            <div className='text-center p-4 bg-gray-50 rounded-lg'>
              <div className='text-sm text-gray-600 mb-1'>Credits</div>
              <div
                className={`text-2xl font-bold ${deviceType === 'SEQUESTER' ? 'text-green-600' : 'text-orange-600'}`}
              >
                {currentCredits.toFixed(1)}
              </div>
              <div className='text-xs text-gray-500 mt-1'>
                {deviceType === 'SEQUESTER' ? 'Generated' : 'Available'}
              </div>
            </div>
            <div className='text-center p-4 bg-gray-50 rounded-lg'>
              <div className='text-sm text-gray-600 mb-1'>Emissions</div>
              <div className='text-2xl font-bold text-red-600'>
                {currentEmissions.toFixed(1)}
              </div>
            </div>
          </div>
        </Card>

        {/* Historical Data */}
        <Card className='p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Historical Data ({timeRange})
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center p-4 bg-blue-50 rounded-lg'>
              <div className='text-sm text-gray-600 mb-1'>Average CO₂</div>
              <div
                className={`text-xl font-bold ${getCO2LevelColor(deviceMetricsData.avgCO2, deviceType)}`}
              >
                {deviceMetricsData.avgCO2.toFixed(1)} ppm
              </div>
            </div>
            <div className='text-center p-4 bg-blue-50 rounded-lg'>
              <div className='text-sm text-gray-600 mb-1'>CO₂ Range</div>
              <div className='text-xl font-bold text-gray-900'>
                {deviceMetricsData.minCO2.toFixed(0)}-
                {deviceMetricsData.maxCO2.toFixed(0)}
              </div>
            </div>
            <div className='text-center p-4 bg-blue-50 rounded-lg'>
              <div className='text-sm text-gray-600 mb-1'>Total Credits</div>
              <div
                className={`text-xl font-bold ${deviceType === 'SEQUESTER' ? 'text-green-600' : 'text-orange-600'}`}
              >
                {deviceMetricsData.totalCredits.toFixed(1)}
              </div>
            </div>
            <div className='text-center p-4 bg-blue-50 rounded-lg'>
              <div className='text-sm text-gray-600 mb-1'>Data Points</div>
              <div className='text-xl font-bold text-gray-900'>
                {deviceMetricsData.dataPoints}
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Data Points */}
        <Card className='p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Recent Data Points
          </h3>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Timestamp
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    CO₂ (ppm)
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Humidity (%)
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Credits
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Emissions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {historicalData
                  .slice(-10)
                  .reverse()
                  .map((point: any, index: number) => (
                    <tr key={index}>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {new Date(point._time).toLocaleString()}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm'>
                        <span
                          className={`font-medium ${getCO2LevelColor(point.co2 || 0, deviceType)}`}
                        >
                          {point.co2?.toFixed(1) || 'N/A'}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {point.humidity?.toFixed(1) || 'N/A'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm'>
                        <span
                          className={`font-medium ${deviceType === 'SEQUESTER' ? 'text-green-600' : 'text-orange-600'}`}
                        >
                          {point.credits?.toFixed(1) || 'N/A'}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium'>
                        {point.emissions?.toFixed(1) || 'N/A'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const renderAnalytics = () => (
    <div className='space-y-6'>
      {/* System Analytics */}
      <Card className='p-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          System Analytics
        </h3>
        {stats ? (
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center p-4 bg-blue-50 rounded-lg'>
              <div className='text-sm text-gray-600 mb-1'>
                Total Data Points
              </div>
              <div className='text-2xl font-bold text-blue-600'>
                {stats.totalPoints}
              </div>
            </div>
            <div className='text-center p-4 bg-green-50 rounded-lg'>
              <div className='text-sm text-gray-600 mb-1'>Active Devices</div>
              <div className='text-2xl font-bold text-green-600'>
                {stats.deviceCount}
              </div>
            </div>
            <div className='text-center p-4 bg-orange-50 rounded-lg'>
              <div className='text-sm text-gray-600 mb-1'>Avg CO₂</div>
              <div className='text-2xl font-bold text-orange-600'>
                {stats.avgCO2.toFixed(1)} ppm
              </div>
            </div>
            <div className='text-center p-4 bg-purple-50 rounded-lg'>
              <div className='text-sm text-gray-600 mb-1'>Avg Humidity</div>
              <div className='text-2xl font-bold text-purple-600'>
                {stats.avgHumidity.toFixed(1)}%
              </div>
            </div>
          </div>
        ) : (
          <div className='text-center py-8 text-gray-500'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
            <p>Loading analytics data...</p>
          </div>
        )}
      </Card>

      {/* Device Performance Comparison */}
      <Card className='p-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          Device Performance
        </h3>
        <div className='space-y-4'>
          {Array.from(deviceMetrics.entries()).map(([deviceId, metrics]) => (
            <div
              key={deviceId}
              className='p-4 border border-gray-200 rounded-lg'
            >
              <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center space-x-2'>
                  <Badge className={getDeviceTypeColor(metrics.deviceType)}>
                    {metrics.deviceType === 'SEQUESTER'
                      ? '🌱 Creator'
                      : '🔥 Burner'}
                  </Badge>
                  <span className='font-medium'>{deviceId}</span>
                </div>
                <span className='text-sm text-gray-500'>
                  {metrics.metrics.dataPoints} data points
                </span>
              </div>
              <div className='grid grid-cols-4 gap-4 text-sm'>
                <div>
                  <div className='text-gray-600'>Avg CO₂</div>
                  <div
                    className={`font-medium ${getCO2LevelColor(metrics.metrics.avgCO2, metrics.deviceType)}`}
                  >
                    {metrics.metrics.avgCO2.toFixed(1)} ppm
                  </div>
                </div>
                <div>
                  <div className='text-gray-600'>Total Credits</div>
                  <div
                    className={`font-medium ${metrics.deviceType === 'SEQUESTER' ? 'text-green-600' : 'text-orange-600'}`}
                  >
                    {metrics.metrics.totalCredits.toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className='text-gray-600'>Total Emissions</div>
                  <div className='font-medium text-red-600'>
                    {metrics.metrics.totalEmissions.toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className='text-gray-600'>Last Update</div>
                  <div className='font-medium text-gray-900'>
                    {metrics.metrics.lastUpdate.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>
            IoT Device Dashboard
          </h2>
          <p className='text-gray-600'>
            Real-time monitoring of burner and creator devices via MQTT and
            InfluxDB
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
              View Mode
            </label>
            <div className='flex space-x-2'>
              <Button
                onClick={() => setViewMode('overview')}
                variant={viewMode === 'overview' ? 'primary' : 'outline'}
                size='sm'
              >
                Overview
              </Button>
              <Button
                onClick={() => setViewMode('detailed')}
                variant={viewMode === 'detailed' ? 'primary' : 'outline'}
                size='sm'
              >
                Detailed
              </Button>
              <Button
                onClick={() => setViewMode('analytics')}
                variant={viewMode === 'analytics' ? 'primary' : 'outline'}
                size='sm'
              >
                Analytics
              </Button>
            </div>
          </div>

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
        </div>
      </Card>

      {/* Content */}
      {viewMode === 'overview' && renderOverview()}
      {viewMode === 'detailed' && renderDetailed()}
      {viewMode === 'analytics' && renderAnalytics()}
    </div>
  );
}
