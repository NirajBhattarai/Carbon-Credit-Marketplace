import { CarbonCreditNFT, Collection, User, UserStats, SaleRecord, CarbonCreditData } from './types'

// Helper function to create user objects
const createUser = (address: string, name: string, avatar: string): User => ({
  id: generateId(),
  address,
  name,
  avatar,
  bio: `Passionate collector of digital art and unique NFTs`,
  joined: '2023-06-15T10:00:00Z',
  isVerified: true,
  stats: {
    itemsOwned: Math.floor(Math.random() * 20) + 5,
    collections: Math.floor(Math.random() * 10) + 2,
    volumeTraded: Math.random() * 100,
    totalCredits: Math.floor(Math.random() * 5000) + 1000,
    creditsUsed: Math.floor(Math.random() * 2000) + 500
  }
})

// Helper function to create collection objects
const createCollection = (name: string, slug: string, verified: boolean): Collection => ({
  id: generateId(),
  name,
  description: `Verified carbon credits from ${name.toLowerCase()} projects worldwide`,
  image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=300&fit=crop',
  banner: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=300&fit=crop',
  slug,
  verified,
  floorPrice: Math.random() * 10 + 1,
  volumeTraded: Math.random() * 1000 + 100,
  totalSupply: Math.floor(Math.random() * 10000) + 1000,
  owners: Math.floor(Math.random() * 1000) + 100,
  createdAt: '2024-01-01T00:00:00Z',
  projectType: 'Forest Conservation',
  verificationStandard: 'VCS'
})

// Helper function to create carbon credit data
const createCarbonCreditData = (): CarbonCreditData => ({
  totalCredits: Math.floor(Math.random() * 1000) + 100,
  remainingCredits: Math.floor(Math.random() * 800) + 50,
  creditsPerTon: Math.floor(Math.random() * 5) + 1,
  projectType: 'Forest Conservation',
  verificationStandard: 'VCS',
  location: 'Brazil',
  vintage: 2023,
  co2Equivalent: Math.floor(Math.random() * 1000) + 100
})

