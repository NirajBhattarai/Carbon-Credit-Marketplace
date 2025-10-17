// Base types
export type Currency = 'ETH' | 'USDC' | 'USD';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type BurnStatus = 'active' | 'burned' | 'expired';
export type VerificationStandard =
  | 'VCS'
  | 'Gold Standard'
  | 'Climate Action Reserve'
  | 'American Carbon Registry';
export type ProjectType =
  | 'Forest Conservation'
  | 'Renewable Energy'
  | 'Ocean Restoration'
  | 'Carbon Capture'
  | 'Wildlife Conservation';

// User and Wallet types
export interface User {
  id: string;
  walletAddress: string;
  username?: string;
  email?: string;
  role: 'USER' | 'DEVELOPER' | 'ADMIN';
  isVerified: boolean;
  createdAt: string;
  // Legacy fields for backward compatibility
  address?: string;
  name?: string;
  avatar?: string;
  bio?: string;
  joined?: string;
  stats?: UserStats;
}

export interface UserStats {
  itemsOwned: number;
  collections: number;
  volumeTraded: number;
  totalCredits: number;
  creditsUsed: number;
}

// Collection types
export interface Collection {
  id: string;
  name: string;
  description: string;
  image: string;
  banner: string;
  slug: string;
  verified: boolean;
  floorPrice: number;
  volumeTraded: number;
  totalSupply: number;
  owners: number;
  createdAt: string;
  projectType: ProjectType;
  verificationStandard: VerificationStandard;
}

// NFT and Carbon Credit types
export interface CarbonCreditNFT {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  currency: Currency;
  owner: User;
  collection: Collection;
  tokenId: string;
  contractAddress: string;
  rarity: Rarity;
  attributes: NFTAttribute[];
  createdAt: string;
  lastSale?: SaleRecord;
  // Carbon Credit specific fields
  carbonCredits: CarbonCreditData;
  burnStatus: BurnStatus;
  burnDate?: string;
}

export interface CarbonCreditData {
  totalCredits: number;
  remainingCredits: number;
  creditsPerTon: number;
  projectType: ProjectType;
  verificationStandard: VerificationStandard;
  location: string;
  vintage: number;
  co2Equivalent: number;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?:
    | 'string'
    | 'number'
    | 'date'
    | 'boost_number'
    | 'boost_percentage';
}

export interface SaleRecord {
  price: number;
  currency: Currency;
  date: string;
  buyer: User;
  seller: User;
}

// Trading and Swap types
export interface Token {
  symbol: string;
  name: string;
  icon: string;
  balance: string;
  address: string;
  decimals: number;
  priceUSD?: number;
}

export interface SwapQuote {
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  rate: number;
  priceImpact: number;
  minimumReceived: string;
  networkFee: string;
  slippage: number;
}

export interface SwapSettings {
  slippageTolerance: number;
  transactionDeadline: number;
  autoRefresh: boolean;
}

// Market and Analytics types
export interface MarketStats {
  totalVolume: number;
  totalCredits: number;
  activeProjects: number;
  averagePrice: number;
  priceChange24h: number;
}

export interface ProjectStats {
  id: string;
  name: string;
  totalCredits: number;
  creditsSold: number;
  revenue: number;
  co2Reduced: number;
  verificationStandard: VerificationStandard;
  location: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface CreateListingForm {
  price: number;
  currency: Currency;
  duration: number;
  isAuction: boolean;
}

export interface BuyForm {
  paymentMethod: Currency;
  amount: number;
  gasEstimate?: number;
}

// Filter and Search types
export interface FilterOptions {
  priceRange: [number, number];
  rarity: Rarity[];
  projectType: ProjectType[];
  verificationStandard: VerificationStandard[];
  burnStatus: BurnStatus[];
  sortBy: 'price' | 'rarity' | 'date' | 'credits';
  sortOrder: 'asc' | 'desc';
}

export interface SearchParams {
  query?: string;
  filters?: FilterOptions;
  page?: number;
  limit?: number;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error?: AppError;
}

// Legacy types for backward compatibility
export type NFT = CarbonCreditNFT;
