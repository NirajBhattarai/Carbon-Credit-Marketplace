'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LoadingPage } from '@/components/Loading';

interface User {
  id: string;
  walletAddress: string;
  username: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  bio?: string;
  avatar?: string;
  stats?: {
    itemsOwned: number;
    collections: number;
    volumeTraded: number;
    totalCredits: number;
    creditsUsed: number;
  };
}

interface ActivityItem {
  id: string;
  type:
    | 'device_registered'
    | 'credits_generated'
    | 'data_updated'
    | 'transaction';
  title: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export default function ProfilePage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<
    'devices' | 'credits' | 'activity'
  >('devices');
  const [user, setUser] = useState<User | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
    fetchActivities();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const result = await response.json();

      if (result.success) {
        setUser(result.user);
      } else {
        setError('Failed to fetch user data');
      }
    } catch (err) {
      setError('Error fetching user data');
      console.error('User fetch error:', err);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/user/activity');
      const result = await response.json();

      if (result.success) {
        setActivities(result.activities);
      } else {
        console.error('Failed to fetch activities');
      }
    } catch (err) {
      console.error('Activity fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingPage message='Loading profile...' />;
  }

  if (error || !user) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>Error</h2>
          <p className='text-gray-600 mb-4'>{error || 'User not found'}</p>
          <button
            onClick={fetchUserData}
            className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className='min-h-screen bg-gray-50'>
      {/* Profile Header */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='flex items-center space-x-6'>
            <img
              src={
                user.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`
              }
              alt={user.username}
              className='w-24 h-24 rounded-full border-4 border-white shadow-lg'
            />
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                {user.username}
              </h1>
              <p className='text-gray-600 mb-4'>
                {user.bio ||
                  'IoT device manager and environmental monitoring enthusiast'}
              </p>
              <div className='flex items-center space-x-6 text-sm text-gray-500'>
                <span>
                  Joined{' '}
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : 'Recently'}
                </span>
                <span>•</span>
                <span>{user.stats?.itemsOwned || 0} devices</span>
                <span>•</span>
                <span>{user.stats?.collections || 0} projects</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='grid grid-cols-3 gap-8 text-center'>
            <div>
              <div className='text-2xl font-bold text-gray-900'>
                {user.stats?.itemsOwned || 0}
              </div>
              <div className='text-sm text-gray-600'>IoT Devices</div>
            </div>
            <div>
              <div className='text-2xl font-bold text-gray-900'>
                {user.stats?.collections || 0}
              </div>
              <div className='text-sm text-gray-600'>Projects</div>
            </div>
            <div>
              <div className='text-2xl font-bold text-gray-900'>
                {user.stats?.totalCredits || 0} Credits
              </div>
              <div className='text-sm text-gray-600'>Carbon Credits</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Tabs */}
        <div className='bg-white rounded-lg shadow-sm mb-6'>
          <div className='border-b border-gray-200'>
            <nav className='flex space-x-8 px-6'>
              <button
                onClick={() => setActiveTab('devices')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'devices'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                IoT Devices
              </button>
              <button
                onClick={() => setActiveTab('credits')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'credits'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Carbon Credits
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'activity'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Activity
              </button>
            </nav>
          </div>

          <div className='p-6'>
            {activeTab === 'devices' && (
              <div className='text-center py-12'>
                <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <span className='text-2xl'>📱</span>
                </div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  Manage Your IoT Devices
                </h3>
                <p className='text-gray-600 mb-6'>
                  Register and monitor your environmental sensors to track
                  carbon credit generation.
                </p>
                <Link href='/iot-devices'>
                  <button className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors'>
                    Go to Device Management
                  </button>
                </Link>
              </div>
            )}

            {activeTab === 'credits' && (
              <div className='text-center py-12'>
                <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <span className='text-2xl'>🏆</span>
                </div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  Track Your Carbon Credits
                </h3>
                <p className='text-gray-600 mb-6'>
                  Monitor your carbon credit balance and generation history from
                  IoT sensor data.
                </p>
                <Link href='/user-credits'>
                  <button className='bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors'>
                    View Credits Dashboard
                  </button>
                </Link>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className='space-y-4'>
                {activities.length > 0 ? (
                  activities.map(activity => (
                    <div
                      key={activity.id}
                      className='flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0'
                    >
                      <div className='flex items-center space-x-4'>
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            activity.type === 'device_registered'
                              ? 'bg-green-100'
                              : activity.type === 'credits_generated'
                                ? 'bg-blue-100'
                                : activity.type === 'data_updated'
                                  ? 'bg-purple-100'
                                  : 'bg-gray-100'
                          }`}
                        >
                          <svg
                            className={`w-5 h-5 ${
                              activity.type === 'device_registered'
                                ? 'text-green-600'
                                : activity.type === 'credits_generated'
                                  ? 'text-blue-600'
                                  : activity.type === 'data_updated'
                                    ? 'text-purple-600'
                                    : 'text-gray-600'
                            }`}
                            fill='currentColor'
                            viewBox='0 0 20 20'
                          >
                            {activity.type === 'device_registered' && (
                              <path
                                fillRule='evenodd'
                                d='M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z'
                                clipRule='evenodd'
                              />
                            )}
                            {activity.type === 'credits_generated' && (
                              <path
                                fillRule='evenodd'
                                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                clipRule='evenodd'
                              />
                            )}
                            {activity.type === 'data_updated' && (
                              <path
                                fillRule='evenodd'
                                d='M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z'
                                clipRule='evenodd'
                              />
                            )}
                          </svg>
                        </div>
                        <div>
                          <div className='font-semibold text-gray-900'>
                            {activity.title}
                          </div>
                          <div className='text-sm text-gray-600'>
                            {activity.description}
                          </div>
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='text-sm text-gray-500'>
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='text-center py-12'>
                    <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                      <span className='text-2xl'>📊</span>
                    </div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                      No Activity Yet
                    </h3>
                    <p className='text-gray-600 mb-6'>
                      Your activity will appear here once you register devices
                      and start generating carbon credits.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
