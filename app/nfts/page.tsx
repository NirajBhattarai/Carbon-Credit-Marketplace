'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import NFTCard from '@/components/NFTCard';
import CollectionCard from '@/components/CollectionCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  mockNFTs,
  mockCollections,
  oceanConservationNFTs,
} from '@/lib/mockData';
import { CarbonCreditNFT, Collection } from '@/lib/types';

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
  projectType: string;
  burnStatus: 'all' | 'active' | 'burned' | 'expired';
  creditRange: { min: number; max: number };
  verificationStandard: string;
}

export default function NFTsPage() {
  const [activeTab, setActiveTab] = useState<'nfts' | 'collections'>('nfts');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'recent',
    rarity: 'all',
    priceRange: { min: 0, max: 100 },
    projectType: 'all',
    burnStatus: 'all',
    creditRange: { min: 0, max: 1000 },
    verificationStandard: 'all',
  });

  const itemsPerPage = 20;

  // Get NFTs for each collection
  const getCollectionNFTs = (collectionSlug: string): CarbonCreditNFT[] => {
    if (collectionSlug === 'ocean-conservation-credits') {
      return oceanConservationNFTs.slice(0, 6); // Show first 6 NFTs
    }
    return mockNFTs.filter(nft => nft.collection.slug === collectionSlug);
  };

  // Calculate trending score for collections
  const calculateTrendingScore = (collection: Collection): number => {
    const nfts = getCollectionNFTs(collection.slug);
    const recentActivity = nfts.filter(nft => {
      const daysSinceCreated =
        (Date.now() - new Date(nft.createdAt).getTime()) /
        (1000 * 60 * 60 * 24);
      return daysSinceCreated <= 30;
    }).length;

    const avgPrice =
      nfts.reduce((sum, nft) => sum + nft.price, 0) / nfts.length;
    const volumeWeight = collection.volumeTraded / 1000;
    const activityWeight = recentActivity / nfts.length;
    const priceWeight = avgPrice / 10;

    return volumeWeight + activityWeight + priceWeight;
  };

  // Filter and sort NFTs
  const filteredNFTs = useMemo(() => {
    let filtered = [...mockNFTs];

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(
        nft =>
          nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          nft.collection.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          nft.carbonCredits.projectType
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          nft.carbonCredits.location
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Apply rarity filter
    if (filters.rarity !== 'all') {
      filtered = filtered.filter(nft => nft.rarity === filters.rarity);
    }

    // Apply project type filter
    if (filters.projectType !== 'all') {
      filtered = filtered.filter(
        nft => nft.carbonCredits.projectType === filters.projectType
      );
    }

    // Apply verification standard filter
    if (filters.verificationStandard !== 'all') {
      filtered = filtered.filter(
        nft =>
          nft.carbonCredits.verificationStandard ===
          filters.verificationStandard
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
  }, [mockNFTs, searchQuery, filters]);

  // Filter and sort collections
  const filteredCollections = useMemo(() => {
    let filtered = [...mockCollections];

    // Apply project type filter
    if (filters.projectType !== 'all') {
      filtered = filtered.filter(
        collection => collection.projectType === filters.projectType
      );
    }

    // Apply verification standard filter
    if (filters.verificationStandard !== 'all') {
      filtered = filtered.filter(
        collection =>
          collection.verificationStandard === filters.verificationStandard
      );
    }

    // Apply price range filter
    filtered = filtered.filter(
      collection =>
        collection.floorPrice >= filters.priceRange.min &&
        collection.floorPrice <= filters.priceRange.max
    );

    // Sort by trending score
    filtered.sort(
      (a, b) => calculateTrendingScore(b) - calculateTrendingScore(a)
    );

    return filtered;
  }, [mockCollections, filters]);

  // Pagination for NFTs
  const totalPages = Math.ceil(filteredNFTs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNFTs = filteredNFTs.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getProjectTypes = () => {
    const nftTypes = Array.from(
      new Set(mockNFTs.map(nft => nft.carbonCredits.projectType))
    );
    const collectionTypes = Array.from(
      new Set(mockCollections.map(collection => collection.projectType))
    );
    return Array.from(new Set([...nftTypes, ...collectionTypes]));
  };

  const getVerificationStandards = () => {
    const nftStandards = Array.from(
      new Set(mockNFTs.map(nft => nft.carbonCredits.verificationStandard))
    );
    const collectionStandards = Array.from(
      new Set(
        mockCollections.map(collection => collection.verificationStandard)
      )
    );
    return Array.from(new Set([...nftStandards, ...collectionStandards]));
  };

  return (
    <main className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden'>
      {/* Animated Background */}
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob'></div>
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000'></div>
        <div className='absolute top-40 left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000'></div>
      </div>

      {/* Floating Particles */}
      <div className='absolute inset-0'>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className='absolute w-2 h-2 bg-white/20 rounded-full animate-float'
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Hero Header */}
        <div className='text-center mb-12'>
          <div className='inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6'>
            <span className='text-sm font-medium text-white/80'>
              🌿 EcoTrade Marketplace
            </span>
          </div>

          <h1 className='text-6xl font-bold mb-6 bg-gradient-to-r from-white via-emerald-200 to-teal-200 bg-clip-text text-transparent leading-tight'>
            Carbon Credit NFTs
          </h1>
          <p className='text-xl text-white/70 max-w-3xl mx-auto leading-relaxed'>
            Discover verified carbon credit tokens and trending collections in
            our innovative marketplace
          </p>

          {/* Quick Stats */}
          <div className='flex justify-center space-x-8 mt-8'>
            <div className='text-center'>
              <div className='text-3xl font-bold text-white'>
                {mockNFTs.length}
              </div>
              <div className='text-sm text-white/60'>Total NFTs</div>
            </div>
            <div className='text-center'>
              <div className='text-3xl font-bold text-white'>
                {mockCollections.length}
              </div>
              <div className='text-sm text-white/60'>Collections</div>
            </div>
            <div className='text-center'>
              <div className='text-3xl font-bold text-white'>
                {
                  mockCollections.filter(c => calculateTrendingScore(c) > 2)
                    .length
                }
              </div>
              <div className='text-sm text-white/60'>Trending</div>
            </div>
          </div>
        </div>

        {/* Glassmorphism Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-12'>
          <div className='group bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105'>
            <div className='flex items-center'>
              <div className='w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:shadow-emerald-500/25 transition-shadow duration-300'>
                <span className='text-2xl'>🌿</span>
              </div>
              <div>
                <div className='text-2xl font-bold text-white'>
                  {mockNFTs.length}
                </div>
                <div className='text-sm text-white/70'>Total NFTs</div>
              </div>
            </div>
          </div>

          <div className='group bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105'>
            <div className='flex items-center'>
              <div className='w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:shadow-blue-500/25 transition-shadow duration-300'>
                <span className='text-2xl'>🏢</span>
              </div>
              <div>
                <div className='text-2xl font-bold text-white'>
                  {mockCollections.length}
                </div>
                <div className='text-sm text-white/70'>Collections</div>
              </div>
            </div>
          </div>

          <div className='group bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105'>
            <div className='flex items-center'>
              <div className='w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:shadow-orange-500/25 transition-shadow duration-300'>
                <span className='text-2xl'>🔥</span>
              </div>
              <div>
                <div className='text-2xl font-bold text-white'>
                  {
                    mockCollections.filter(c => calculateTrendingScore(c) > 2)
                      .length
                  }
                </div>
                <div className='text-sm text-white/70'>Trending</div>
              </div>
            </div>
          </div>

          <div className='group bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105'>
            <div className='flex items-center'>
              <div className='w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:shadow-teal-500/25 transition-shadow duration-300'>
                <span className='text-2xl'>✅</span>
              </div>
              <div>
                <div className='text-2xl font-bold text-white'>
                  {mockCollections.filter(c => c.verified).length}
                </div>
                <div className='text-sm text-white/70'>Verified</div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Search & Filters */}
        <div className='bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 mb-12 shadow-2xl'>
          <div className='flex items-center mb-6'>
            <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-3'>
              <svg
                className='w-5 h-5 text-white'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
            </div>
            <h2 className='text-2xl font-bold text-white'>
              Advanced Discovery
            </h2>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Search */}
            <div className='space-y-2'>
              <label className='block text-sm font-medium text-white/80'>
                Search
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <svg
                    className='h-5 w-5 text-white/40'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                    />
                  </svg>
                </div>
                <input
                  type='text'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder='Search NFTs, collections, or projects...'
                  className='w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-300'
                />
              </div>
            </div>

            {/* Sort */}
            <div className='space-y-2'>
              <label className='block text-sm font-medium text-white/80'>
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={e =>
                  setFilters({ ...filters, sortBy: e.target.value as any })
                }
                className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-300'
              >
                <option value='recent' className='bg-slate-800'>
                  Most Recent
                </option>
                <option value='oldest' className='bg-slate-800'>
                  Oldest
                </option>
                <option value='price-low' className='bg-slate-800'>
                  Price: Low to High
                </option>
                <option value='price-high' className='bg-slate-800'>
                  Price: High to Low
                </option>
                <option value='rarity' className='bg-slate-800'>
                  Rarity
                </option>
                <option value='credits-high' className='bg-slate-800'>
                  Credits: High to Low
                </option>
                <option value='credits-low' className='bg-slate-800'>
                  Credits: Low to High
                </option>
              </select>
            </div>

            {/* Project Type */}
            <div className='space-y-2'>
              <label className='block text-sm font-medium text-white/80'>
                Project Type
              </label>
              <select
                value={filters.projectType}
                onChange={e =>
                  setFilters({ ...filters, projectType: e.target.value })
                }
                className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-300'
              >
                <option value='all' className='bg-slate-800'>
                  All Types
                </option>
                {getProjectTypes().map(type => (
                  <option key={type} value={type} className='bg-slate-800'>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Filters */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-6'>
            <div className='space-y-2'>
              <label className='block text-sm font-medium text-white/80'>
                Rarity
              </label>
              <select
                value={filters.rarity}
                onChange={e =>
                  setFilters({ ...filters, rarity: e.target.value as any })
                }
                className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-300'
              >
                <option value='all' className='bg-slate-800'>
                  All Rarities
                </option>
                <option value='common' className='bg-slate-800'>
                  Common
                </option>
                <option value='rare' className='bg-slate-800'>
                  Rare
                </option>
                <option value='epic' className='bg-slate-800'>
                  Epic
                </option>
                <option value='legendary' className='bg-slate-800'>
                  Legendary
                </option>
              </select>
            </div>

            <div className='space-y-2'>
              <label className='block text-sm font-medium text-white/80'>
                Verification
              </label>
              <select
                value={filters.verificationStandard}
                onChange={e =>
                  setFilters({
                    ...filters,
                    verificationStandard: e.target.value,
                  })
                }
                className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-300'
              >
                <option value='all' className='bg-slate-800'>
                  All Standards
                </option>
                {getVerificationStandards().map(standard => (
                  <option
                    key={standard}
                    value={standard}
                    className='bg-slate-800'
                  >
                    {standard}
                  </option>
                ))}
              </select>
            </div>

            <div className='space-y-2'>
              <label className='block text-sm font-medium text-white/80'>
                Status
              </label>
              <select
                value={filters.burnStatus}
                onChange={e =>
                  setFilters({ ...filters, burnStatus: e.target.value as any })
                }
                className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-300'
              >
                <option value='all' className='bg-slate-800'>
                  All Status
                </option>
                <option value='active' className='bg-slate-800'>
                  Active
                </option>
                <option value='burned' className='bg-slate-800'>
                  Burned
                </option>
                <option value='expired' className='bg-slate-800'>
                  Expired
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Modern Tab Navigation */}
        <div className='flex justify-center mb-12'>
          <div className='bg-white/10 backdrop-blur-lg rounded-2xl p-2 border border-white/20'>
            <div className='flex space-x-2'>
              <button
                onClick={() => setActiveTab('nfts')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'nfts'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className='flex items-center space-x-2'>
                  <span className='text-lg'>🎨</span>
                  <span>NFTs</span>
                  <div
                    className={`px-2 py-1 rounded-full text-xs ${
                      activeTab === 'nfts' ? 'bg-white/20' : 'bg-white/10'
                    }`}
                  >
                    {filteredNFTs.length}
                  </div>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('collections')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'collections'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className='flex items-center space-x-2'>
                  <span className='text-lg'>🏢</span>
                  <span>Collections</span>
                  <div
                    className={`px-2 py-1 rounded-full text-xs ${
                      activeTab === 'collections'
                        ? 'bg-white/20'
                        : 'bg-white/10'
                    }`}
                  >
                    {filteredCollections.length}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'nfts' && (
          <>
            {/* Results Header */}
            <div className='flex justify-between items-center mb-8'>
              <div className='bg-white/10 backdrop-blur-lg rounded-xl px-6 py-3 border border-white/20'>
                <p className='text-white/80 font-medium'>
                  Showing{' '}
                  <span className='text-white font-bold'>
                    {startIndex + 1}-{Math.min(endIndex, filteredNFTs.length)}
                  </span>{' '}
                  of{' '}
                  <span className='text-white font-bold'>
                    {filteredNFTs.length}
                  </span>{' '}
                  NFTs
                </p>
              </div>
              <div className='flex items-center space-x-2 bg-white/10 backdrop-blur-lg rounded-xl p-2 border border-white/20'>
                <span className='text-sm text-white/70 px-3'>View:</span>
                <button className='px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium shadow-lg'>
                  Grid
                </button>
                <button className='px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg text-sm font-medium transition-all duration-200'>
                  List
                </button>
              </div>
            </div>

            {/* NFT Grid */}
            {currentNFTs.length > 0 ? (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12'>
                {currentNFTs.map((nft, index) => (
                  <div
                    key={nft.id}
                    className='group transform transition-all duration-500 hover:scale-105'
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Link href={`/nft/${nft.id}`}>
                      <NFTCard nft={nft} />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-20'>
                <div className='relative mb-8'>
                  <div className='text-8xl mb-4 animate-bounce'>🔍</div>
                  <div className='absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl'></div>
                </div>
                <h3 className='text-3xl font-bold text-white mb-4'>
                  No NFTs Found
                </h3>
                <p className='text-white/70 mb-8 text-lg max-w-md mx-auto'>
                  Try adjusting your search criteria or filters to discover
                  amazing carbon credit NFTs
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({
                      sortBy: 'recent',
                      rarity: 'all',
                      priceRange: { min: 0, max: 100 },
                      projectType: 'all',
                      burnStatus: 'all',
                      creditRange: { min: 0, max: 1000 },
                      verificationStandard: 'all',
                    });
                  }}
                  className='px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105'
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Modern Pagination */}
            {totalPages > 1 && (
              <div className='flex justify-center items-center space-x-3 mt-12'>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    currentPage === 1
                      ? 'bg-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/20'
                  }`}
                >
                  <svg
                    className='w-4 h-4 mr-2 inline'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 19l-7-7 7-7'
                    />
                  </svg>
                  Previous
                </button>

                <div className='flex space-x-2'>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                            : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/20'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    currentPage === totalPages
                      ? 'bg-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/20'
                  }`}
                >
                  Next
                  <svg
                    className='w-4 h-4 ml-2 inline'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 5l7 7-7 7'
                    />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'collections' && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch'>
            {filteredCollections.map((collection, index) => {
              const trendingScore = calculateTrendingScore(collection);
              const isTrending = trendingScore > 2;
              const collectionNFTs = getCollectionNFTs(collection.slug);

              return (
                <div
                  key={collection.id}
                  className='group transform transition-all duration-500 hover:scale-105'
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <Link href={`/collection/${collection.slug}`}>
                    <div className='bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 overflow-hidden border border-white/20 hover:border-white/40 transform hover:-translate-y-2 h-full flex flex-col'>
                      {/* Collection Image */}
                      <div className='relative h-56 overflow-hidden'>
                        <img
                          src={collection.banner}
                          alt={collection.name}
                          className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-700'
                        />
                        <div className='absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent' />

                        {/* Trending Badge */}
                        {isTrending && (
                          <div className='absolute top-4 left-4'>
                            <div className='px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-xs font-bold shadow-lg animate-pulse-glow'>
                              🔥 Trending
                            </div>
                          </div>
                        )}

                        {/* Verified Badge */}
                        {collection.verified && (
                          <div className='absolute top-4 right-4'>
                            <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg'>
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
                          </div>
                        )}
                      </div>

                      {/* Collection Info */}
                      <div className='p-6 flex flex-col flex-grow'>
                        <div className='mb-6 flex-shrink-0'>
                          <h3 className='text-2xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors line-clamp-1'>
                            {collection.name}
                          </h3>
                          <p className='text-white/70 text-sm line-clamp-2 leading-relaxed h-10'>
                            {collection.description}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className='grid grid-cols-2 gap-6 mb-6 flex-shrink-0'>
                          <div className='bg-white/10 rounded-xl p-3 border border-white/20'>
                            <div className='text-xl font-bold text-emerald-400'>
                              {collection.floorPrice} ETH
                            </div>
                            <div className='text-xs text-white/60'>
                              Floor Price
                            </div>
                          </div>
                          <div className='bg-white/10 rounded-xl p-3 border border-white/20'>
                            <div className='text-xl font-bold text-green-400'>
                              ${collection.volumeTraded}M
                            </div>
                            <div className='text-xs text-white/60'>Volume</div>
                          </div>
                          <div className='bg-white/10 rounded-xl p-3 border border-white/20'>
                            <div className='text-xl font-bold text-purple-400'>
                              {collectionNFTs.length}
                            </div>
                            <div className='text-xs text-white/60'>NFTs</div>
                          </div>
                          <div className='bg-white/10 rounded-xl p-3 border border-white/20'>
                            <div className='text-xl font-bold text-blue-400'>
                              {collection.owners}
                            </div>
                            <div className='text-xs text-white/60'>Owners</div>
                          </div>
                        </div>

                        {/* Featured NFTs Preview */}
                        <div className='mb-6 flex-grow flex flex-col justify-end'>
                          {collectionNFTs.length > 0 && (
                            <div className='mb-4'>
                              <div className='text-sm font-medium text-white/80 mb-2'>
                                Featured NFTs:
                              </div>
                              <div className='flex space-x-2'>
                                {collectionNFTs.slice(0, 3).map(nft => (
                                  <div
                                    key={nft.id}
                                    className='w-12 h-12 rounded-lg overflow-hidden border-2 border-white/20'
                                  >
                                    <img
                                      src={nft.image}
                                      alt={nft.name}
                                      className='w-full h-full object-cover'
                                    />
                                  </div>
                                ))}
                                {collectionNFTs.length > 3 && (
                                  <div className='w-12 h-12 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-xs font-medium text-white/60'>
                                    +{collectionNFTs.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Project Details */}
                          <div className='flex items-center justify-between text-sm'>
                            <div className='flex items-center space-x-2'>
                              <span className='text-white/60'>
                                {collection.projectType}
                              </span>
                              <span className='text-white/40'>•</span>
                              <span className='text-white/60'>
                                {collection.verificationStandard}
                              </span>
                            </div>
                            <div className='text-purple-300 font-medium group-hover:text-purple-200 transition-colors'>
                              View Collection →
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
