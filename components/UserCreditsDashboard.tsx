'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CreditAccumulation } from '@/components/CreditAccumulation';
import { useAccount } from 'wagmi';

interface UserCredit {
  walletAddress: string;
  username: string;
  totalCredits: number;
  totalCO2Sequestered: number;
  totalCO2Emitted: number;
  sequesterDevices: number;
  emitterDevices: number;
  lastActivity: number;
  netCO2Impact: number;
  creditsPerHour: number;
  averageCO2PerDevice: number;
}

interface UserCreditsData {
  timestamp: string;
  totalUsers: number;
  totalCreditsGenerated: number;
  totalCO2Sequestered: number;
  totalCO2Emitted: number;
  users: UserCredit[];
  topPerformers: UserCredit[];
  recentActivity: UserCredit[];
}

export function UserCreditsDashboard() {
  const [data, setData] = useState<UserCreditsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { address } = useAccount();

  // Fetch user credits data
  const fetchUserCredits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/aggregated/user-credits');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch user credits');
      }
    } catch (err) {
      setError(
        'Network error: ' +
          (err instanceof Error ? err.message : 'Unknown error')
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchUserCredits();
  }, []);

  // Set up interval to fetch data every 10 minutes (reduced frequency due to caching)
  useEffect(() => {
    const interval = setInterval(
      () => {
        fetchUserCredits();
      },
      10 * 60 * 1000
    ); // 10 minutes (reduced from 5 minutes)

    return () => clearInterval(interval);
  }, []);

  // Format wallet address for display
  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Format credits
  const formatCredits = (credits: number) => {
    return credits.toFixed(2);
  };

  // Format CO2
  const formatCO2 = (co2: number) => {
    return co2.toFixed(1);
  };

  if (loading && !data) {
    return (
      <div className='min-h-screen bg-gray-50 p-8'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto'></div>
            <p className='mt-4 text-gray-600'>Loading user credits...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 p-8'>
        <div className='max-w-7xl mx-auto'>
          <Card className='p-6 bg-red-50 border-red-200'>
            <div className='flex items-center space-x-2'>
              <svg
                className='w-6 h-6 text-red-500'
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
            <p className='text-red-700 mt-2'>{error}</p>
            <button
              onClick={fetchUserCredits}
              className='mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
            >
              Retry
            </button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='flex justify-between items-center mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              User Credits Dashboard
            </h1>
            <p className='text-gray-600'>
              Real-time CO2 credit tracking for all users
            </p>
          </div>
          <div className='text-right'>
            <div className='text-sm text-gray-500'>
              Last updated:{' '}
              {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
            </div>
            <div className='text-sm text-gray-500'>
              Auto-refresh: Every 5 minutes
            </div>
          </div>
        </div>

        {/* Personal Credit Accumulation - Only show if user is connected */}
        {address && (
          <div className='mb-8'>
            <CreditAccumulation walletAddress={address} />
          </div>
        )}

        {/* Summary Stats */}
        <div className='grid grid-cols-1 md:grid-cols-5 gap-6 mb-8'>
          <Card className='p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-green-600'>
                  Total Users
                </p>
                <p className='text-2xl font-bold text-green-800'>
                  {data?.totalUsers || 0}
                </p>
              </div>
              <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                <span className='text-2xl'>👥</span>
              </div>
            </div>
          </Card>

          <Card className='p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-blue-600'>
                  Total Credits
                </p>
                <p className='text-2xl font-bold text-blue-800'>
                  {formatCredits(data?.totalCreditsGenerated || 0)}
                </p>
              </div>
              <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                <span className='text-2xl'>🏆</span>
              </div>
            </div>
          </Card>

          <Card className='p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-emerald-600'>
                  CO₂ Sequestered
                </p>
                <p className='text-2xl font-bold text-emerald-800'>
                  {formatCO2(data?.totalCO2Sequestered || 0)}
                </p>
                <p className='text-xs text-emerald-600'>ppm</p>
              </div>
              <div className='w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center'>
                <span className='text-2xl'>🌱</span>
              </div>
            </div>
          </Card>

          <Card className='p-6 bg-gradient-to-br from-red-50 to-orange-50 border-red-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-red-600'>
                  CO₂ Burned/Emitted
                </p>
                <p className='text-2xl font-bold text-red-800'>
                  {formatCO2(data?.totalCO2Emitted || 0)}
                </p>
                <p className='text-xs text-red-600'>ppm</p>
              </div>
              <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
                <span className='text-2xl'>🔥</span>
              </div>
            </div>
          </Card>

          <Card className='p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-purple-600'>
                  Net Impact
                </p>
                <p className='text-2xl font-bold text-purple-800'>
                  {formatCO2(
                    (data?.totalCO2Sequestered || 0) -
                      (data?.totalCO2Emitted || 0)
                  )}
                </p>
                <p className='text-xs text-purple-600'>ppm</p>
              </div>
              <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center'>
                <span className='text-2xl'>⚖️</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Top Performers */}
        <Card className='p-6 mb-8'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            🏆 Top Credit Earners
          </h2>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-gray-200'>
                  <th className='text-left py-3 px-4 font-medium text-gray-600'>
                    Rank
                  </th>
                  <th className='text-left py-3 px-4 font-medium text-gray-600'>
                    User
                  </th>
                  <th className='text-right py-3 px-4 font-medium text-gray-600'>
                    Total Credits
                  </th>
                  <th className='text-right py-3 px-4 font-medium text-gray-600'>
                    CO₂ Sequestered
                  </th>
                  <th className='text-right py-3 px-4 font-medium text-gray-600'>
                    CO₂ Burned/Emitted
                  </th>
                  <th className='text-right py-3 px-4 font-medium text-gray-600'>
                    Net Impact
                  </th>
                  <th className='text-right py-3 px-4 font-medium text-gray-600'>
                    Devices
                  </th>
                  <th className='text-right py-3 px-4 font-medium text-gray-600'>
                    Last Activity
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.topPerformers.map((user, index) => (
                  <tr
                    key={user.walletAddress}
                    className='border-b border-gray-100 hover:bg-gray-50'
                  >
                    <td className='py-3 px-4'>
                      <Badge
                        className={
                          index < 3
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        #{index + 1}
                      </Badge>
                    </td>
                    <td className='py-3 px-4'>
                      <div>
                        <div className='font-medium text-gray-900'>
                          {user.username}
                        </div>
                        <div className='text-sm text-gray-500 font-mono'>
                          {formatWalletAddress(user.walletAddress)}
                        </div>
                      </div>
                    </td>
                    <td className='py-3 px-4 text-right'>
                      <div className='font-semibold text-green-600'>
                        {formatCredits(user.totalCredits)}
                      </div>
                      <div className='text-xs text-gray-500'>
                        {formatCredits(user.creditsPerHour)}/hr
                      </div>
                    </td>
                    <td className='py-3 px-4 text-right'>
                      <div className='font-medium text-emerald-600'>
                        {formatCO2(user.totalCO2Sequestered)}
                      </div>
                      <div className='text-xs text-gray-500'>ppm</div>
                    </td>
                    <td className='py-3 px-4 text-right'>
                      <div className='font-medium text-red-600'>
                        {formatCO2(user.totalCO2Emitted)}
                      </div>
                      <div className='text-xs text-gray-500'>ppm</div>
                    </td>
                    <td className='py-3 px-4 text-right'>
                      <div
                        className={`font-medium ${user.netCO2Impact >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                      >
                        {formatCO2(user.netCO2Impact)}
                      </div>
                      <div className='text-xs text-gray-500'>ppm</div>
                    </td>
                    <td className='py-3 px-4 text-right'>
                      <div className='flex justify-end space-x-2'>
                        <Badge className='bg-green-100 text-green-800'>
                          {user.sequesterDevices} S
                        </Badge>
                        <Badge className='bg-red-100 text-red-800'>
                          {user.emitterDevices} E
                        </Badge>
                      </div>
                    </td>
                    <td className='py-3 px-4 text-right text-sm text-gray-500'>
                      {formatTimestamp(user.lastActivity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Emitter Statistics */}
        <Card className='p-6 mb-8'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            🔥 Emitter Statistics
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='bg-red-50 rounded-lg p-4 border border-red-200'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-red-600'>
                    Total CO₂ Burned
                  </p>
                  <p className='text-2xl font-bold text-red-800'>
                    {formatCO2(data?.totalCO2Emitted || 0)}
                  </p>
                  <p className='text-xs text-red-600'>ppm by all emitters</p>
                </div>
                <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
                  <span className='text-2xl'>🔥</span>
                </div>
              </div>
            </div>

            <div className='bg-orange-50 rounded-lg p-4 border border-orange-200'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-orange-600'>
                    Active Emitters
                  </p>
                  <p className='text-2xl font-bold text-orange-800'>
                    {data?.users.filter((user: any) => user.emitterDevices > 0)
                      .length || 0}
                  </p>
                  <p className='text-xs text-orange-600'>
                    users with emitter devices
                  </p>
                </div>
                <div className='w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center'>
                  <span className='text-2xl'>🏭</span>
                </div>
              </div>
            </div>

            <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    Avg CO₂ per Emitter
                  </p>
                  <p className='text-2xl font-bold text-gray-800'>
                    {data?.users.filter((user: any) => user.emitterDevices > 0)
                      .length > 0
                      ? formatCO2(
                          (data?.totalCO2Emitted || 0) /
                            data.users.filter(
                              (user: any) => user.emitterDevices > 0
                            ).length
                        )
                      : '0'}
                  </p>
                  <p className='text-xs text-gray-600'>ppm per emitter user</p>
                </div>
                <div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center'>
                  <span className='text-2xl'>📊</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className='p-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            ⚡ Recent Activity (Last Hour)
          </h2>
          {data?.recentActivity.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              <span className='text-4xl mb-4 block'>😴</span>
              <p>No recent activity</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {data?.recentActivity.map(user => (
                <div
                  key={user.walletAddress}
                  className='bg-gray-50 rounded-lg p-4'
                >
                  <div className='flex items-center justify-between mb-2'>
                    <div className='font-medium text-gray-900'>
                      {user.username}
                    </div>
                    <Badge className='bg-green-100 text-green-800'>
                      {formatCredits(user.totalCredits)} credits
                    </Badge>
                  </div>
                  <div className='text-sm text-gray-600 space-y-1'>
                    <div>Wallet: {formatWalletAddress(user.walletAddress)}</div>
                    <div className='flex justify-between'>
                      <span className='text-emerald-600'>
                        Sequestered: {formatCO2(user.totalCO2Sequestered)}
                      </span>
                      <span className='text-red-600'>
                        Burned: {formatCO2(user.totalCO2Emitted)}
                      </span>
                    </div>
                    <div>
                      Net Impact:{' '}
                      <span
                        className={`font-medium ${user.netCO2Impact >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                      >
                        {formatCO2(user.netCO2Impact)} ppm
                      </span>
                    </div>
                    <div>Last seen: {formatTimestamp(user.lastActivity)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Auto-refresh indicator */}
        <div className='mt-8 text-center'>
          <div className='inline-flex items-center space-x-2 text-sm text-gray-500'>
            <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
            <span>Auto-refreshing every 5 minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
