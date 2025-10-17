'use client';

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from 'react';
import { useAccount } from 'wagmi';
import { User, AppError } from '@/lib/types';

// App State Types
interface AppState {
  user: User | null;
  isWalletConnected: boolean;
  isAuthenticated: boolean;
  authToken: string | null;
  isLoading: boolean;
  error: AppError | null;
}

// Action Types
type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_WALLET_CONNECTED'; payload: boolean }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_AUTH_TOKEN'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: AppError | null }
  | { type: 'CLEAR_ERROR' };

// Initial State
const initialState: AppState = {
  user: null,
  isWalletConnected: false,
  isAuthenticated: false,
  authToken: null,
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
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'SET_AUTH_TOKEN':
      return { ...state, authToken: action.payload };
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
  const { isConnected } = useAccount();

  // Sync wallet connection state
  useEffect(() => {
    dispatch({ type: 'SET_WALLET_CONNECTED', payload: isConnected });
  }, [isConnected]);

  // Check for existing auth token and fetch user data
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      dispatch({ type: 'SET_AUTH_TOKEN', payload: token });
      dispatch({ type: 'SET_AUTHENTICATED', payload: true });

      // Fetch user data using the token
      fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(response => response.json())
        .then(data => {
          if (data.success && data.user) {
            dispatch({ type: 'SET_USER', payload: data.user });
            dispatch({ type: 'SET_WALLET_CONNECTED', payload: true });
            console.log('✅ User data restored from token:', data.user);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('auth_token');
            dispatch({ type: 'SET_AUTH_TOKEN', payload: null });
            dispatch({ type: 'SET_AUTHENTICATED', payload: false });
          }
        })
        .catch(error => {
          console.error('Failed to restore user data:', error);
          localStorage.removeItem('auth_token');
          dispatch({ type: 'SET_AUTH_TOKEN', payload: null });
          dispatch({ type: 'SET_AUTHENTICATED', payload: false });
        });
    }
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the context
function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Custom hooks
export function useUser() {
  const { state, dispatch } = useApp();

  const setUser = (user: User | null) => {
    dispatch({ type: 'SET_USER', payload: user });
  };

  const connectWallet = async () => {
    // This function is now handled by the EnhancedConnectButton
    // which uses the real wallet connection via Wagmi
    console.log('connectWallet called - use EnhancedConnectButton instead');
  };

  const loginWithWallet = async (
    walletAddress: string,
    signature: string,
    message: string
  ) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Call the login API with real wallet data
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          signature,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();

      if (data.success && data.token) {
        // Store the JWT token
        localStorage.setItem('auth_token', data.token);
        dispatch({ type: 'SET_AUTH_TOKEN', payload: data.token });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });

        // Set user data
        setUser(data.user);
        dispatch({ type: 'SET_WALLET_CONNECTED', payload: true });

        console.log('✅ Authentication successful:', data.user);
        return { success: true, user: data.user };
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: {
          message: 'Failed to authenticate',
          code: 'AUTHENTICATION_ERROR',
        },
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const disconnectWallet = () => {
    dispatch({ type: 'SET_USER', payload: null });
    dispatch({ type: 'SET_WALLET_CONNECTED', payload: false });
    dispatch({ type: 'SET_AUTHENTICATED', payload: false });
    dispatch({ type: 'SET_AUTH_TOKEN', payload: null });
    localStorage.removeItem('auth_token');
  };

  return {
    user: state.user,
    isWalletConnected: state.isWalletConnected,
    isAuthenticated: state.isAuthenticated,
    authToken: state.authToken,
    isLoading: state.isLoading,
    error: state.error,
    connectWallet,
    loginWithWallet,
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
