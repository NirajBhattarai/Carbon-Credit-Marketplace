'use client'

import { ConnectButton, CustomConnectButton, WalletInfo } from '@/components/ConnectButton'
import { useAccount, useBalance } from 'wagmi'

/**
 * Test page to verify AppKit integration
 */
export default function AppKitTestPage() {
  const { address, isConnected, chain } = useAccount()
  const { data: balance } = useBalance({
    address: address,
  })

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            AppKit Integration Test
          </h1>
          
          <div className="space-y-8">
            {/* Connection Status */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Connection Status
              </h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Connected:</span> {isConnected ? 'Yes' : 'No'}
                </p>
                {address && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Address:</span> {address}
                  </p>
                )}
                {chain && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Network:</span> {chain.name} (ID: {chain.id})
                  </p>
                )}
                {balance && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Balance:</span> {balance.formatted} {balance.symbol}
                  </p>
                )}
              </div>
            </div>

            {/* Connect Buttons */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Connect Buttons
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    Default AppKit Button
                  </h3>
                  <ConnectButton />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    Custom Connect Button
                  </h3>
                  <CustomConnectButton />
                </div>
              </div>
            </div>

            {/* Wallet Info */}
            {isConnected && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Wallet Information
                </h2>
                <WalletInfo />
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">
                Setup Instructions
              </h2>
              <div className="space-y-2 text-sm text-blue-800">
                <p>1. Get your project ID from <a href="https://dashboard.reown.com" target="_blank" rel="noopener noreferrer" className="underline">Reown Dashboard</a></p>
                <p>2. Create a <code className="bg-blue-100 px-1 rounded">.env.local</code> file in the frontend directory</p>
                <p>3. Add <code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_PROJECT_ID=your_project_id_here</code></p>
                <p>4. Restart your development server</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
