'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  CustomConnectButton,
  WalletInfo,
  EnhancedConnectButton,
} from '@/components/ConnectButton';
import { useAccount } from 'wagmi';
import { useUser } from '@/lib/auth/context';
import { APP_CONFIG, DESIGN_SYSTEM } from '@/lib/constants';

interface NavigationItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string;
}

const navigationItems: NavigationItem[] = [
  { name: 'IoT Devices', href: '/iot-devices', icon: '📱' },
  { name: 'IoT Data', href: '/iot-data', icon: '📊' },
  { name: 'User Credits', href: '/user-credits', icon: '🏆' },
  { name: 'Developer', href: '/developer', icon: '⚙️' },
];

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isConnected } = useAccount();
  const { user, isAuthenticated } = useUser();

  return (
    <nav className='bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm'>
      <div className='max-w-7xl mx-auto px-3 sm:px-4 lg:px-8'>
        <div className='flex justify-between items-center h-14 sm:h-16 lg:h-18'>
          {/* Logo */}
          <Link
            href='/'
            className='flex items-center space-x-2 sm:space-x-3 group flex-shrink-0 hover:scale-105 transition-transform duration-300'
          >
            <div className='relative'>
              <div className='w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:shadow-emerald-200 transition-all duration-300 group-hover:scale-110'>
                <span className='text-white font-bold text-sm sm:text-lg lg:text-xl group-hover:animate-pulse'>
                  🌿
                </span>
              </div>
              <div className='absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full animate-pulse shadow-md'></div>
              {/* Glow effect */}
              <div className='absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300'></div>
            </div>
            <div className='flex flex-col min-w-0'>
              <span className='text-sm sm:text-lg lg:text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors duration-300 truncate'>
                {APP_CONFIG.name}
              </span>
              <span className='text-xs text-gray-500 -mt-0.5 sm:-mt-1 hidden sm:block truncate group-hover:text-emerald-500 transition-colors duration-300'>
                {APP_CONFIG.tagline}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className='hidden xl:flex items-center space-x-0.5 flex-1 justify-center max-w-xl'>
            {navigationItems.map(item => (
              <Link
                key={item.name}
                href={item.href}
                className='relative group flex items-center space-x-1.5 px-3 py-2.5 rounded-xl text-gray-600 hover:text-emerald-600 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-emerald-100 hover:-translate-y-1'
              >
                <span className='text-base group-hover:scale-110 transition-transform duration-300'>
                  {item.icon}
                </span>
                <span className='text-xs whitespace-nowrap group-hover:font-semibold transition-all duration-300'>
                  {item.name}
                </span>
                {item.badge && (
                  <span className='absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-green-500 rounded-full animate-pulse shadow-lg'>
                    {item.badge}
                  </span>
                )}
                {/* Hover effect line */}
                <div className='absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-green-500 group-hover:w-full transition-all duration-300 rounded-full'></div>
              </Link>
            ))}
          </div>

          {/* Right side buttons */}
          <div className='flex items-center space-x-2 flex-shrink-0'>
            {/* Wallet Connect - Responsive */}
            <div className='hidden sm:flex items-center'>
              <EnhancedConnectButton />
            </div>

            {/* Mobile Wallet Connect */}
            <div className='sm:hidden flex items-center'>
              <EnhancedConnectButton />
            </div>

            {/* Mobile menu button */}
            <button
              className='xl:hidden relative p-2 rounded-lg text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-300'
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label='Toggle mobile menu'
            >
              <div className='relative w-6 h-6'>
                <svg
                  className='w-6 h-6 transition-all duration-300'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  ) : (
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M4 6h16M4 12h16M4 18h16'
                    />
                  )}
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className='xl:hidden border-t border-gray-200 py-4 sm:py-6 animate-slide-up'>
            <div className='space-y-2 sm:space-y-3 mb-4 sm:mb-6'>
              {navigationItems.map(item => (
                <Link
                  key={item.name}
                  href={item.href}
                  className='group flex items-center space-x-4 px-4 py-4 text-gray-600 hover:text-emerald-600 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-100 hover:-translate-y-1'
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className='text-xl group-hover:scale-110 transition-transform duration-300'>
                    {item.icon}
                  </span>
                  <span className='font-medium text-base sm:text-lg group-hover:font-semibold transition-all duration-300'>
                    {item.name}
                  </span>
                  {item.badge && (
                    <span className='ml-auto px-3 py-1.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-green-500 rounded-full shadow-md'>
                      {item.badge}
                    </span>
                  )}
                  {/* Hover effect line */}
                  <div className='absolute left-0 w-0 h-1 bg-gradient-to-r from-emerald-500 to-green-500 group-hover:w-full transition-all duration-300 rounded-full'></div>
                </Link>
              ))}
            </div>

            {/* Mobile Auth Buttons */}
            <div className='px-4 space-y-3 sm:hidden'>
              <EnhancedConnectButton />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
