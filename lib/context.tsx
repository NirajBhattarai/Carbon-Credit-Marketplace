'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import { User, AppError } from '@/lib/types';

// App State Types
interface AppState {
  user: User | null;
  isWalletConnected: boolean;
  isLoading: boolean;
  error: AppError | null;
}

// Action Types
type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_WALLET_CONNECTED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: AppError | null }
  | { type: 'CLEAR_ERROR' };

// Initial State
const initialState: AppState = {
  user: null,
  isWalletConnected: false,
  isLoading: false,
  error: null,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_WALLET_CONNECTED':
      return { ...state, isWalletConnected: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Convenience hooks
export function useUser() {
  const { state, dispatch } = useApp();

  const setUser = (user: User | null) => {
    dispatch({ type: 'SET_USER', payload: user });
  };

  const connectWallet = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockUser: User = {
        id: '1',
        walletAddress: '0x1234...5678',
        username: 'CarbonTrader',
        role: 'USER',
        isVerified: true,
        createdAt: '2024-01-01T00:00:00Z',
        // Legacy fields for backward compatibility
        address: '0x1234...5678',
        name: 'CarbonTrader',
        avatar:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
        bio: 'Passionate about carbon credits and environmental impact',
        joined: '2024-01-01T00:00:00Z',
        stats: {
          itemsOwned: 15,
          collections: 8,
          volumeTraded: 45.2,
          totalCredits: 2500,
          creditsUsed: 1200,
        },
      };

      setUser(mockUser);
      dispatch({ type: 'SET_WALLET_CONNECTED', payload: true });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: {
          code: 'WALLET_CONNECTION_ERROR',
          message: 'Failed to connect wallet',
          details: error,
        },
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const disconnectWallet = () => {
    setUser(null);
    dispatch({ type: 'SET_WALLET_CONNECTED', payload: false });
  };

  return {
    user: state.user,
    isWalletConnected: state.isWalletConnected,
    isLoading: state.isLoading,
    error: state.error,
    connectWallet,
    disconnectWallet,
    setUser,
  };
}

export function useError() {
  const { state, dispatch } = useApp();

  const setError = (error: AppError | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return {
    error: state.error,
    setError,
    clearError,
  };
}
