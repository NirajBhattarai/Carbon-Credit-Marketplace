'use client';

import { useAccount, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/Button';

/**
 * ConnectButton component using AppKit web component
 * This provides a simple way to integrate wallet connection
 */
export function ConnectButton() {
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
      <div className='flex items-center gap-2'>
        <span className='text-sm text-gray-600'>
          {`${address.slice(0, 6)}...${address.slice(-4)}`}
        </span>
        <Button
          variant='outline'
          size='sm'
          onClick={() => disconnect()}
          className='text-red-600 hover:text-red-700 hover:bg-red-50'
        >
          Disconnect
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
