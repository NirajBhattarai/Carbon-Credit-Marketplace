'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { CustomConnectButton, WalletInfo } from '@/components/ConnectButton'
import { AuthButton } from '@/components/auth/AuthButton'
import { AuthenticationStatus } from '@/components/auth/AuthenticationHandler'
import { useAccount } from 'wagmi'
import { useUser } from '@/lib/auth/context'
import { APP_CONFIG, DESIGN_SYSTEM } from '@/lib/constants'

interface NavigationItem {
  name: string
  href: string
  icon?: React.ReactNode
  badge?: string
}

const navigationItems: NavigationItem[] = [
  { name: 'Trade', href: '/swap', icon: '🔄' },
  { name: 'NFTs', href: '/nfts', icon: '🎨' },
  { name: 'IoT Devices', href: '/iot-devices', icon: '📱' },
  { name: 'Developer', href: '/developer', icon: '⚙️' },
  { name: 'Pools', href: '/pool', icon: '🏊' },
  { name: 'Governance', href: '/vote', icon: '🗳️' },
  { name: 'Analytics', href: '/charts', icon: '📊' },
]

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isConnected } = useAccount()
  const { user, isAuthenticated } = useUser()

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-lg">🌿</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                {APP_CONFIG.name}
              </span>
              <span className="text-xs text-gray-500 -mt-1">{APP_CONFIG.tagline}</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="relative flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 font-medium transition-all duration-200 group"
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
                {item.badge && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-semibold text-white bg-emerald-500 rounded-full animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search carbon credits, projects..."
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Wallet Connect */}
            <div className="flex flex-col items-end gap-2">
              <CustomConnectButton />
              <AuthButton />
              <AuthenticationStatus />
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="mt-4 px-3">
              <input
                type="text"
                placeholder="Search carbon credits, projects..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
