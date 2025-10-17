'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <main className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50'>
      {/* Hero Section */}
      <section className='relative overflow-hidden bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 text-white'>
        {/* Background Pattern */}
        <div className='absolute inset-0 opacity-10'>
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:24px_24px]'></div>
        </div>
        
        {/* Floating Elements */}
        <div className='absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse-slow'></div>
        <div className='absolute bottom-20 right-10 w-32 h-32 bg-emerald-300/20 rounded-full blur-2xl animate-bounce-subtle'></div>

        <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24'>
          <div className='text-center'>
            {/* Badge */}
            <div className='inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6 animate-fade-in'>
              <span className='text-sm font-medium'>🌿 EcoTrade v1.0</span>
            </div>

            {/* Main Heading */}
            <h1 className='text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent leading-tight'>
              IoT-Powered Carbon Credit Management
            </h1>
            
            {/* Subtitle */}
            <p className='text-lg sm:text-xl lg:text-2xl mb-8 max-w-4xl mx-auto text-emerald-100 leading-relaxed px-4'>
              Monitor, track, and manage carbon credits through real-time IoT sensor data. 
              Join industry leaders in transparent environmental impact measurement and verification.
            </p>
            
            {/* CTA Buttons */}
            <div className='flex flex-col sm:flex-row gap-4 justify-center items-center px-4'>
              <Link href='/iot-devices' className='w-full sm:w-auto'>
                <Button 
                  size='xl' 
                  className='w-full sm:w-auto bg-white text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300'
                >
                  Manage IoT Devices
                </Button>
              </Link>
              <Link href='/developer' className='w-full sm:w-auto'>
                <Button 
                  variant='outline' 
                  size='xl'
                  className='w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-emerald-600 backdrop-blur-sm transition-all duration-300'
                >
                  Developer Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* IoT Devices Section */}
      <section className='py-16 sm:py-20 lg:py-24 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-12 lg:mb-16'>
            <h2 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 lg:mb-6'>
              Real-Time Environmental Monitoring
            </h2>
            <p className='text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed'>
              Connect IoT sensors to monitor carbon sequestration, air quality, and environmental impact in real-time.
            </p>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8'>
            <div className='group text-center p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:shadow-lg hover:shadow-blue-100 transition-all duration-300 hover:-translate-y-1'>
              <div className='w-16 h-16 lg:w-20 lg:h-20 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300'>
                <span className='text-2xl lg:text-3xl'>📱</span>
              </div>
              <h3 className='text-xl lg:text-2xl font-semibold text-gray-900 mb-3 lg:mb-4'>IoT Device Management</h3>
              <p className='text-gray-600 mb-6 lg:mb-8 leading-relaxed'>
                Register, configure, and monitor your environmental sensors with our comprehensive device management platform.
              </p>
              <Link href='/iot-devices'>
                <Button size='lg' className='bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300'>
                  Manage Devices
                </Button>
              </Link>
            </div>

            <div className='group text-center p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:shadow-lg hover:shadow-green-100 transition-all duration-300 hover:-translate-y-1'>
              <div className='w-16 h-16 lg:w-20 lg:h-20 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300'>
                <span className='text-2xl lg:text-3xl'>📊</span>
              </div>
              <h3 className='text-xl lg:text-2xl font-semibold text-gray-900 mb-3 lg:mb-4'>Data Analytics</h3>
              <p className='text-gray-600 mb-6 lg:mb-8 leading-relaxed'>
                Analyze environmental data trends, generate reports, and track carbon credit generation over time.
              </p>
              <Link href='/iot-data'>
                <Button size='lg' className='bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-300'>
                  View Analytics
                </Button>
              </Link>
            </div>

            <div className='group text-center p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:shadow-lg hover:shadow-purple-100 transition-all duration-300 hover:-translate-y-1'>
              <div className='w-16 h-16 lg:w-20 lg:h-20 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300'>
                <span className='text-2xl lg:text-3xl'>⚙️</span>
              </div>
              <h3 className='text-xl lg:text-2xl font-semibold text-gray-900 mb-3 lg:mb-4'>Developer Tools</h3>
              <p className='text-gray-600 mb-6 lg:mb-8 leading-relaxed'>
                Access APIs, manage applications, and integrate IoT data into your environmental monitoring solutions.
              </p>
              <Link href='/developer'>
                <Button size='lg' className='bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300'>
                  Developer Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-slate-50 to-gray-100'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-12 lg:mb-16'>
            <h2 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 lg:mb-6'>
              Platform Features
            </h2>
            <p className='text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed'>
              Comprehensive tools for environmental monitoring and carbon credit management
            </p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8'>
            <div className='group bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:shadow-gray-100 transition-all duration-300 hover:-translate-y-1'>
              <div className='w-12 h-12 lg:w-16 lg:h-16 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300'>
                <span className='text-xl lg:text-2xl'>🌡️</span>
              </div>
              <h3 className='text-lg lg:text-xl font-semibold text-gray-900 mb-2 lg:mb-3'>Sensor Integration</h3>
              <p className='text-gray-600 text-sm lg:text-base leading-relaxed'>
                Connect temperature, humidity, air quality, and other environmental sensors
              </p>
            </div>

            <div className='group bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:shadow-gray-100 transition-all duration-300 hover:-translate-y-1'>
              <div className='w-12 h-12 lg:w-16 lg:h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300'>
                <span className='text-xl lg:text-2xl'>📈</span>
              </div>
              <h3 className='text-lg lg:text-xl font-semibold text-gray-900 mb-2 lg:mb-3'>Time-Series Data</h3>
              <p className='text-gray-600 text-sm lg:text-base leading-relaxed'>
                Track environmental metrics over time with detailed analytics and reporting
              </p>
            </div>

            <div className='group bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:shadow-gray-100 transition-all duration-300 hover:-translate-y-1'>
              <div className='w-12 h-12 lg:w-16 lg:h-16 bg-green-100 rounded-xl flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300'>
                <span className='text-xl lg:text-2xl'>🏆</span>
              </div>
              <h3 className='text-lg lg:text-xl font-semibold text-gray-900 mb-2 lg:mb-3'>Credit Tracking</h3>
              <p className='text-gray-600 text-sm lg:text-base leading-relaxed'>
                Monitor carbon credit generation and user credit balances in real-time
              </p>
            </div>

            <div className='group bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:shadow-gray-100 transition-all duration-300 hover:-translate-y-1'>
              <div className='w-12 h-12 lg:w-16 lg:h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300'>
                <span className='text-xl lg:text-2xl'>🔌</span>
              </div>
              <h3 className='text-lg lg:text-xl font-semibold text-gray-900 mb-2 lg:mb-3'>API Access</h3>
              <p className='text-gray-600 text-sm lg:text-base leading-relaxed'>
                Integrate with your applications using our comprehensive REST API
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 relative overflow-hidden'>
        {/* Background Pattern */}
        <div className='absolute inset-0 opacity-10'>
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:24px_24px]'></div>
        </div>
        
        <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <h2 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 lg:mb-6'>
            Ready to Start Monitoring?
          </h2>
          <p className='text-lg sm:text-xl lg:text-2xl text-emerald-100 mb-8 lg:mb-12 max-w-3xl mx-auto leading-relaxed'>
            Join the future of environmental monitoring with IoT-powered carbon credit management
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
            <Link href='/iot-devices' className='w-full sm:w-auto'>
              <Button 
                size='xl' 
                className='w-full sm:w-auto bg-white text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300'
              >
                Get Started
              </Button>
            </Link>
            <Link href='/developer' className='w-full sm:w-auto'>
              <Button 
                variant='outline' 
                size='xl'
                className='w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-emerald-600 backdrop-blur-sm transition-all duration-300'
              >
                Developer Resources
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}