'use client';

import { useAccount, useDisconnect, useSignMessage } from 'wagmi';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/lib/auth/context';
import { useState, useEffect } from 'react';

/**
 * ConnectButton component using AppKit web component
 * This provides a simple way to integrate wallet connection
 */
export function ConnectButton() {
  return <appkit-button />;
}

/**
 * EnhancedConnectButton component with JWT authentication
 * Uses AppKit for wallet connection and handles JWT authentication after connection
 */
export function EnhancedConnectButton() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const {
    loginWithWallet,
    disconnectWallet,
    isLoading,
    user,
    isAuthenticated,
  } = useUser();
  const [isSigning, setIsSigning] = useState(false);
  const [hasAttemptedAuth, setHasAttemptedAuth] = useState(false);

  // Handle JWT authentication when wallet connects
  useEffect(() => {
    const handleWalletConnect = async () => {
      // Only attempt authentication if:
      // 1. Wallet is connected
      // 2. We have an address
      // 3. User is not already authenticated
      // 4. We haven't already attempted authentication
      // 5. We're not currently signing
      if (
        isConnected &&
        address &&
        !isAuthenticated &&
        !hasAttemptedAuth &&
        !isSigning
      ) {
        try {
          setIsSigning(true);
          setHasAttemptedAuth(true);

          console.log('🔐 Starting authentication for wallet:', address);

          // Create a message to sign
          const message = `Sign this message to authenticate with EcoTrade Carbon Credit Marketplace.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;

          // Sign the message
          const signature = await signMessageAsync({ message });

          // Login with wallet signature
          const result = await loginWithWallet(address, signature, message);

          if (!result.success) {
            console.error('Login failed:', result.error);
            // Reset the attempt flag on failure so user can try again
            setHasAttemptedAuth(false);
          } else {
            console.log('✅ Authentication successful');
          }
        } catch (error) {
          console.error('Authentication error:', error);
          // Reset the attempt flag on error so user can try again
          setHasAttemptedAuth(false);
        } finally {
          setIsSigning(false);
        }
      }
    };

    // Add a small delay to avoid race conditions
    const timeoutId = setTimeout(handleWalletConnect, 100);
    return () => clearTimeout(timeoutId);
  }, [
    isConnected,
    address,
    isAuthenticated,
    hasAttemptedAuth,
    isSigning,
    signMessageAsync,
    loginWithWallet,
  ]);

  // Reset authentication attempt flag when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setHasAttemptedAuth(false);
    }
  }, [isConnected]);

  const handleDisconnect = () => {
    setHasAttemptedAuth(false);
    disconnect();
    disconnectWallet();
  };

  if (isConnected && user) {
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
          variant='outline'
          size='sm'
          onClick={handleDisconnect}
          className='text-red-600 hover:text-red-700 hover:bg-red-50'
          disabled={isLoading}
        >
          {isLoading ? 'Disconnecting...' : 'Disconnect'}
        </Button>
      </div>
    );
  }

  if (isConnected && isSigning) {
    return (
      <Button disabled className='min-w-[120px]'>
        Authenticating...
      </Button>
    );
  }

  return <appkit-button />;
}

/**
 * CustomConnectButton component with custom styling
 * Uses Wagmi hooks for more control over the connection state
 */
export function CustomConnectButton() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className='flex items-center gap-1 sm:gap-2 group'>
        <span className='text-xs sm:text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded-md group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-all duration-300'>
          {`${address.slice(0, 3)}...${address.slice(-3)}`}
        </span>
        <Button
          variant='outline'
          size='xs'
          onClick={() => disconnect()}
          className='text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 text-xs hover:shadow-md hover:shadow-red-100 hover:-translate-y-0.5 transition-all duration-300'
        >
          ×
        </Button>
      </div>
    );
  }

  return <appkit-button />;
}

/**
 * WalletInfo component to display connected wallet information
 */
export function WalletInfo() {
  const { address, isConnected, chain } = useAccount();

  if (!isConnected || !address) {
    return null;
  }

  return (
    <div className='flex items-center gap-4 p-3 bg-gray-50 rounded-lg'>
      <div className='flex-1'>
        <p className='text-sm font-medium text-gray-900'>Connected Wallet</p>
        <p className='text-xs text-gray-500 font-mono'>{address}</p>
        {chain && (
          <p className='text-xs text-gray-500'>Network: {chain.name}</p>
        )}
      </div>
    </div>
  );
}
