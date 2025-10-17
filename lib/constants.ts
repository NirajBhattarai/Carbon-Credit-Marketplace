// Application Constants
export const APP_CONFIG = {
  name: 'EcoTrade',
  shortName: 'EcoTrade',
  description: 'The Future of Carbon Credit Trading',
  tagline: 'Trade. Offset. Impact.',
  version: '1.0.0',
  url: 'https://ecotrade.io',
  supportEmail: 'support@ecotrade.io',
  twitter: '@EcoTradeIO',
  discord: 'discord.gg/ecotrade',
} as const;

// API Configuration
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  retries: 3,
} as const;

// Blockchain Configuration
export const BLOCKCHAIN_CONFIG = {
  networks: {
    ethereum: {
      chainId: 1,
      name: 'Ethereum Mainnet',
      rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
      explorerUrl: 'https://etherscan.io',
    },
    polygon: {
      chainId: 137,
      name: 'Polygon',
      rpcUrl: 'https://polygon-rpc.com',
      explorerUrl: 'https://polygonscan.com',
    },
    arbitrum: {
      chainId: 42161,
      name: 'Arbitrum One',
      rpcUrl: 'https://arb1.arbitrum.io/rpc',
      explorerUrl: 'https://arbiscan.io',
    },
  },
  defaultNetwork: 'ethereum',
} as const;

// Pagination Configuration
export const PAGINATION_CONFIG = {
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
  maxPageSize: 100,
} as const;

// Filter Configuration
export const FILTER_CONFIG = {
  priceRanges: [
    { label: 'Under $10', value: [0, 10] },
    { label: '$10 - $50', value: [10, 50] },
    { label: '$50 - $100', value: [50, 100] },
    { label: '$100 - $500', value: [100, 500] },
    { label: 'Over $500', value: [500, Infinity] },
  ],
  sortOptions: [
    { label: 'Price: Low to High', value: { field: 'price', order: 'asc' } },
    { label: 'Price: High to Low', value: { field: 'price', order: 'desc' } },
    { label: 'Newest First', value: { field: 'createdAt', order: 'desc' } },
    { label: 'Oldest First', value: { field: 'createdAt', order: 'asc' } },
    { label: 'Most Credits', value: { field: 'totalCredits', order: 'desc' } },
    { label: 'Least Credits', value: { field: 'totalCredits', order: 'asc' } },
  ],
} as const;

// Design System Configuration
export const DESIGN_SYSTEM = {
  colors: {
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    secondary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
      950: '#082f49',
    },
    accent: {
      50: '#fefce8',
      100: '#fef9c3',
      200: '#fef08a',
      300: '#fde047',
      400: '#facc15',
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207',
      800: '#854d0e',
      900: '#713f12',
      950: '#422006',
    },
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
    },
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
  },
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },
} as const;

// UI Configuration
export const UI_CONFIG = {
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    },
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction',
  TRANSACTION_FAILED: 'Transaction failed. Please try again',
  NETWORK_ERROR: 'Network error. Please check your connection',
  INVALID_INPUT: 'Please check your input and try again',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  SERVER_ERROR: 'Server error. Please try again later',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully',
  TRANSACTION_SUCCESS: 'Transaction completed successfully',
  LISTING_CREATED: 'Listing created successfully',
  PURCHASE_SUCCESS: 'Purchase completed successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  price: {
    min: 0.001,
    max: 1000000,
    step: 0.001,
  },
  amount: {
    min: 0.000001,
    max: 1000000,
    step: 0.000001,
  },
  slippage: {
    min: 0.1,
    max: 50,
    step: 0.1,
  },
  deadline: {
    min: 1,
    max: 4320,
    step: 1,
  },
} as const;

// Carbon Credit Standards
export const CARBON_STANDARDS = {
  VCS: {
    name: 'Verified Carbon Standard',
    description: "The world's most widely used voluntary GHG program",
    website: 'https://verra.org',
  },
  GOLD_STANDARD: {
    name: 'Gold Standard',
    description: 'Premium standard for climate and development interventions',
    website: 'https://www.goldstandard.org',
  },
  CLIMATE_ACTION_RESERVE: {
    name: 'Climate Action Reserve',
    description: 'North American carbon offset registry',
    website: 'https://www.climateactionreserve.org',
  },
  AMERICAN_CARBON_REGISTRY: {
    name: 'American Carbon Registry',
    description: 'Leading carbon offset program in North America',
    website: 'https://americancarbonregistry.org',
  },
} as const;

// Project Types
export const PROJECT_TYPES = {
  FOREST_CONSERVATION: {
    name: 'Forest Conservation',
    description: 'Protecting and restoring forest ecosystems',
    icon: '🌲',
    color: 'green',
  },
  RENEWABLE_ENERGY: {
    name: 'Renewable Energy',
    description: 'Solar, wind, and hydroelectric projects',
    icon: '⚡',
    color: 'blue',
  },
  OCEAN_RESTORATION: {
    name: 'Ocean Restoration',
    description: 'Marine conservation and blue carbon projects',
    icon: '🌊',
    color: 'cyan',
  },
  CARBON_CAPTURE: {
    name: 'Carbon Capture',
    description: 'Direct air capture and storage technologies',
    icon: '🌱',
    color: 'emerald',
  },
  WILDLIFE_CONSERVATION: {
    name: 'Wildlife Conservation',
    description: 'Biodiversity protection and habitat restoration',
    icon: '🦋',
    color: 'purple',
  },
} as const;

// Rarity Configuration
export const RARITY_CONFIG = {
  COMMON: {
    name: 'Common',
    color: 'gray',
    icon: '✨',
    probability: 0.6,
    multiplier: 1,
  },
  RARE: {
    name: 'Rare',
    color: 'blue',
    icon: '🔮',
    probability: 0.25,
    multiplier: 1.5,
  },
  EPIC: {
    name: 'Epic',
    color: 'purple',
    icon: '💎',
    probability: 0.12,
    multiplier: 2,
  },
  LEGENDARY: {
    name: 'Legendary',
    color: 'yellow',
    icon: '⭐',
    probability: 0.03,
    multiplier: 3,
  },
} as const;
