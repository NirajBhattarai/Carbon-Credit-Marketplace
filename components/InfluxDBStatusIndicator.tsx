'use client';

import React from 'react';
import { useInfluxDB } from '@/lib/influxdb/context';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface InfluxDBStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function InfluxDBStatusIndicator({
  className,
  showDetails = false,
}: InfluxDBStatusIndicatorProps) {
  const { connectionState, isLoading, error, refreshData, getDeviceCount } =
    useInfluxDB();

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected':
        return 'InfluxDB Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  const getStatusIcon = () => {
    switch (connectionState) {
      case 'connected':
        return '🟢';
      case 'connecting':
        return '🟡';
      case 'error':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const deviceCount = getDeviceCount();

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Status Badge */}
      <Badge
        className={`${getStatusColor()} px-3 py-1 text-sm font-medium border`}
      >
        <span className='mr-2'>{getStatusIcon()}</span>
        {getStatusText()}
      </Badge>

      {/* Refresh Button */}
      <Button
        onClick={refreshData}
        disabled={isLoading}
        className='px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md disabled:opacity-50'
      >
        {isLoading ? '🔄' : '↻'} Refresh
      </Button>

      {/* Detailed Information */}
      {showDetails && (
        <div className='flex items-center space-x-4 text-sm text-gray-600'>
          {/* Device Count */}
          <div className='flex items-center space-x-2'>
            <span className='font-medium'>Devices:</span>
            <Badge className='bg-green-100 text-green-800'>
              {deviceCount.sequester} Sequester
            </Badge>
            <Badge className='bg-orange-100 text-orange-800'>
              {deviceCount.emitter} Emitter
            </Badge>
            <Badge className='bg-blue-100 text-blue-800'>
              {deviceCount.total} Total
            </Badge>
          </div>

          {/* Error Display */}
          {error && (
            <div
              className='text-red-600 text-xs max-w-xs truncate'
              title={error}
            >
              Error: {error}
            </div>
          )}
        </div>
      )}

      {/* Connection Details */}
      {showDetails && (
        <div className='text-xs text-gray-500'>
          <div>Data Source: InfluxDB</div>
          <div>Auto-refresh: 30s</div>
        </div>
      )}
    </div>
  );
}
