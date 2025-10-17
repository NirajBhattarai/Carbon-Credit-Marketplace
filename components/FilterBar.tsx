'use client';

import { useState } from 'react';

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

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
  totalItems: number;
}

export default function FilterBar({
  onFilterChange,
  totalItems,
}: FilterBarProps): JSX.Element {
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'recent',
    rarity: 'all',
    priceRange: { min: 0, max: 100 },
    element: 'all',
    burnStatus: 'all',
    creditRange: { min: 0, max: 1000 },
  });

  const elements = [
    'all',
    'Mangrove Restoration',
    'Coral Reef Protection',
    'Blue Carbon Sequestration',
    'Marine Protected Areas',
    'Ocean Cleanup',
    'Seaweed Farming',
    'Coastal Wetlands',
    'Deep Sea Conservation',
  ];

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  return (
    <div className='bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 px-6 py-6'>
      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0'>
        {/* Items count with icon */}
        <div className='flex items-center space-x-3'>
          <div className='w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center'>
            <svg
              className='w-5 h-5 text-blue-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
              />
            </svg>
          </div>
          <div>
            <div className='text-2xl font-bold text-gray-900'>
              {totalItems.toLocaleString()}
            </div>
            <div className='text-sm text-gray-600'>Items Available</div>
          </div>
        </div>

        {/* Filters */}
        <div className='flex flex-wrap items-center gap-4'>
          {/* Sort By */}
          <div className='flex items-center space-x-3'>
            <label className='text-sm font-semibold text-gray-700 whitespace-nowrap'>
              Sort by:
            </label>
            <div className='relative'>
              <select
                value={filters.sortBy}
                onChange={e =>
                  handleFilterChange({
                    sortBy: e.target.value as FilterOptions['sortBy'],
                  })
                }
                className='appearance-none bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8 shadow-sm hover:shadow-md transition-shadow'
              >
                <option value='recent'>Recently Listed</option>
                <option value='oldest'>Oldest</option>
                <option value='price-low'>Price: Low to High</option>
                <option value='price-high'>Price: High to Low</option>
                <option value='rarity'>Rarity</option>
                <option value='credits-high'>Credits: High to Low</option>
                <option value='credits-low'>Credits: Low to High</option>
              </select>
              <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                <svg
                  className='w-4 h-4 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Rarity Filter */}
          <div className='flex items-center space-x-3'>
            <label className='text-sm font-semibold text-gray-700 whitespace-nowrap'>
              Rarity:
            </label>
            <div className='relative'>
              <select
                value={filters.rarity}
                onChange={e =>
                  handleFilterChange({
                    rarity: e.target.value as FilterOptions['rarity'],
                  })
                }
                className='appearance-none bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8 shadow-sm hover:shadow-md transition-shadow'
              >
                <option value='all'>All Rarities</option>
                <option value='common'>✨ Common</option>
                <option value='rare'>🔮 Rare</option>
                <option value='epic'>💎 Epic</option>
                <option value='legendary'>⭐ Legendary</option>
              </select>
              <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                <svg
                  className='w-4 h-4 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Element Filter */}
          <div className='flex items-center space-x-3'>
            <label className='text-sm font-semibold text-gray-700 whitespace-nowrap'>
              Project Type:
            </label>
            <div className='relative'>
              <select
                value={filters.element}
                onChange={e => handleFilterChange({ element: e.target.value })}
                className='appearance-none bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8 shadow-sm hover:shadow-md transition-shadow'
              >
                {elements.map(element => (
                  <option key={element} value={element}>
                    {element === 'all' ? 'All Project Types' : element}
                  </option>
                ))}
              </select>
              <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                <svg
                  className='w-4 h-4 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Burn Status Filter */}
          <div className='flex items-center space-x-3'>
            <label className='text-sm font-semibold text-gray-700 whitespace-nowrap'>
              Status:
            </label>
            <div className='relative'>
              <select
                value={filters.burnStatus}
                onChange={e =>
                  handleFilterChange({
                    burnStatus: e.target.value as FilterOptions['burnStatus'],
                  })
                }
                className='appearance-none bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8 shadow-sm hover:shadow-md transition-shadow'
              >
                <option value='all'>All Status</option>
                <option value='active'>🌱 Active</option>
                <option value='burned'>🔥 Burned</option>
                <option value='expired'>⏰ Expired</option>
              </select>
              <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                <svg
                  className='w-4 h-4 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div className='flex items-center space-x-3'>
            <label className='text-sm font-semibold text-gray-700 whitespace-nowrap'>
              Price:
            </label>
            <div className='flex items-center space-x-2 bg-white border border-gray-300 rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow'>
              <input
                type='number'
                placeholder='Min'
                value={filters.priceRange.min || ''}
                onChange={e =>
                  handleFilterChange({
                    priceRange: {
                      ...filters.priceRange,
                      min: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className='w-16 border-0 text-sm font-medium focus:ring-0 focus:outline-none'
              />
              <span className='text-gray-400'>-</span>
              <input
                type='number'
                placeholder='Max'
                value={filters.priceRange.max || ''}
                onChange={e =>
                  handleFilterChange({
                    priceRange: {
                      ...filters.priceRange,
                      max: parseFloat(e.target.value) || 100,
                    },
                  })
                }
                className='w-16 border-0 text-sm font-medium focus:ring-0 focus:outline-none'
              />
              <span className='text-gray-500 text-sm font-medium'>ETH</span>
            </div>
          </div>

          {/* Credit Range */}
          <div className='flex items-center space-x-3'>
            <label className='text-sm font-semibold text-gray-700 whitespace-nowrap'>
              Credits:
            </label>
            <div className='flex items-center space-x-2 bg-white border border-gray-300 rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow'>
              <input
                type='number'
                placeholder='Min'
                value={filters.creditRange.min || ''}
                onChange={e =>
                  handleFilterChange({
                    creditRange: {
                      ...filters.creditRange,
                      min: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className='w-16 border-0 text-sm font-medium focus:ring-0 focus:outline-none'
              />
              <span className='text-gray-400'>-</span>
              <input
                type='number'
                placeholder='Max'
                value={filters.creditRange.max || ''}
                onChange={e =>
                  handleFilterChange({
                    creditRange: {
                      ...filters.creditRange,
                      max: parseFloat(e.target.value) || 1000,
                    },
                  })
                }
                className='w-16 border-0 text-sm font-medium focus:ring-0 focus:outline-none'
              />
              <span className='text-gray-500 text-sm font-medium'>tons</span>
            </div>
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => {
              const defaultFilters: FilterOptions = {
                sortBy: 'recent',
                rarity: 'all',
                priceRange: { min: 0, max: 100 },
                element: 'all',
                burnStatus: 'all',
                creditRange: { min: 0, max: 1000 },
              };
              setFilters(defaultFilters);
              onFilterChange(defaultFilters);
            }}
            className='flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200'
          >
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
            <span>Clear Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
}
