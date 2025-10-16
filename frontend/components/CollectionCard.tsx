import { Collection } from '@/lib/types'

interface CollectionCardProps {
  collection: Collection
  onClick?: () => void
}

export default function CollectionCard({ collection, onClick }: CollectionCardProps): JSX.Element {
  return (
    <div 
      className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden group"
      onClick={onClick}
    >
      <div className="relative h-32">
        <img
          src={collection.banner}
          alt={collection.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <div className="flex items-center space-x-2">
            <img
              src={collection.image}
              alt={collection.name}
              className="w-8 h-8 rounded-full border-2 border-white"
            />
            <div>
              <h3 className="text-white font-semibold text-sm">{collection.name}</h3>
              {collection.verified && (
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-blue-400 text-xs">Verified</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{collection.description}</p>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">{collection.floorPrice}</div>
            <div className="text-xs text-gray-500">Floor Price</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">{collection.volumeTraded}</div>
            <div className="text-xs text-gray-500">Volume</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">{collection.owners}</div>
            <div className="text-xs text-gray-500">Owners</div>
          </div>
        </div>
      </div>
    </div>
  )
}
