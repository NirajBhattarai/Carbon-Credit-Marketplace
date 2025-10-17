'use client';

import { useState } from 'react';
import Link from 'next/link';
import { mockNFTs } from '@/lib/mockData';

interface NFTPageProps {
  params: {
    id: string;
  };
}

export default function NFTPage({ params }: NFTPageProps): JSX.Element {
  const nft = mockNFTs.find(n => n.id === params.id);

  if (!nft) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            NFT Not Found
          </h1>
          <Link href='/' className='text-blue-600 hover:text-blue-700'>
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  return (
    <main className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* NFT Image */}
          <div className='space-y-4'>
            <div className='bg-white rounded-lg overflow-hidden shadow-lg'>
              <img src={nft.image} alt={nft.name} className='w-full h-auto' />
            </div>

            {/* Collection Info */}
            <div className='bg-white rounded-lg p-6 shadow-sm'>
              <div className='flex items-center space-x-3 mb-4'>
                <img
                  src='https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=40&h=40&fit=crop'
                  alt={nft.collection.name}
                  className='w-10 h-10 rounded-full'
                />
                <div>
                  <h3 className='font-semibold text-gray-900'>
                    {nft.collection.name}
                  </h3>
                  <div className='flex items-center space-x-2'>
                    <span className='text-sm text-gray-600'>Collection</span>
                    {nft.collection.verified && (
                      <div className='flex items-center space-x-1'>
                        <svg
                          className='w-4 h-4 text-blue-500'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                          />
                        </svg>
                        <span className='text-xs text-blue-500'>Verified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Link
                href={`/collection/${nft.collection.slug}`}
                className='text-blue-600 hover:text-blue-700 text-sm font-medium'
              >
                View Collection →
              </Link>
            </div>
          </div>

          {/* NFT Details */}
          <div className='space-y-6'>
            {/* Header */}
            <div>
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                {nft.name}
              </h1>
              <p className='text-gray-600'>{nft.description}</p>
            </div>

            {/* Owner Info */}
            <div className='bg-white rounded-lg p-6 shadow-sm'>
              <div className='flex items-center justify-between mb-4'>
                <span className='text-sm font-medium text-gray-500'>
                  Owned by
                </span>
                <Link
                  href={`/profile/${nft.owner.address}`}
                  className='text-blue-600 hover:text-blue-700 text-sm'
                >
                  View Profile
                </Link>
              </div>
              <div className='flex items-center space-x-3'>
                <img
                  src={nft.owner.avatar}
                  alt={nft.owner.name}
                  className='w-12 h-12 rounded-full'
                />
                <div>
                  <div className='font-semibold text-gray-900'>
                    {nft.owner.name}
                  </div>
                  <div className='text-sm text-gray-600'>
                    {nft.owner.address}
                  </div>
                </div>
              </div>
            </div>

            {/* Price Info */}
            <div className='bg-white rounded-lg p-6 shadow-sm'>
              <div className='flex items-center justify-between mb-4'>
                <span className='text-sm font-medium text-gray-500'>
                  Current Price
                </span>
                <div className='text-right'>
                  <div className='text-2xl font-bold text-gray-900'>
                    {nft.price} {nft.currency}
                  </div>
                  <div className='text-sm text-gray-600'>
                    ≈ ${(nft.price * 2000).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className='space-y-3'>
                <button className='w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors'>
                  Buy Now
                </button>
                <button className='w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg font-semibold transition-colors'>
                  Make Offer
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className='bg-white rounded-lg shadow-sm'>
              <div className='border-b border-gray-200'>
                <nav className='flex space-x-8 px-6'>
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'details'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'history'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    History
                  </button>
                </nav>
              </div>

              <div className='p-6'>
                {activeTab === 'details' && (
                  <div className='space-y-4'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <div className='text-sm text-gray-500'>
                          Contract Address
                        </div>
                        <div className='font-mono text-sm text-gray-900'>
                          {nft.contractAddress}
                        </div>
                      </div>
                      <div>
                        <div className='text-sm text-gray-500'>Token ID</div>
                        <div className='font-mono text-sm text-gray-900'>
                          {nft.tokenId}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className='text-sm text-gray-500 mb-2'>
                        Properties
                      </div>
                      <div className='grid grid-cols-2 gap-2'>
                        {nft.attributes.map((attr, index) => (
                          <div
                            key={index}
                            className='bg-gray-50 rounded-lg p-3'
                          >
                            <div className='text-xs text-gray-500'>
                              {attr.trait_type}
                            </div>
                            <div className='font-semibold text-gray-900'>
                              {attr.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className='space-y-4'>
                    {nft.lastSale && (
                      <div className='flex items-center justify-between py-3 border-b border-gray-200'>
                        <div className='flex items-center space-x-3'>
                          <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                            <svg
                              className='w-4 h-4 text-green-600'
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
                              Sale
                            </div>
                            <div className='text-sm text-gray-600'>
                              {new Date(nft.lastSale.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className='text-right'>
                          <div className='font-semibold text-gray-900'>
                            {nft.lastSale.price} {nft.lastSale.currency}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className='flex items-center justify-between py-3'>
                      <div className='flex items-center space-x-3'>
                        <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                          <svg
                            className='w-4 h-4 text-blue-600'
                            fill='currentColor'
                            viewBox='0 0 20 20'
                          >
                            <path
                              fillRule='evenodd'
                              d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                              clipRule='evenodd'
                            />
                          </svg>
                        </div>
                        <div>
                          <div className='font-semibold text-gray-900'>
                            Minted
                          </div>
                          <div className='text-sm text-gray-600'>
                            {new Date(nft.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
