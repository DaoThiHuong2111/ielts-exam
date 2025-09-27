'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ProfileService, UserProfile } from '@/services/profile.service';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Context Provider
 * Manages global authentication state using HTTP-only cookies
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load user profile from API (validates session via HTTP-only cookies)
   */
  const refreshUser = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await ProfileService.getProfile();
      if (response.success && response.data) {
        // Check if response.data has nested structure (double-wrapped)
        let userData = response.data;
        if ((response.data as any).success && (response.data as any).data) {
          // Double-wrapped: extract the inner data
          userData = (response.data as any).data;
        }

        setUser(userData);
        setError(null);
      } else {
        setUser(null);
        setError(response.message || 'Không thể tải thông tin người dùng');
      }
    } catch (error: any) {
      setUser(null);
      // Handle different error types
      if (error.response?.status === 401) {
        // 401 is expected when user is not authenticated - don't log as error
        setError(null);
      } else {
        // Only log actual errors (not 401)
        console.error('Failed to load user profile:', error);
        setError('Lỗi kết nối. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle logout - call backend logout API to clear cookies
   */
  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setError(null);
      // Redirect to login page
      window.location.href = '/login';
    }
  };

  // Initialize authentication state on mount
  useEffect(() => {
    refreshUser();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    refreshUser,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to get current user with loading state
 */
export function useCurrentUser() {
  const { user, loading, isAuthenticated, refreshUser } = useAuth();
  
  return {
    user,
    loading,
    isAuthenticated,
    refreshUser,
  };
}

/**
 * Hook to check if user has specific role
 */
export function useUserRole() {
  const { user } = useAuth();
  
  const hasRole = (role: string): boolean => {
    // This can be extended to check for specific roles
    // For now, we'll just check if user exists
    return !!user;
  };
  
  const isAdmin = (): boolean => {
    // Check admin role from backend user data
    return user?.role === 'ADMIN';
  };
  
  return {
    hasRole,
    isAdmin,
    user,
  };
}
