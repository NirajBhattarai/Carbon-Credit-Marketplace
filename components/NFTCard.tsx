import { NFT } from '@/lib/types';

interface NFTCardProps {
  nft: NFT;
  onClick?: () => void;
}

export default function NFTCard({ nft, onClick }: NFTCardProps): JSX.Element {
  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'legendary':
        return 'text-yellow-600 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200';
      case 'epic':
        return 'text-purple-600 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200';
      case 'rare':
        return 'text-blue-600 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
    }
  };

  const getRarityIcon = (rarity: string): string => {
    switch (rarity) {
      case 'legendary':
        return '⭐';
      case 'epic':
        return '💎';
      case 'rare':
        return '🔮';
      default:
        return '✨';
    }
  };

  const getBurnStatusColor = (status: string): string => {
    switch (status) {
      case 'burned':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'expired':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getBurnStatusIcon = (status: string): string => {
    switch (status) {
      case 'burned':
        return '🔥';
      case 'expired':
        return '⏰';
      default:
        return '🌱';
    }
  };

  const getCreditPercentage = (): number => {
    return (
      (nft.carbonCredits.remainingCredits / nft.carbonCredits.totalCredits) *
      100
    );
  };

  return (
    <div
      className={`group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden border border-gray-100 hover:border-gray-200 transform hover:-translate-y-2 ${
        nft.burnStatus === 'burned' ? 'opacity-60' : ''
      }`}
      onClick={onClick}
    >
      <div className='relative overflow-hidden'>
        <img
          src={nft.image}
          alt={nft.name}
          className='w-full h-72 object-cover group-hover:scale-110 transition-transform duration-700 ease-out'
        />

        {/* Gradient overlay */}
        <div className='absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />

        {/* Rarity badge */}
        <div className='absolute top-4 left-4'>
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-sm ${getRarityColor(nft.rarity)} flex items-center space-x-1`}
          >
            <span>{getRarityIcon(nft.rarity)}</span>
            <span>{nft.rarity.toUpperCase()}</span>
          </div>
        </div>

        {/* Burn Status badge */}
        <div className='absolute top-4 right-4'>
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-sm ${getBurnStatusColor(nft.burnStatus)} flex items-center space-x-1`}
          >
            <span>{getBurnStatusIcon(nft.burnStatus)}</span>
            <span>{nft.burnStatus.toUpperCase()}</span>
          </div>
        </div>

        {/* Verified badge */}
        {nft.collection.verified && (
          <div className='absolute top-16 right-4'>
            <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm'>
              <svg
                className='w-4 h-4 text-white'
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

        {/* Credit Progress Bar */}
        <div className='absolute bottom-4 left-4 right-4'>
          <div className='bg-white/90 backdrop-blur-sm rounded-lg p-3'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-semibold text-gray-900'>
                Carbon Credits
              </span>
              <span className='text-sm font-bold text-gray-900'>
                {nft.carbonCredits.remainingCredits}/
                {nft.carbonCredits.totalCredits}
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  getCreditPercentage() > 50
                    ? 'bg-green-500'
                    : getCreditPercentage() > 20
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${getCreditPercentage()}%` }}
              ></div>
            </div>
            <div className='text-xs text-gray-600 mt-1'>
              {nft.carbonCredits.verificationStandard} •{' '}
              {nft.carbonCredits.projectType}
            </div>
          </div>
        </div>

        {/* Quick actions overlay */}
        {nft.burnStatus === 'active' && (
          <div className='absolute bottom-20 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0'>
            <div className='flex space-x-2'>
              <button className='flex-1 bg-white/90 backdrop-blur-sm text-gray-900 py-2 px-3 rounded-lg text-sm font-semibold hover:bg-white transition-colors'>
                Use Credits
              </button>
              <button className='flex-1 bg-blue-600/90 backdrop-blur-sm text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors'>
                Trade
              </button>
            </div>
          </div>
        )}
      </div>

      <div className='p-5'>
        {/* NFT Name */}
        <div className='mb-3'>
          <h3 className='font-bold text-gray-900 text-lg truncate group-hover:text-emerald-600 transition-colors'>
            {nft.name}
          </h3>
          <p className='text-sm text-gray-500 mt-1'>{nft.collection.name}</p>
        </div>

        {/* Carbon Credit Details */}
        <div className='mb-4 space-y-2'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-600'>Credits Remaining</span>
            <span className='text-sm font-semibold text-emerald-600'>
              {nft.carbonCredits.remainingCredits} /{' '}
              {nft.carbonCredits.totalCredits}
            </span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-600'>Project Type</span>
            <span className='text-sm font-medium text-gray-900'>
              {nft.carbonCredits.projectType}
            </span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-600'>Location</span>
            <span className='text-sm font-medium text-gray-900'>
              {nft.carbonCredits.location}
            </span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-600'>Vintage</span>
            <span className='text-sm font-medium text-gray-900'>
              {nft.carbonCredits.vintage}
            </span>
          </div>
        </div>

        {/* Owner Info */}
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-2'>
            <div className='relative'>
              <img
                src={nft.owner.avatar}
                alt={nft.owner.name}
                className='w-6 h-6 rounded-full border-2 border-white shadow-sm'
              />
              <div className='absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white'></div>
            </div>
            <span className='text-sm text-gray-600 font-medium'>
              {nft.owner.name}
            </span>
          </div>

          {/* Price */}
          <div className='text-right'>
            <div className='text-lg font-bold text-gray-900'>
              {nft.price} {nft.currency}
            </div>
            {nft.lastSale && (
              <div className='text-xs text-gray-500'>
                Last: {nft.lastSale.price} {nft.lastSale.currency}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className='flex items-center justify-between pt-3 border-t border-gray-100'>
          <div className='flex items-center space-x-4 text-xs text-gray-500'>
            <div className='flex items-center space-x-1'>
              <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
              </svg>
              <span>4.8</span>
            </div>
            <div className='flex items-center space-x-1'>
              <svg
                className='w-3 h-3'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
                />
              </svg>
              <span>24</span>
            </div>
          </div>

          <button className='text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors'>
            View →
          </button>
        </div>
      </div>
    </div>
  );
}
