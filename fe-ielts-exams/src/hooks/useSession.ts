import { useState, useEffect, useRef, useCallback } from 'react';
import { SessionService, SessionInfo, SessionConfig } from '@/services/session.service';
import { useRouter } from 'next/navigation';

/**
 * Hook for managing user sessions
 */
export function useSession(config?: Partial<SessionConfig>) {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const router = useRouter();
  
  const sessionServiceRef = useRef<SessionService | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize session service
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const service = SessionService.getInstance(config);
        sessionServiceRef.current = service;

        // Add listeners
        service.addSessionListener(handleSessionUpdate);
        service.addWarningListener(handleSessionWarning);
        service.addTimeoutListener(handleSessionTimeout);

        // Initialize session
        await service.initialize();

        // Get initial session info
        const initialSessionInfo = service.getSessionInfo();
        setSessionInfo(initialSessionInfo);
      } catch (error) {
        console.error('Failed to initialize session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();

    // Cleanup on unmount
    return () => {
      if (sessionServiceRef.current) {
        sessionServiceRef.current.removeSessionListener(handleSessionUpdate);
        sessionServiceRef.current.removeWarningListener(handleSessionWarning);
        sessionServiceRef.current.removeTimeoutListener(handleSessionTimeout);
      }
      
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [config]);

  // Handle session updates
  const handleSessionUpdate = useCallback((newSessionInfo: SessionInfo) => {
    setSessionInfo(newSessionInfo);
  }, []);

  // Handle session warnings
  const handleSessionWarning = useCallback((timeLeftMs: number) => {
    setShowWarning(true);
    setTimeLeft(timeLeftMs);
    
    // Auto-hide warning after 5 seconds
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(false);
    }, 5000);
  }, []);

  // Handle session timeout
  const handleSessionTimeout = useCallback(() => {
    setShowWarning(false);
    // The actual logout is handled by the session service
    // We just need to ensure the UI updates
    setSessionInfo(null);
  }, []);

  // Extend session manually
  const extendSession = useCallback(() => {
    if (sessionServiceRef.current) {
      sessionServiceRef.current.extendSession();
    }
  }, []);

  // Continue session (dismiss warning)
  const continueSession = useCallback(() => {
    setShowWarning(false);
    extendSession();
  }, [extendSession]);

  // Logout manually
  const logout = useCallback(async () => {
    if (sessionServiceRef.current) {
      sessionServiceRef.current.destroy();
    }
    
    // Redirect to login page
    router.push('/login');
    
    // Force a refresh to clear any cached state
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }, [router]);

  // Format time left for display
  const formatTimeLeft = useCallback((milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Check if session is about to expire
  const isSessionExpiringSoon = useCallback((): boolean => {
    if (!sessionInfo || !sessionInfo.tokenExpiry) return false;
    
    const now = Date.now();
    const timeUntilExpiry = sessionInfo.tokenExpiry - now;
    
    // Consider expiring soon if less than 5 minutes left
    return timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000;
  }, [sessionInfo]);

  // Get session status text
  const getSessionStatusText = useCallback((): string => {
    if (!sessionInfo) return 'Không có phiên đăng nhập';
    if (!sessionInfo.isAuthenticated) return 'Chưa đăng nhập';
    if (sessionInfo.isExpired) return 'Phiên đăng nhập đã hết hạn';
    if (isSessionExpiringSoon()) return 'Phiên đăng nhập sắp hết hạn';
    return 'Đang đăng nhập';
  }, [sessionInfo, isSessionExpiringSoon]);

  // Get session status color
  const getSessionStatusColor = useCallback((): string => {
    if (!sessionInfo) return 'text-gray-500';
    if (!sessionInfo.isAuthenticated) return 'text-gray-500';
    if (sessionInfo.isExpired) return 'text-red-500';
    if (isSessionExpiringSoon()) return 'text-yellow-500';
    return 'text-green-500';
  }, [sessionInfo, isSessionExpiringSoon]);

  return {
    sessionInfo,
    isLoading,
    showWarning,
    timeLeft,
    extendSession,
    continueSession,
    logout,
    formatTimeLeft,
    isSessionExpiringSoon,
    getSessionStatusText,
    getSessionStatusColor,
  };
}

/**
 * Hook for route protection with session validation
 */
export function useProtectedRoute() {
  const { sessionInfo, isLoading, logout } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!sessionInfo || !sessionInfo.isAuthenticated || sessionInfo.isExpired) {
        // Redirect to login if not authenticated or session expired
        router.push('/login');
      }
    }
  }, [sessionInfo, isLoading, router]);

  return {
    sessionInfo,
    isLoading,
    isAuthenticated: sessionInfo?.isAuthenticated && !sessionInfo?.isExpired,
    logout,
  };
}

/**
 * Hook for session validation on route changes
 */
export function useRouteChangeValidation() {
  const { extendSession } = useSession();

  useEffect(() => {
    // Extend session when route changes
    const handleRouteChange = () => {
      extendSession();
    };

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [extendSession]);
}