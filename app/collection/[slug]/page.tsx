'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import NFTCard from '@/components/NFTCard';
import NFTSkeleton from '@/components/NFTSkeleton';
import Pagination from '@/components/Pagination';
import FilterBar from '@/components/FilterBar';
import { mockCollections, oceanConservationNFTs } from '@/lib/mockData';

interface CollectionPageProps {
  params: {
    slug: string;
  };
}

interface FilterOptions {
  sortBy:
    | 'price-low'
    | 'price-high'
    | 'recent'
    | 'oldest'
    | 'rarity'
    | 'credits-high'
    | 'credits-low';
  rarity: 'all' | 'common' | 'rare' | 'epic' | 'legendary';
  priceRange: { min: number; max: number };
  element: string;
  burnStatus: 'all' | 'active' | 'burned' | 'expired';
  creditRange: { min: number; max: number };
}

export default function CollectionPage({
  params,
}: CollectionPageProps): JSX.Element {
  const collection = mockCollections.find(c => c.slug === params.slug);

  if (!collection) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            Collection Not Found
          </h1>
          <Link href='/' className='text-blue-600 hover:text-blue-700'>
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'items' | 'activity'>('items');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'recent',
    rarity: 'all',
    priceRange: { min: 0, max: 100 },
    element: 'all',
    burnStatus: 'all',
    creditRange: { min: 0, max: 1000 },
  });

  const itemsPerPage = 20;

  // Get NFTs based on collection
  const allNFTs =
    params.slug === 'ocean-conservation-credits' ? oceanConservationNFTs : [];

  // Filter and sort NFTs
  const filteredNFTs = useMemo(() => {
    let filtered = [...allNFTs];

    // Apply rarity filter
    if (filters.rarity !== 'all') {
      filtered = filtered.filter(nft => nft.rarity === filters.rarity);
    }

    // Apply project type filter
    if (filters.element !== 'all') {
      filtered = filtered.filter(nft =>
        nft.attributes.some(
          attr =>
            attr.trait_type === 'Project Type' && attr.value === filters.element
        )
      );
    }

    // Apply burn status filter
    if (filters.burnStatus !== 'all') {
      filtered = filtered.filter(nft => nft.burnStatus === filters.burnStatus);
    }

    // Apply price range filter
    filtered = filtered.filter(
      nft =>
        nft.price >= filters.priceRange.min &&
        nft.price <= filters.priceRange.max
    );

    // Apply credit range filter
    filtered = filtered.filter(
      nft =>
        nft.carbonCredits.remainingCredits >= filters.creditRange.min &&
        nft.carbonCredits.remainingCredits <= filters.creditRange.max
    );

    // Apply sorting
    switch (filters.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'oldest':
        filtered.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case 'rarity':
        const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
        filtered.sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity]);
        break;
      case 'credits-high':
        filtered.sort(
          (a, b) =>
            b.carbonCredits.remainingCredits - a.carbonCredits.remainingCredits
        );
        break;
      case 'credits-low':
        filtered.sort(
          (a, b) =>
            a.carbonCredits.remainingCredits - b.carbonCredits.remainingCredits
        );
        break;
      case 'recent':
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return filtered;
  }, [allNFTs, filters]);

  const totalPages = Math.ceil(filteredNFTs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNFTs = filteredNFTs.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setIsLoading(true);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setIsLoading(true);
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change

    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  return (
    <main className='min-h-screen bg-gray-50'>
      {/* Collection Header */}
      <div className='relative'>
        <div className='h-80 bg-gradient-to-r from-blue-600 to-purple-600'>
          <img
            src={collection.banner}
            alt={collection.name}
            className='w-full h-full object-cover opacity-50'
          />
        </div>

        <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12'>
            <div className='flex items-end space-x-8'>
              <img
                src={collection.image}
                alt={collection.name}
                className='w-32 h-32 rounded-2xl border-4 border-white shadow-2xl'
              />
              <div className='text-white'>
                <div className='flex items-center space-x-3 mb-3'>
                  <h1 className='text-4xl font-bold'>{collection.name}</h1>
                  {collection.verified && (
                    <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg'>
                      <svg
                        className='w-5 h-5 text-white'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <p className='text-xl opacity-90 mb-6 max-w-2xl'>
                  {collection.description}
                </p>

                <div className='grid grid-cols-2 md:grid-cols-4 gap-8'>
                  <div className='bg-white/10 backdrop-blur-sm rounded-xl p-4'>
                    <div className='text-3xl font-bold'>
                      {collection.floorPrice} ETH
                    </div>
                    <div className='text-sm opacity-75'>Floor Price</div>
                  </div>
                  <div className='bg-white/10 backdrop-blur-sm rounded-xl p-4'>
                    <div className='text-3xl font-bold'>
                      {collection.volumeTraded} ETH
                    </div>
                    <div className='text-sm opacity-75'>Volume</div>
                  </div>
                  <div className='bg-white/10 backdrop-blur-sm rounded-xl p-4'>
                    <div className='text-3xl font-bold'>
                      {collection.totalSupply.toLocaleString()}
                    </div>
                    <div className='text-sm opacity-75'>Items</div>
                  </div>
                  <div className='bg-white/10 backdrop-blur-sm rounded-xl p-4'>
                    <div className='text-3xl font-bold'>
                      {collection.owners.toLocaleString()}
                    </div>
                    <div className='text-sm opacity-75'>Owners</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collection Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Tabs */}
        <div className='bg-white rounded-2xl shadow-sm mb-8 overflow-hidden'>
          <div className='border-b border-gray-200'>
            <nav className='flex space-x-8 px-8'>
              <button
                onClick={() => setActiveTab('items')}
                className={`py-6 px-1 border-b-2 font-semibold text-sm transition-colors ${
                  activeTab === 'items'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Items ({filteredNFTs.length.toLocaleString()})
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`py-6 px-1 border-b-2 font-semibold text-sm transition-colors ${
                  activeTab === 'activity'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Activity
              </button>
            </nav>
          </div>

          <div className='p-0'>
            {activeTab === 'items' && (
              <>
                <FilterBar
                  onFilterChange={handleFilterChange}
                  totalItems={filteredNFTs.length}
                />

                <div className='p-8'>
                  {isLoading ? (
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
                      {Array.from({ length: itemsPerPage }).map((_, index) => (
                        <NFTSkeleton key={index} />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
                        {currentNFTs.map(nft => (
                          <Link key={nft.id} href={`/nft/${nft.id}`}>
                            <NFTCard nft={nft} />
                          </Link>
                        ))}
                      </div>

                      {totalPages > 1 && (
                        <div className='mt-12'>
                          <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            itemsPerPage={itemsPerPage}
                            totalItems={filteredNFTs.length}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {activeTab === 'activity' && (
              <div className='p-8'>
                <div className='space-y-6'>
                  {currentNFTs.slice(0, 10).map((nft, index) => (
                    <div
                      key={nft.id}
                      className='flex items-center justify-between py-6 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 rounded-lg px-4 transition-colors'
                    >
                      <div className='flex items-center space-x-6'>
                        <img
                          src={nft.image}
                          alt={nft.name}
                          className='w-16 h-16 rounded-xl shadow-sm'
                        />
                        <div>
                          <Link
                            href={`/nft/${nft.id}`}
                            className='font-semibold text-gray-900 hover:text-blue-600 text-lg transition-colors'
                          >
                            {nft.name}
                          </Link>
                          <div className='text-sm text-gray-600 mt-1'>
                            Listed by {nft.owner.name}
                          </div>
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='font-bold text-gray-900 text-lg'>
                          {nft.price} {nft.currency}
                        </div>
                        <div className='text-sm text-gray-600'>
                          {new Date(nft.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
