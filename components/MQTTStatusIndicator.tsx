'use client';

import React from 'react';
import { useMQTT } from '@/lib/mqtt/context';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface MQTTStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function MQTTStatusIndicator({
  className,
  showDetails = false,
}: MQTTStatusIndicatorProps) {
  const { connectionState, connect, disconnect, getDeviceCount } = useMQTT();
  const deviceCount = getDeviceCount();

  const getStatusColor = () => {
    if (connectionState.isConnected) return 'bg-green-500';
    if (connectionState.isConnecting) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (connectionState.isConnected) return 'Connected';
    if (connectionState.isConnecting) return 'Connecting...';
    return 'Disconnected';
  };

  const getStatusIcon = () => {
    if (connectionState.isConnected) {
      return (
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
            d='M5 13l4 4L19 7'
          />
        </svg>
      );
    }
    if (connectionState.isConnecting) {
      return (
        <svg
          className='w-4 h-4 animate-spin'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
          />
        </svg>
      );
    }
    return (
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
          d='M6 18L18 6M6 6l12 12'
        />
      </svg>
    );
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <span className='text-sm text-gray-600'>{getStatusText()}</span>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}
    >
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center space-x-3'>
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          <div>
            <h3 className='font-semibold text-gray-900'>MQTT Status</h3>
            <p className='text-sm text-gray-600'>{getStatusText()}</p>
          </div>
        </div>

        <div className='flex items-center space-x-2'>
          {connectionState.isConnected ? (
            <Button
              onClick={disconnect}
              variant='outline'
              size='sm'
              leftIcon={
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
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              }
            >
              Disconnect
            </Button>
          ) : (
            <Button
              onClick={connect}
              variant='primary'
              size='sm'
              disabled={connectionState.isConnecting}
              leftIcon={getStatusIcon()}
            >
              {connectionState.isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          )}
        </div>
      </div>

      {/* Device Count */}
      <div className='grid grid-cols-2 gap-4 mb-3'>
        <div className='text-center p-3 bg-green-50 rounded-lg'>
          <div className='text-2xl font-bold text-green-600'>
            {deviceCount.sequesters}
          </div>
          <div className='text-sm text-green-700'>Sequester Devices</div>
        </div>
        <div className='text-center p-3 bg-orange-50 rounded-lg'>
          <div className='text-2xl font-bold text-orange-600'>
            {deviceCount.emitters}
          </div>
          <div className='text-sm text-orange-700'>Emitter Devices</div>
        </div>
      </div>

      {/* Connection Details */}
      {connectionState.isConnected && connectionState.lastConnected && (
        <div className='text-sm text-gray-600'>
          <div className='flex justify-between'>
            <span>Last Connected:</span>
            <span>
              {new Date(connectionState.lastConnected).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {connectionState.error && (
        <div className='mt-3 p-3 bg-red-50 border border-red-200 rounded-lg'>
          <div className='flex items-center space-x-2'>
            <svg
              className='w-4 h-4 text-red-500'
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
            <span className='text-sm text-red-800 font-medium'>
              Connection Error
            </span>
          </div>
          <p className='text-sm text-red-700 mt-1'>{connectionState.error}</p>
        </div>
      )}

      {/* Reconnect Attempts */}
      {connectionState.reconnectAttempts > 0 && (
        <div className='mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
          <div className='flex items-center space-x-2'>
            <svg
              className='w-4 h-4 text-yellow-500'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
              />
            </svg>
            <span className='text-sm text-yellow-800 font-medium'>
              Reconnecting...
            </span>
          </div>
          <p className='text-sm text-yellow-700 mt-1'>
            Attempt {connectionState.reconnectAttempts} of automatic
            reconnection
          </p>
        </div>
      )}
    </div>
  );
}

// Compact version for navigation bars
export function MQTTStatusBadge({ className }: { className?: string }) {
  const { connectionState, getDeviceCount } = useMQTT();
  const deviceCount = getDeviceCount();
  const totalDevices = deviceCount.sequesters + deviceCount.emitters;

  return (
    <Badge
      className={`${className} ${
        connectionState.isConnected
          ? 'bg-green-100 text-green-800 border-green-200'
          : 'bg-red-100 text-red-800 border-red-200'
      }`}
    >
      <div className='flex items-center space-x-1'>
        <div
          className={`w-2 h-2 rounded-full ${
            connectionState.isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span>MQTT</span>
        {totalDevices > 0 && <span className='ml-1'>({totalDevices})</span>}
      </div>
    </Badge>
  );
}
