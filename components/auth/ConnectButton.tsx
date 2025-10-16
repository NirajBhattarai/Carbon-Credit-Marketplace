'use client'

import { useAccount, useDisconnect, useSignMessage } from 'wagmi'
import { Button } from '@/components/ui/Button'
import { useUser } from '@/lib/auth/context'
import { useState, useEffect } from 'react'

/**
 * ConnectButton component using AppKit web component
 * This provides a simple way to integrate wallet connection
 */
export function ConnectButton() {
  return <appkit-button />
}

/**
 * EnhancedConnectButton component with JWT authentication
 * Uses AppKit for wallet connection and handles JWT authentication after connection
 */
export function EnhancedConnectButton() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { signMessageAsync } = useSignMessage()
  const { loginWithWallet, logout, isLoading, user } = useUser()
  const [isSigning, setIsSigning] = useState(false)

  // Handle JWT authentication when wallet connects
  useEffect(() => {
    const handleWalletConnect = async () => {
      if (isConnected && address && !user && !isSigning) {
        try {
          setIsSigning(true)
          
          // Create a message to sign
          const message = `Sign this message to authenticate with EcoTrade Carbon Credit Marketplace.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`
          
          // Sign the message
          const signature = await signMessageAsync({ message })
          
          // Login with wallet signature
          const result = await loginWithWallet(address, signature, message)
          
          if (!result.success) {
            console.error('Login failed:', result.error)
          }
        } catch (error) {
          console.error('Authentication error:', error)
        } finally {
          setIsSigning(false)
        }
      }
    }

    // Add a small delay to avoid race conditions
    const timeoutId = setTimeout(handleWalletConnect, 100)
    return () => clearTimeout(timeoutId)
  }, [isConnected, address, user, isSigning, signMessageAsync, loginWithWallet])

  const handleDisconnect = () => {
    disconnect()
    logout()
  }

  if (isConnected && user) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">
            {user.username || user.name || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
          </p>
          <p className="text-xs text-gray-500">
            {user.role === 'DEVELOPER' ? 'Developer' : user.role === 'ADMIN' ? 'Admin' : 'User'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          disabled={isLoading}
        >
          {isLoading ? 'Disconnecting...' : 'Disconnect'}
        </Button>
      </div>
    )
  }

  if (isConnected && isSigning) {
    return (
      <Button disabled className="min-w-[120px]">
        Authenticating...
      </Button>
    )
  }

  return <appkit-button />
}

/**
 * CustomConnectButton component with custom styling
 * Uses Wagmi hooks for more control over the connection state
 */
export function CustomConnectButton() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          {`${address.slice(0, 6)}...${address.slice(-4)}`}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => disconnect()}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Disconnect
        </Button>
      </div>
    )
  }

  return <appkit-button />
}

/**
 * WalletInfo component to display connected wallet information
 */
export function WalletInfo() {
  const { address, isConnected, chain } = useAccount()
  const { user } = useUser()

  if (!isConnected || !address) {
    return null
  }

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">
          Connected Wallet
        </p>
        <p className="text-xs text-gray-500 font-mono">
          {address}
        </p>
        {chain && (
          <p className="text-xs text-gray-500">
            Network: {chain.name}
          </p>
        )}
        {user && (
          <p className="text-xs text-blue-600">
            Role: {user.role === 'DEVELOPER' ? 'Developer' : user.role === 'ADMIN' ? 'Admin' : 'User'}
          </p>
        )}
      </div>
    </div>
  )
}