// Helper function to create sale records
const createSaleRecord = (price: number, currency: 'ETH' | 'USDC', date: string): SaleRecord => ({
  price,
  currency,
  date,
  buyer: createUser('0x1234...5678', 'Buyer', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'),
  seller: createUser('0x5678...9abc', 'Seller', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face')
})

// Helper function to generate IDs
function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export const mockNFTs: CarbonCreditNFT[] = [
  {
    id: '1',
    name: 'Cosmic Explorer #1234',
    description: 'A rare cosmic explorer NFT from the Space Collection. This digital artwork represents the beauty of space exploration.',
    image: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=400&fit=crop',
    price: 2.5,
    currency: 'ETH',
    owner: createUser('0x1234...5678', 'SpaceCollector', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'),
    collection: createCollection('Space Collection', 'space-collection', true),
    tokenId: '1234',
    contractAddress: '0xabcd...efgh',
    rarity: 'rare',
    attributes: [
      { trait_type: 'Background', value: 'Nebula' },
      { trait_type: 'Eyes', value: 'Cosmic' },
      { trait_type: 'Rarity', value: 'Rare' }
    ],
    createdAt: '2024-01-15T10:30:00Z',
    lastSale: createSaleRecord(1.8, 'ETH', '2024-01-10T15:20:00Z'),
    carbonCredits: createCarbonCreditData(),
    burnStatus: 'active'
  },
  {
    id: '2',
    name: 'Digital Dreams #567',
    description: 'An abstract digital art piece representing dreams and imagination in the digital realm.',
    image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop',
    price: 1.2,
    currency: 'ETH',
    owner: createUser('0x5678...9abc', 'ArtLover', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face'),
    collection: createCollection('Abstract Dreams', 'abstract-dreams', false),
    tokenId: '567',
    contractAddress: '0xefgh...ijkl',
    rarity: 'common',
    attributes: [
      { trait_type: 'Style', value: 'Abstract' },
      { trait_type: 'Color', value: 'Purple' },
      { trait_type: 'Rarity', value: 'Common' }
    ],
    createdAt: '2024-01-12T14:45:00Z',
    carbonCredits: createCarbonCreditData(),
    burnStatus: 'active'
  },
  {
    id: '3',
    name: 'Cyberpunk Warrior #999',
    description: 'A legendary cyberpunk warrior from the future. This NFT represents strength and technology.',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop',
    price: 15.0,
    currency: 'ETH',
    owner: createUser('0x9abc...def0', 'CyberCollector', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face'),
    collection: createCollection('Cyberpunk Legends', 'cyberpunk-legends', true),
    tokenId: '999',
    contractAddress: '0xijkl...mnop',
    rarity: 'legendary',
    attributes: [
      { trait_type: 'Class', value: 'Warrior' },
      { trait_type: 'Weapon', value: 'Plasma Sword' },
      { trait_type: 'Armor', value: 'Cyber Armor' },
      { trait_type: 'Rarity', value: 'Legendary' }
    ],
    createdAt: '2024-01-08T09:15:00Z',
    lastSale: createSaleRecord(12.5, 'ETH', '2024-01-05T11:30:00Z'),
    carbonCredits: createCarbonCreditData(),
    burnStatus: 'active'
  },
  {
    id: '4',
    name: 'Nature Spirit #42',
    description: 'A mystical nature spirit representing the harmony between technology and nature.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
    price: 0.8,
    currency: 'ETH',
    owner: createUser('0xdef0...1234', 'NatureFan', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face'),
    collection: createCollection('Nature Spirits', 'nature-spirits', true),
    tokenId: '42',
    contractAddress: '0xmnop...qrst',
    rarity: 'epic',
    attributes: [
      { trait_type: 'Element', value: 'Forest' },
      { trait_type: 'Power', value: 'Healing' },
      { trait_type: 'Rarity', value: 'Epic' }
    ],
    createdAt: '2024-01-14T16:20:00Z',
    carbonCredits: {
      ...createCarbonCreditData(),
      remainingCredits: 0
    },
    burnStatus: 'burned',
    burnDate: '2024-01-10T10:00:00Z'
  },
  {
    id: '5',
    name: 'Retro Robot #777',
    description: 'A vintage-style robot from the golden age of science fiction.',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=400&fit=crop',
    price: 3.2,
    currency: 'ETH',
    owner: createUser('0x1234...5678', 'RobotCollector', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face'),
    collection: createCollection('Retro Robots', 'retro-robots', false),
    tokenId: '777',
    contractAddress: '0xqrst...uvwx',
    rarity: 'rare',
    attributes: [
      { trait_type: 'Era', value: '1950s' },
      { trait_type: 'Material', value: 'Metal' },
      { trait_type: 'Rarity', value: 'Rare' }
    ],
    createdAt: '2024-01-11T12:10:00Z',
    carbonCredits: createCarbonCreditData(),
    burnStatus: 'expired'
  },
  {
    id: '6',
    name: 'Mystic Dragon #1',
    description: 'The first and most powerful dragon in the Mystic Realm collection.',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
    price: 25.0,
    currency: 'ETH',
    owner: createUser('0x5678...9abc', 'DragonMaster', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'),
    collection: createCollection('Mystic Realm', 'mystic-realm', true),
    tokenId: '1',
    contractAddress: '0xuvwx...yzab',
    rarity: 'legendary',
    attributes: [
      { trait_type: 'Species', value: 'Ancient Dragon' },
      { trait_type: 'Element', value: 'Fire' },
      { trait_type: 'Power Level', value: 'Maximum' },
      { trait_type: 'Rarity', value: 'Legendary' }
    ],
    createdAt: '2024-01-01T00:00:00Z',
    lastSale: createSaleRecord(20.0, 'ETH', '2023-12-28T18:45:00Z'),
    carbonCredits: createCarbonCreditData(),
    burnStatus: 'active'
  }
]

export const mockCollections: Collection[] = [
  {
    id: '1',
    name: 'Forest Carbon Credits',
    description: 'Verified carbon credits from reforestation and forest conservation projects worldwide',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=300&fit=crop',
    banner: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=300&fit=crop',
    slug: 'forest-carbon-credits',
    verified: true,
    floorPrice: 1.5,
    volumeTraded: 125.5,
    totalSupply: 1000,
    owners: 450,
    createdAt: '2024-01-01T00:00:00Z',
    projectType: 'Forest Conservation',
    verificationStandard: 'VCS'
  },
  {
    id: '2',
    name: 'Renewable Energy Credits',
    description: 'Carbon credits from solar, wind, and hydroelectric renewable energy projects',
    image: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=300&h=300&fit=crop',
    banner: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1200&h=300&fit=crop',
    slug: 'renewable-energy-credits',
    verified: true,
    floorPrice: 8.0,
    volumeTraded: 2500.0,
    totalSupply: 500,
    owners: 200,
    createdAt: '2024-01-01T00:00:00Z',
    projectType: 'Renewable Energy',
    verificationStandard: 'Gold Standard'
  },
  {
    id: '3',
    name: 'Ocean Conservation Credits',
    description: 'Carbon credits from marine conservation, blue carbon, and ocean restoration projects',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop',
    banner: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=300&fit=crop',
    slug: 'ocean-conservation-credits',
    verified: true,
    floorPrice: 0.3,
    volumeTraded: 12500.0,
    totalSupply: 10000,
    owners: 3500,
    createdAt: '2024-01-01T00:00:00Z',
    projectType: 'Ocean Restoration',
    verificationStandard: 'VCS'
  }
]

// Generate 10,000 dummy NFTs for Ocean Conservation Credits collection
const generateOceanConservationNFTs = (): CarbonCreditNFT[] => {
  const oceanImages = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
  ]

  const projectTypes = ['Mangrove Restoration', 'Coral Reef Protection', 'Blue Carbon Sequestration', 'Marine Protected Areas', 'Ocean Cleanup', 'Seaweed Farming', 'Coastal Wetlands', 'Deep Sea Conservation']
  const locations = ['Pacific Ocean', 'Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Mediterranean Sea', 'Caribbean Sea', 'Red Sea', 'Baltic Sea']
  const rarities: Array<'common' | 'rare' | 'epic' | 'legendary'> = ['common', 'rare', 'epic', 'legendary']
  const rarityWeights = [0.6, 0.25, 0.12, 0.03] // 60% common, 25% rare, 12% epic, 3% legendary

  const ownerNames = [
    'OceanGuardian', 'MarineConservator', 'BlueCarbonTrader', 'SeaProtector', 'OceanInvestor',
    'MarineBiologist', 'OceanScientist', 'BlueEconomy', 'SeaSteward', 'OceanAdvocate'
  ]

  const ownerAvatars = [
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face',
  ]

  const getRandomRarity = (): 'common' | 'rare' | 'epic' | 'legendary' => {
    const random = Math.random()
    let cumulative = 0
    for (let i = 0; i < rarityWeights.length; i++) {
      cumulative += rarityWeights[i]
      if (random <= cumulative) {
        return rarities[i]
      }
    }
    return 'common'
  }

  const getPriceByRarity = (rarity: string): number => {
    switch (rarity) {
      case 'legendary': return Math.random() * 5 + 8 // 8-13 ETH
      case 'epic': return Math.random() * 2 + 3 // 3-5 ETH
      case 'rare': return Math.random() * 1 + 1 // 1-2 ETH
      default: return Math.random() * 0.5 + 0.2 // 0.2-0.7 ETH
    }
  }

  const nfts: CarbonCreditNFT[] = []
  
  const verificationStandards = ['Gold Standard', 'Verra VCS', 'Climate Action Reserve', 'American Carbon Registry']
  
  for (let i = 1; i <= 10000; i++) {
    const rarity = getRandomRarity()
    const projectType = projectTypes[Math.floor(Math.random() * projectTypes.length)]
    const location = locations[Math.floor(Math.random() * locations.length)]
    const ownerName = ownerNames[Math.floor(Math.random() * ownerNames.length)]
    const ownerAvatar = ownerAvatars[Math.floor(Math.random() * ownerAvatars.length)]
    const image = oceanImages[Math.floor(Math.random() * oceanImages.length)]
    const verificationStandard = verificationStandards[Math.floor(Math.random() * verificationStandards.length)]
    
    const price = getPriceByRarity(rarity)
    const hasLastSale = Math.random() > 0.3 // 70% chance of having a last sale
    
    // Generate carbon credit data
    const totalCredits = Math.floor(Math.random() * 1000 + 100) // 100-1100 credits
    const creditsUsed = Math.floor(Math.random() * totalCredits * 0.8) // Use up to 80% of credits
    const remainingCredits = Math.max(0, totalCredits - creditsUsed)
    const creditsPerTon = Math.floor(Math.random() * 5 + 1) // 1-5 credits per ton
    
    // Determine burn status
    let burnStatus: 'active' | 'burned' | 'expired' = 'active'
    let burnDate: string | undefined = undefined
    
    if (remainingCredits === 0) {
      burnStatus = Math.random() > 0.5 ? 'burned' : 'expired'
      burnDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }
    
    nfts.push({
      id: `ocean-credit-${i}`,
      name: `${projectType} Credit #${i}`,
      description: `Verified carbon credit from ${projectType.toLowerCase()} project in the ${location}. This credit represents ${totalCredits} tons of CO2 sequestered or avoided.`,
      image,
      price,
      currency: 'ETH',
      owner: createUser(`0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`, ownerName, ownerAvatar),
      collection: createCollection('Ocean Conservation Credits', 'ocean-conservation-credits', true),
      tokenId: i.toString(),
      contractAddress: '0xmnop...qrst',
      rarity,
      attributes: [
        { trait_type: 'Project Type', value: projectType },
        { trait_type: 'Location', value: location },
        { trait_type: 'Rarity', value: rarity.charAt(0).toUpperCase() + rarity.slice(1) },
        { trait_type: 'Total CO2 Tons', value: totalCredits },
        { trait_type: 'Verification', value: verificationStandard }
      ],
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      lastSale: hasLastSale ? createSaleRecord(
        price * (0.7 + Math.random() * 0.6), // 70-130% of current price
        'ETH',
        new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      ) : undefined,
      carbonCredits: {
        totalCredits,
        remainingCredits,
        creditsPerTon,
        projectType: 'Ocean Restoration',
        verificationStandard: verificationStandard as any,
        location,
        vintage: 2023,
        co2Equivalent: totalCredits
      },
      burnStatus,
      burnDate
    })
  }
  
  return nfts
}

export const oceanConservationNFTs = generateOceanConservationNFTs()

export const mockUser: User = {
  id: '1',
  address: '0x1234...5678',
  name: 'NFTCollector',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  bio: 'Passionate collector of digital art and unique NFTs. Always looking for the next great piece!',
  joined: '2023-06-15T10:00:00Z',
  isVerified: true,
  stats: {
    itemsOwned: 15,
    collections: 8,
    volumeTraded: 45.2,
    totalCredits: 2500,
    creditsUsed: 1200
  }
}

// Legacy export for backward compatibility
export { mockNFTs as NFT }