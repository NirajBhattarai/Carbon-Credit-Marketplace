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
  const { connectWallet, disconnectWallet, user, isLoading } = useUser();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuth = async () => {
    if (!isConnected || !address || user || isAuthenticating) return;

    try {
      setIsAuthenticating(true);
      await connectWallet();
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
      <div className='flex items-center gap-1 sm:gap-1.5 group'>
        <div className='text-right hidden sm:block'>
          <p className='text-xs font-medium text-gray-900 truncate max-w-20 group-hover:text-emerald-600 transition-colors duration-300'>
            {user.username ||
              user.name ||
              `${address?.slice(0, 3)}...${address?.slice(-3)}`}
          </p>
          <p className='text-xs text-gray-500 group-hover:text-emerald-500 transition-colors duration-300'>
            {user.role === 'DEVELOPER'
              ? 'Dev'
              : user.role === 'ADMIN'
                ? 'Admin'
                : 'User'}
          </p>
        </div>
        <Button
          onClick={disconnectWallet}
          size='xs'
          variant='secondary'
          className='text-xs px-2 py-1 hover:shadow-md hover:shadow-gray-100 hover:-translate-y-0.5 transition-all duration-300'
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
      size='xs'
      className='min-w-[70px] px-2 py-1 text-xs hover:shadow-md hover:shadow-emerald-100 hover:-translate-y-0.5 transition-all duration-300'
    >
      {isAuthenticating
        ? 'Signing...'
        : isLoading
          ? 'Auth...'
          : 'Auth'}
    </Button>
  );
}
