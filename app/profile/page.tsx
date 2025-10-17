'use client';

import { useState } from 'react';
import Link from 'next/link';
import { mockUser } from '@/lib/mockData';

export default function ProfilePage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<'devices' | 'credits' | 'activity'>(
    'devices'
  );

  return (
    <main className='min-h-screen bg-gray-50'>
      {/* Profile Header */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='flex items-center space-x-6'>
            <img
              src={mockUser.avatar}
              alt={mockUser.name}
              className='w-24 h-24 rounded-full border-4 border-white shadow-lg'
            />
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                {mockUser.name}
              </h1>
              <p className='text-gray-600 mb-4'>{mockUser.bio}</p>
              <div className='flex items-center space-x-6 text-sm text-gray-500'>
                <span>
                  Joined {mockUser.joined ? new Date(mockUser.joined).toLocaleDateString() : 'Recently'}
                </span>
                <span>•</span>
                <span>{mockUser.stats?.itemsOwned || 0} devices</span>
                <span>•</span>
                <span>{mockUser.stats?.collections || 0} projects</span>
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
                {mockUser.stats?.itemsOwned || 0}
              </div>
              <div className='text-sm text-gray-600'>IoT Devices</div>
            </div>
            <div>
              <div className='text-2xl font-bold text-gray-900'>
                {mockUser.stats?.collections || 0}
              </div>
              <div className='text-sm text-gray-600'>Projects</div>
            </div>
            <div>
              <div className='text-2xl font-bold text-gray-900'>
                {mockUser.stats?.volumeTraded || 0} Credits
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
                  Register and monitor your environmental sensors to track carbon credit generation.
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
                  Monitor your carbon credit balance and generation history from IoT sensor data.
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
                <div className='flex items-center justify-between py-4 border-b border-gray-200'>
                  <div className='flex items-center space-x-4'>
                    <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center'>
                      <svg
                        className='w-5 h-5 text-green-600'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                    <div>
                      <div className='font-semibold text-gray-900'>
                        Device Registered
                      </div>
                      <div className='text-sm text-gray-600'>
                        Temperature Sensor #001
                      </div>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-sm text-gray-500'>
                      {new Date(Date.now() - 86400000).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className='flex items-center justify-between py-4 border-b border-gray-200'>
                  <div className='flex items-center space-x-4'>
                    <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                      <svg
                        className='w-5 h-5 text-blue-600'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                    <div>
                      <div className='font-semibold text-gray-900'>
                        Carbon Credits Generated
                      </div>
                      <div className='text-sm text-gray-600'>
                        5.2 credits from air quality monitoring
                      </div>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-sm text-gray-500'>
                      {new Date(Date.now() - 172800000).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className='flex items-center justify-between py-4'>
                  <div className='flex items-center space-x-4'>
                    <div className='w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center'>
                      <svg
                        className='w-5 h-5 text-purple-600'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                    <div>
                      <div className='font-semibold text-gray-900'>
                        Data Analytics Updated
                      </div>
                      <div className='text-sm text-gray-600'>
                        Weekly environmental report generated
                      </div>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-sm text-gray-500'>
                      {new Date(Date.now() - 259200000).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}