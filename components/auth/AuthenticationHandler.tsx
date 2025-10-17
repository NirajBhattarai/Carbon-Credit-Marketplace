'use client';

import { useEffect, useRef } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { useUser } from '@/lib/auth/context';
import { useState } from 'react';

/**
 * AuthenticationHandler component - DISABLED to prevent infinite loops
 * Authentication is now handled manually through ManualAuthenticationTrigger
 */
export function AuthenticationHandler() {
  // This component is disabled to prevent infinite loops
  // Authentication is now handled manually
  return null;
}

/**
 * AuthenticationStatus component to show authentication status
 */
export function AuthenticationStatus() {
  const { address, isConnected } = useAccount();
  const { user, isLoading } = useUser();

  if (!isConnected) {
    return null;
  }

  if (isLoading) {
    return <div className='text-xs text-gray-500'>Auth...</div>;
  }

  if (user) {
    return (
      <div className='text-xs text-green-600 hidden sm:block'>
        ✓ {user.role === 'DEVELOPER' ? 'Dev' : user.role === 'ADMIN' ? 'Admin' : 'User'}
      </div>
    );
  }

  return (
    <div className='text-xs text-yellow-600 hidden sm:block'>
      ⚠ Auth required
    </div>
  );
}

/**
 * ManualAuthenticationTrigger component for manual authentication
 * This can be used as a fallback if automatic authentication fails
 */
export function ManualAuthenticationTrigger() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { connectWallet, user, isLoading } = useUser();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleManualAuth = async () => {
    if (!isConnected || !address || user || isAuthenticating) return;

    try {
      setIsAuthenticating(true);
      await connectWallet();
    } catch (error) {
      console.error('Manual authentication error:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (!isConnected || user) {
    return null;
  }

  return (
    <button
      onClick={handleManualAuth}
      disabled={isAuthenticating || isLoading}
      className='text-xs text-blue-600 hover:text-blue-800 underline'
    >
      {isAuthenticating ? 'Auth...' : 'Auth'}
    </button>
  );
}
