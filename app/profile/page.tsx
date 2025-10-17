'use client';

import { useState } from 'react';
import Link from 'next/link';
import NFTCard from '@/components/NFTCard';
import { mockNFTs, mockUser } from '@/lib/mockData';

export default function ProfilePage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<'owned' | 'created' | 'activity'>(
    'owned'
  );

  // Mock user's owned NFTs
  const ownedNFTs = mockNFTs.slice(0, 4);
  const createdNFTs = mockNFTs.slice(2, 5);

  return (
    <main className='min-h-screen bg-gray-50'>
      {/* Profile Header */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='flex items-center space-x-6'>
            <img
              src={mockUser.avatar}
              alt={mockUser.name}
              className='w-24 h-24 rounded-full border-4 border-white shadow-lg'
            />
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                {mockUser.name}
              </h1>
              <p className='text-gray-600 mb-4'>{mockUser.bio}</p>
              <div className='flex items-center space-x-6 text-sm text-gray-500'>
                <span>
                  Joined {new Date(mockUser.joined).toLocaleDateString()}
                </span>
                <span>•</span>
                <span>{mockUser.stats.itemsOwned} items</span>
                <span>•</span>
                <span>{mockUser.stats.collections} collections</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='grid grid-cols-3 gap-8 text-center'>
            <div>
              <div className='text-2xl font-bold text-gray-900'>
                {mockUser.stats.itemsOwned}
              </div>
              <div className='text-sm text-gray-600'>Items</div>
            </div>
            <div>
              <div className='text-2xl font-bold text-gray-900'>
                {mockUser.stats.collections}
              </div>
              <div className='text-sm text-gray-600'>Collections</div>
            </div>
            <div>
              <div className='text-2xl font-bold text-gray-900'>
                {mockUser.stats.volumeTraded} ETH
              </div>
              <div className='text-sm text-gray-600'>Volume</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Tabs */}
        <div className='bg-white rounded-lg shadow-sm mb-6'>
          <div className='border-b border-gray-200'>
            <nav className='flex space-x-8 px-6'>
              <button
                onClick={() => setActiveTab('owned')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'owned'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Owned ({ownedNFTs.length})
              </button>
              <button
                onClick={() => setActiveTab('created')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'created'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Created ({createdNFTs.length})
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'activity'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Activity
              </button>
            </nav>
          </div>

          <div className='p-6'>
            {activeTab === 'owned' && (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                {ownedNFTs.map(nft => (
                  <Link key={nft.id} href={`/nft/${nft.id}`}>
                    <NFTCard nft={nft} />
                  </Link>
                ))}
              </div>
            )}

            {activeTab === 'created' && (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                {createdNFTs.map(nft => (
                  <Link key={nft.id} href={`/nft/${nft.id}`}>
                    <NFTCard nft={nft} />
                  </Link>
                ))}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className='space-y-4'>
                {ownedNFTs.map((nft, index) => (
                  <div
                    key={nft.id}
                    className='flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0'
                  >
                    <div className='flex items-center space-x-4'>
                      <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center'>
                        <svg
                          className='w-5 h-5 text-green-600'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z'
                            clipRule='evenodd'
                          />
                        </svg>
                      </div>
                      <div>
                        <div className='font-semibold text-gray-900'>
                          Purchased {nft.name}
                        </div>
                        <div className='text-sm text-gray-600'>
                          {new Date(
                            Date.now() - index * 86400000
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='font-semibold text-gray-900'>
                        {nft.price} {nft.currency}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
