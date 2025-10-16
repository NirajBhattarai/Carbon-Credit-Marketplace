'use client'

import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { User, Token, SwapSettings, AppError } from '@/lib/types'

// App State Types
interface AppState {
  user: User | null
  isWalletConnected: boolean
  isAuthenticated: boolean
  authToken: string | null
  tokens: Token[]
  swapSettings: SwapSettings
  isLoading: boolean
  error: AppError | null
}

// Action Types
type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_WALLET_CONNECTED'; payload: boolean }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_AUTH_TOKEN'; payload: string | null }
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
  isAuthenticated: false,
  authToken: null,
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
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload }
    case 'SET_AUTH_TOKEN':
      return { ...state, authToken: action.payload }
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
  const { address, isConnected } = useAccount()

  // Load auth token from localStorage on mount and validate it
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      dispatch({ type: 'SET_AUTH_TOKEN', payload: token })
      dispatch({ type: 'SET_AUTHENTICATED', payload: true })
      
      // Validate token and fetch user profile
      validateAndFetchUser(token)
    }
  }, [])

  // Function to validate token and fetch user data
  const validateAndFetchUser = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          dispatch({ type: 'SET_USER', payload: data.user })
          dispatch({ type: 'SET_AUTHENTICATED', payload: true })
        } else {
          // Token is invalid, clear it
          localStorage.removeItem('auth_token')
          dispatch({ type: 'SET_AUTH_TOKEN', payload: null })
          dispatch({ type: 'SET_AUTHENTICATED', payload: false })
        }
      } else {
        // Token is invalid or expired, clear it
        localStorage.removeItem('auth_token')
        dispatch({ type: 'SET_AUTH_TOKEN', payload: null })
        dispatch({ type: 'SET_AUTHENTICATED', payload: false })
      }
    } catch (error) {
      console.error('Failed to validate token:', error)
      // On error, clear the token to be safe
      localStorage.removeItem('auth_token')
      dispatch({ type: 'SET_AUTH_TOKEN', payload: null })
      dispatch({ type: 'SET_AUTHENTICATED', payload: false })
    }
  }

  // Update wallet connection state
  useEffect(() => {
    dispatch({ type: 'SET_WALLET_CONNECTED', payload: isConnected })
  }, [isConnected])

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

  const setAuthToken = (token: string | null) => {
    dispatch({ type: 'SET_AUTH_TOKEN', payload: token })
    if (token) {
      localStorage.setItem('auth_token', token)
      dispatch({ type: 'SET_AUTHENTICATED', payload: true })
    } else {
      localStorage.removeItem('auth_token')
      dispatch({ type: 'SET_AUTHENTICATED', payload: false })
    }
  }

  const loginWithWallet = async (walletAddress: string, signature: string, message: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress,
          signature,
          message,
          username: `user_${walletAddress.slice(0, 8)}`
        })
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const data = await response.json()
      
      if (data.success) {
        setAuthToken(data.token)
        setUser(data.user)
        dispatch({ type: 'SET_WALLET_CONNECTED', payload: true })
        return { success: true, user: data.user }
      } else {
        throw new Error(data.error || 'Login failed')
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: {
          code: 'LOGIN_ERROR',
          message: 'Failed to login with wallet',
          details: error
        }
      })
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const logout = () => {
    setUser(null)
    setAuthToken(null)
    dispatch({ type: 'SET_WALLET_CONNECTED', payload: false })
  }

  const fetchUserProfile = async () => {
    try {
      const token = state.authToken
      if (!token) return

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.user)
        }
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
    }
  }

  return {
    user: state.user,
    isWalletConnected: state.isWalletConnected,
    isAuthenticated: state.isAuthenticated,
    authToken: state.authToken,
    isLoading: state.isLoading,
    error: state.error,
    loginWithWallet,
    logout,
    fetchUserProfile,
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
