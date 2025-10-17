'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ChartDataPoint {
  timestamp: number;
  value: number;
  label: string;
}

interface RealTimeChartProps {
  data: ChartDataPoint[];
  title: string;
  unit: string;
  color: string;
  maxPoints?: number;
  className?: string;
}

export function RealTimeChart({
  data,
  title,
  unit,
  color,
  maxPoints = 50,
  className,
}: RealTimeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    if (data.length === 0) return;

    // Get recent data points
    const recentData = data.slice(-maxPoints);
    if (recentData.length < 2) return;

    // Calculate min/max values
    const values = recentData.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    // Calculate time range
    const timestamps = recentData.map(d => d.timestamp);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const timeRange = maxTime - minTime || 1;

    // Chart dimensions
    const padding = 40;
    const chartWidth = dimensions.width - 2 * padding;
    const chartHeight = dimensions.height - 2 * padding;

    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (let i = 0; i <= 5; i++) {
      const x = padding + (chartWidth * i) / 5;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + chartHeight);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    // Draw data line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    recentData.forEach((point, index) => {
      const x =
        padding + (chartWidth * (point.timestamp - minTime)) / timeRange;
      const y =
        padding +
        chartHeight -
        (chartHeight * (point.value - minValue)) / valueRange;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw data points
    ctx.fillStyle = color;
    recentData.forEach(point => {
      const x =
        padding + (chartWidth * (point.timestamp - minTime)) / timeRange;
      const y =
        padding +
        chartHeight -
        (chartHeight * (point.value - minValue)) / valueRange;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';

    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (valueRange * i) / 5;
      const y = padding + chartHeight - (chartHeight * i) / 5;
      ctx.fillText(value.toFixed(1), padding - 10, y + 4);
    }

    // X-axis labels (time)
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const time = minTime + (timeRange * i) / 5;
      const x = padding + (chartWidth * i) / 5;
      const date = new Date(time);
      ctx.fillText(date.toLocaleTimeString(), x, padding + chartHeight + 20);
    }

    // Unit label
    ctx.textAlign = 'left';
    ctx.fillText(unit, padding, padding - 10);
  }, [data, dimensions, color, maxPoints]);

  const currentValue = data.length > 0 ? data[data.length - 1].value : 0;
  const previousValue =
    data.length > 1 ? data[data.length - 2].value : currentValue;
  const trend = currentValue - previousValue;

  return (
    <Card className={`p-4 ${className}`}>
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h3 className='font-semibold text-gray-900'>{title}</h3>
          <div className='flex items-center space-x-2'>
            <span className='text-2xl font-bold' style={{ color }}>
              {currentValue.toFixed(1)}
            </span>
            <span className='text-sm text-gray-600'>{unit}</span>
          </div>
        </div>
        <div className='text-right'>
          <div className='flex items-center space-x-1'>
            {trend > 0 ? (
              <Badge className='bg-red-100 text-red-800'>
                ↗ +{trend.toFixed(1)}
              </Badge>
            ) : trend < 0 ? (
              <Badge className='bg-green-100 text-green-800'>
                ↘ {trend.toFixed(1)}
              </Badge>
            ) : (
              <Badge className='bg-gray-100 text-gray-800'>→ 0.0</Badge>
            )}
          </div>
          <div className='text-xs text-gray-500 mt-1'>{data.length} points</div>
        </div>
      </div>

      <div className='relative'>
        <canvas
          ref={canvasRef}
          className='w-full h-48 border border-gray-200 rounded'
          style={{ minHeight: '192px' }}
        />
      </div>
    </Card>
  );
}

interface MultiMetricChartProps {
  deviceId: string;
  deviceType: 'SEQUESTER' | 'EMITTER';
  co2Data: ChartDataPoint[];
  humidityData: ChartDataPoint[];
  creditsData: ChartDataPoint[];
  emissionsData: ChartDataPoint[];
  className?: string;
}

