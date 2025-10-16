'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'
import { User, Token, SwapSettings, AppError } from '@/lib/types'

// App State Types
interface AppState {
  user: User | null
  isWalletConnected: boolean
  tokens: Token[]
  swapSettings: SwapSettings
  isLoading: boolean
  error: AppError | null
}

// Action Types
type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_WALLET_CONNECTED'; payload: boolean }
  | { type: 'SET_TOKENS'; payload: Token[] }
  | { type: 'UPDATE_TOKEN_BALANCE'; payload: { address: string; balance: string } }
  | { type: 'SET_SWAP_SETTINGS'; payload: Partial<SwapSettings> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: AppError | null }
  | { type: 'CLEAR_ERROR' }

// Initial State
const initialState: AppState = {
  user: null,
  isWalletConnected: false,
  tokens: [],
  swapSettings: {
    slippageTolerance: 0.5,
    transactionDeadline: 20,
    autoRefresh: true
  },
  isLoading: false,
  error: null
}

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload }
    case 'SET_WALLET_CONNECTED':
      return { ...state, isWalletConnected: action.payload }
    case 'SET_TOKENS':
      return { ...state, tokens: action.payload }
    case 'UPDATE_TOKEN_BALANCE':
      return {
        ...state,
        tokens: state.tokens.map(token =>
          token.address === action.payload.address
            ? { ...token, balance: action.payload.balance }
            : token
        )
      }
    case 'SET_SWAP_SETTINGS':
      return {
        ...state,
        swapSettings: { ...state.swapSettings, ...action.payload }
      }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

// Context
const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

// Convenience hooks
export function useUser() {
  const { state, dispatch } = useApp()
  
  const setUser = (user: User | null) => {
    dispatch({ type: 'SET_USER', payload: user })
  }

  const connectWallet = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      
      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockUser: User = {
        id: '1',
        address: '0x1234...5678',
        name: 'CarbonTrader',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
        bio: 'Passionate about carbon credits and environmental impact',
        joined: '2024-01-01T00:00:00Z',
        isVerified: true,
        stats: {
          itemsOwned: 15,
          collections: 8,
          volumeTraded: 45.2,
          totalCredits: 2500,
          creditsUsed: 1200
        }
      }
      
      setUser(mockUser)
      dispatch({ type: 'SET_WALLET_CONNECTED', payload: true })
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: {
          code: 'WALLET_CONNECTION_ERROR',
          message: 'Failed to connect wallet',
          details: error
        }
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const disconnectWallet = () => {
    setUser(null)
    dispatch({ type: 'SET_WALLET_CONNECTED', payload: false })
  }

  return {
    user: state.user,
    isWalletConnected: state.isWalletConnected,
    isLoading: state.isLoading,
    error: state.error,
    connectWallet,
    disconnectWallet,
    setUser
  }
}

export function useTokens() {
  const { state, dispatch } = useApp()

  const setTokens = (tokens: Token[]) => {
    dispatch({ type: 'SET_TOKENS', payload: tokens })
  }

  const updateTokenBalance = (address: string, balance: string) => {
    dispatch({ type: 'UPDATE_TOKEN_BALANCE', payload: { address, balance } })
  }

  const getTokenBySymbol = (symbol: string) => {
    return state.tokens.find(token => token.symbol === symbol)
  }

  return {
    tokens: state.tokens,
    setTokens,
    updateTokenBalance,
    getTokenBySymbol
  }
}

export function useSwapSettings() {
  const { state, dispatch } = useApp()

  const updateSettings = (settings: Partial<SwapSettings>) => {
    dispatch({ type: 'SET_SWAP_SETTINGS', payload: settings })
  }

  return {
    settings: state.swapSettings,
    updateSettings
  }
}

export function useError() {
  const { state, dispatch } = useApp()

  const setError = (error: AppError | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  return {
    error: state.error,
    setError,
    clearError
  }
}
