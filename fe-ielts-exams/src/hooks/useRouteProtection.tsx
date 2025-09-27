import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

interface RouteProtectionOptions {
  requireAuth?: boolean;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
}

/**
 * Hook for enhanced route protection with better user experience
 */
export function useRouteProtection(options: RouteProtectionOptions = {}) {
  const {
    requireAuth = true,
    redirectTo = '/login',
    loadingComponent = null,
  } = options;

  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkRouteAccess = async () => {
      if (isLoading) return;

      setIsChecking(true);

      try {
        // Skip route protection for admin routes
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
          return;
        }

        // Check if route requires authentication
        if (requireAuth) {
          if (!isAuthenticated) {
            // Store the current path for redirect after login
            if (typeof window !== 'undefined') {
              const currentPath = window.location.pathname + window.location.search;
              sessionStorage.setItem('redirectAfterLogin', currentPath);

              // Redirect to login page with callback URL
              const callbackUrl = encodeURIComponent(currentPath);
              router.push(`${redirectTo}?callbackUrl=${callbackUrl}`);
            } else {
              router.push(redirectTo);
            }
            return;
          }
        } else {
          console.log('Route is public');
          // For public routes (like login/register)
          // Temporarily disable redirect for testing
          // if (isAuthenticated) {
          //   console.log('Authenticated user on public route, redirecting to profile');
          //   router.push('/profile');
          //   return;
          // }
        }
      } catch (error) {
        console.error('Route protection error:', error);

        // If there's an error checking authentication, redirect to login for protected routes
        if (requireAuth) {
          router.push(redirectTo);
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkRouteAccess();
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router]);

  // Session timeout is handled by AuthContext, so we don't need additional listeners

  return {
    isChecking: isLoading || isChecking,
    isAuthenticated,
    user,
  };
}

/**
 * Higher-order component for route protection với enhanced loading
 */
export function withRouteProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: RouteProtectionOptions = {}
) {
  return function ProtectedRoute(props: P) {
    const { isChecking, isAuthenticated } = useRouteProtection(options);

    if (isChecking) {
      if (options.loadingComponent) {
        return <>{options.loadingComponent}</>;
      }

      // Check if this is an admin route to show appropriate loading
      const isAdminRoute = typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/admin');

      if (isAdminRoute) {
        // Import AdminLoading dynamically to avoid circular deps
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-sm border">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    Đang xác thực quyền truy cập
                  </h3>
                  <p className="text-sm text-gray-500">
                    Vui lòng chờ trong giây lát...
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (options.requireAuth && !isAuthenticated) {
      // This should be handled by the hook's redirect
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

/**
 * Hook for admin route protection với real-time monitoring
 */
export function useAdminRouteProtection(options: Omit<RouteProtectionOptions, 'redirectTo'> = {}) {
  const { isAuthenticated, user, isChecking } = useRouteProtection({
    ...options,
    requireAuth: true,
    redirectTo: '/login',
  });

  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminChecking, setIsAdminChecking] = useState(true);
  const [adminCheckCompleted, setAdminCheckCompleted] = useState(false);

  // Axios interceptor đã xử lý token expiration, không cần monitoring ở đây

  useEffect(() => {
    const checkAdminAccess = async () => {
      // Don't proceed if still checking auth
      if (isChecking) {
        return;
      }

      // If not authenticated, stop admin checking
      if (!isAuthenticated) {
        setIsAdminChecking(false);
        setAdminCheckCompleted(false);
        setIsAdmin(false);
        return;
      }

      // Don't proceed if we already completed admin check
      if (adminCheckCompleted) {
        setIsAdminChecking(false);
        return;
      }

      setIsAdminChecking(true);

      try {
        // Ensure user data is available
        if (!user) {
          // Wait a bit longer for user data
          setTimeout(() => {
            setIsAdminChecking(false);
          }, 100);
          return;
        }

        // Check if user is admin based on role field
        const isAdminUser = user?.role === 'ADMIN';

        if (!isAdminUser) {
          console.log('Non-admin user accessing admin route, redirecting to profile');
          // User is not admin, redirect to profile
          router.push('/profile');
          setIsAdmin(false);
          setAdminCheckCompleted(true);
          return;
        }

        console.log('Admin access confirmed for user:', user.username);
        setIsAdmin(true);
        setAdminCheckCompleted(true);
      } catch (error) {
        console.error('Admin route protection error:', error);
        // On error, redirect to profile for safety
        router.push('/profile');
        setIsAdmin(false);
        setAdminCheckCompleted(true);
      } finally {
        setIsAdminChecking(false);
      }
    };

    checkAdminAccess();
  }, [isAuthenticated, isChecking, user, router, adminCheckCompleted]);

  // Reset admin state when user changes or logs out
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsAdmin(false);
      setAdminCheckCompleted(false);
    }
  }, [isAuthenticated, user?.id]);

  return {
    isChecking: isChecking || isAdminChecking,
    isAuthenticated,
    isAdmin,
    user,
  };
}

/**
 * Hook for getting redirect URL after login
 */
export function useRedirectAfterLogin() {
  const getRedirectUrl = (): string => {
    if (typeof window === 'undefined') return '/profile';
    
    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
    sessionStorage.removeItem('redirectAfterLogin');
    
    // Validate the URL to prevent open redirects
    if (redirectUrl && redirectUrl.startsWith('/')) {
      return redirectUrl;
    }
    
    return '/profile';
  };

  const setRedirectUrl = (url: string): void => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirectAfterLogin', url);
    }
  };

  return {
    getRedirectUrl,
    setRedirectUrl,
  };
}