export function MultiMetricChart({
  deviceId,
  deviceType,
  co2Data,
  humidityData,
  creditsData,
  emissionsData,
  className,
}: MultiMetricChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<
    'co2' | 'humidity' | 'credits' | 'emissions'
  >('co2');
  const [timeRange, setTimeRange] = useState('1h');

  const getMetricData = () => {
    switch (selectedMetric) {
      case 'co2':
        return {
          data: co2Data,
          title: 'CO₂ Levels',
          unit: 'ppm',
          color: deviceType === 'SEQUESTER' ? '#10b981' : '#f59e0b',
        };
      case 'humidity':
        return {
          data: humidityData,
          title: 'Humidity',
          unit: '%',
          color: '#3b82f6',
        };
      case 'credits':
        return {
          data: creditsData,
          title: 'Carbon Credits',
          unit: 'credits',
          color: deviceType === 'SEQUESTER' ? '#10b981' : '#f59e0b',
        };
      case 'emissions':
        return {
          data: emissionsData,
          title: 'Emissions',
          unit: 'units',
          color: '#ef4444',
        };
    }
  };

  const metricInfo = getMetricData();

  return (
    <Card className={`p-6 ${className}`}>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>{deviceId}</h3>
          <Badge
            className={
              deviceType === 'SEQUESTER'
                ? 'bg-green-100 text-green-800'
                : 'bg-orange-100 text-orange-800'
            }
          >
            {deviceType === 'SEQUESTER' ? '🌱 Creator' : '🔥 Burner'}
          </Badge>
        </div>

        <div className='flex items-center space-x-3'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Metric
            </label>
            <select
              value={selectedMetric}
              onChange={e => setSelectedMetric(e.target.value as any)}
              className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='co2'>CO₂ Levels</option>
              <option value='humidity'>Humidity</option>
              <option value='credits'>Credits</option>
              <option value='emissions'>Emissions</option>
            </select>
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
            </select>
          </div>
        </div>
      </div>

      <RealTimeChart
        data={metricInfo.data}
        title={metricInfo.title}
        unit={metricInfo.unit}
        color={metricInfo.color}
        maxPoints={50}
      />

      {/* Metric Summary */}
      <div className='mt-6 grid grid-cols-2 md:grid-cols-4 gap-4'>
        <div className='text-center p-3 bg-gray-50 rounded-lg'>
          <div className='text-sm text-gray-600 mb-1'>CO₂</div>
          <div
            className={`text-lg font-semibold ${deviceType === 'SEQUESTER' ? 'text-green-600' : 'text-orange-600'}`}
          >
            {co2Data.length > 0
              ? co2Data[co2Data.length - 1].value.toFixed(1)
              : 'N/A'}{' '}
            ppm
          </div>
        </div>
        <div className='text-center p-3 bg-gray-50 rounded-lg'>
          <div className='text-sm text-gray-600 mb-1'>Humidity</div>
          <div className='text-lg font-semibold text-blue-600'>
            {humidityData.length > 0
              ? humidityData[humidityData.length - 1].value.toFixed(1)
              : 'N/A'}
            %
          </div>
        </div>
        <div className='text-center p-3 bg-gray-50 rounded-lg'>
          <div className='text-sm text-gray-600 mb-1'>Credits</div>
          <div
            className={`text-lg font-semibold ${deviceType === 'SEQUESTER' ? 'text-green-600' : 'text-orange-600'}`}
          >
            {creditsData.length > 0
              ? creditsData[creditsData.length - 1].value.toFixed(1)
              : 'N/A'}
          </div>
        </div>
        <div className='text-center p-3 bg-gray-50 rounded-lg'>
          <div className='text-sm text-gray-600 mb-1'>Emissions</div>
          <div className='text-lg font-semibold text-red-600'>
            {emissionsData.length > 0
              ? emissionsData[emissionsData.length - 1].value.toFixed(1)
              : 'N/A'}
          </div>
        </div>
      </div>
    </Card>
  );
}
