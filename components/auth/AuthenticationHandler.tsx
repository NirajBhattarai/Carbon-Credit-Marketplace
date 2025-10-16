'use client'

import { useEffect, useRef } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { useUser } from '@/lib/auth/context'
import { useState } from 'react'

/**
 * AuthenticationHandler component - DISABLED to prevent infinite loops
 * Authentication is now handled manually through ManualAuthenticationTrigger
 */
export function AuthenticationHandler() {
  // This component is disabled to prevent infinite loops
  // Authentication is now handled manually
  return null
}

/**
 * AuthenticationStatus component to show authentication status
 */
export function AuthenticationStatus() {
  const { address, isConnected } = useAccount()
  const { user, isLoading } = useUser()

  if (!isConnected) {
    return null
  }

  if (isLoading) {
    return (
      <div className="text-xs text-gray-500">
        Authenticating...
      </div>
    )
  }

  if (user) {
    return (
      <div className="text-xs text-green-600">
        ✓ Authenticated as {user.role === 'DEVELOPER' ? 'Developer' : user.role === 'ADMIN' ? 'Admin' : 'User'}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-xs text-yellow-600">
        ⚠ Wallet connected, authentication required
      </div>
      <ManualAuthenticationTrigger />
    </div>
  )
}

/**
 * ManualAuthenticationTrigger component for manual authentication
 * This can be used as a fallback if automatic authentication fails
 */
export function ManualAuthenticationTrigger() {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { loginWithWallet, user, isLoading } = useUser()
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const handleManualAuth = async () => {
    if (!isConnected || !address || user || isAuthenticating) return

    try {
      setIsAuthenticating(true)
      
      const message = `Sign this message to authenticate with EcoTrade Carbon Credit Marketplace.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`
      const signature = await signMessageAsync({ message })
      const result = await loginWithWallet(address, signature, message)
      
      if (!result.success) {
        console.error('Manual authentication failed:', result.error)
      }
    } catch (error) {
      console.error('Manual authentication error:', error)
    } finally {
      setIsAuthenticating(false)
    }
  }

  if (!isConnected || user) {
    return null
  }

  return (
    <button
      onClick={handleManualAuth}
      disabled={isAuthenticating || isLoading}
      className="text-xs text-blue-600 hover:text-blue-800 underline"
    >
      {isAuthenticating ? 'Authenticating...' : 'Click to authenticate'}
    </button>
  )
}