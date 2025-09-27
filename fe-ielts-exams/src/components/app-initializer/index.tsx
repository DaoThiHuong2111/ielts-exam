'use client';

import React, { useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { SessionWarning, SessionStatus } from '@/components/session-warning';
import { useRouteChangeValidation } from '@/hooks/useSession';

interface AppInitializerProps {
  children: React.ReactNode;
}

/**
 * Component that initializes the app and manages session state
 */
export function AppInitializer({ children }: AppInitializerProps) {
  const { isLoading, sessionInfo } = useSession();
  
  // Set up route change validation
  useRouteChangeValidation();

  // Initialize session on app start
  useEffect(() => {
    // Session is initialized by the useSession hook
    // This effect can be used for additional initialization if needed
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      {/* Session warning popup */}
      <SessionWarning />
      
      {/* Main app content */}
      {children}
      
      {/* Session status indicator (can be placed in header or footer) */}
      {/* <SessionStatus className="fixed bottom-2 left-2" /> */}
    </>
  );
}

/**
 * Higher-order component for protecting routes
 */
export function withSessionProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function ProtectedRoute(props: P) {
    const { isLoading, sessionInfo } = useSession();

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!sessionInfo || !sessionInfo.isAuthenticated || sessionInfo.isExpired) {
      // Redirect to login if not authenticated
      // This is a fallback, the middleware should handle most redirects
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

/**
 * Component for handling session initialization in layout
 */
export function SessionLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppInitializer>
      {children}
    </AppInitializer>
  );
}