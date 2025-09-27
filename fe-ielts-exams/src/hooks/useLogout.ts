import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogoutService, LogoutResult } from '@/services/logout.service';

/**
 * Hook for handling logout functionality
 */
export function useLogout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  /**
   * Perform logout
   */
  const logout = async (withConfirmation = true): Promise<LogoutResult> => {
    setIsLoading(true);
    setError(null);

    try {
      let result: LogoutResult;
      
      if (withConfirmation) {
        result = await LogoutService.logoutWithConfirmation();
      } else {
        result = await LogoutService.logout();
      }

      // If logout was successful, redirect to login page
      if (result.success) {
        // Use Next.js router for client-side navigation
        router.push('/login');
        
        // Force a refresh to clear any cached state
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đăng xuất thất bại';
      setError(errorMessage);
      
      // Even if there's an error, try to force logout
      await LogoutService.forceLogout();
      
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Force logout without confirmation
   */
  const forceLogout = async (): Promise<LogoutResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await LogoutService.forceLogout();
      
      // Force a refresh to clear any cached state
      setTimeout(() => {
        window.location.reload();
      }, 100);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đăng xuất thất bại';
      setError(errorMessage);
      
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Auto-logout if token is expired
   */
  const autoLogoutIfNeeded = async (): Promise<boolean> => {
    if (LogoutService.shouldLogout()) {
      await forceLogout();
      return true;
    }
    return false;
  };

  return {
    logout,
    logoutWithConfirmation: (withConfirmation = true) => logout(withConfirmation),
    forceLogout,
    autoLogoutIfNeeded,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}