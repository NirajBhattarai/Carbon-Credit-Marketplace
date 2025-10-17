'use client';

import { useAccount, useSignMessage } from 'wagmi';
import { useUser } from '@/lib/auth/context';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

/**
 * Simple authentication button for manual authentication
 * This prevents the infinite loop issue by making authentication manual
 */
export function AuthButton() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { loginWithWallet, logout, user, isLoading } = useUser();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuth = async () => {
    if (!isConnected || !address || user || isAuthenticating) return;

    try {
      setIsAuthenticating(true);

      const message = `Sign this message to authenticate with EcoTrade Carbon Credit Marketplace.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;
      const signature = await signMessageAsync({ message });
      const result = await loginWithWallet(address, signature, message);

      if (!result.success) {
        console.error('Authentication failed:', result.error);
      }
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  if (user) {
    return (
      <div className='flex items-center gap-3'>
        <div className='text-right'>
          <p className='text-sm font-medium text-gray-900'>
            {user.username ||
              user.name ||
              `${address?.slice(0, 6)}...${address?.slice(-4)}`}
          </p>
          <p className='text-xs text-gray-500'>
            {user.role === 'DEVELOPER'
              ? 'Developer'
              : user.role === 'ADMIN'
                ? 'Admin'
                : 'User'}
          </p>
        </div>
        <Button
          onClick={logout}
          size='sm'
          variant='secondary'
          className='text-xs'
        >
          Logout
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleAuth}
      disabled={isAuthenticating || isLoading}
      size='sm'
      className='min-w-[120px]'
    >
      {isAuthenticating
        ? 'Signing...'
        : isLoading
          ? 'Authenticating...'
          : 'Authenticate'}
    </Button>
  );
}
