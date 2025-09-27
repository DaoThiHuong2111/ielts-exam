// Utility functions for token management

/**
 * Get token from cookie
 */
export function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;
  
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Set cookie with security options
 */
export function setCookie(name: string, value: string, options: {
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  httpOnly?: boolean;
} = {}): void {
  if (typeof window === 'undefined') return;
  
  const isProduction = process.env.NODE_ENV === 'production';
  const {
    maxAge,
    path = '/',
    domain,
    secure = isProduction,
    sameSite = 'lax',
    httpOnly = false,
  } = options;
  
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  
  if (maxAge) {
    cookieString += `; max-age=${maxAge}`;
  }
  
  if (path) {
    cookieString += `; path=${path}`;
  }
  
  if (domain) {
    cookieString += `; domain=${domain}`;
  }
  
  if (secure) {
    cookieString += `; secure`;
  }
  
  if (sameSite) {
    cookieString += `; samesite=${sameSite}`;
  }
  
  if (httpOnly) {
    cookieString += `; httponly`;
  }
  
  document.cookie = cookieString;
}

/**
 * Delete cookie
 */
export function deleteCookie(name: string, options: {
  path?: string;
  domain?: string;
} = {}): void {
  if (typeof window === 'undefined') return;
  
  const { path = '/', domain } = options;
  let cookieString = `${encodeURIComponent(name)}=; max-age=0`;
  
  if (path) {
    cookieString += `; path=${path}`;
  }
  
  if (domain) {
    cookieString += `; domain=${domain}`;
  }
  
  document.cookie = cookieString;
}

/**
 * Check if JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Consider token expired if it expires in the next 5 minutes
    return payload.exp < currentTime + 300; // 5 minutes buffer
  } catch (e) {
    return true; // If token is invalid, consider it expired
  }
}

/**
 * Get token expiration time in seconds
 */
export function getTokenExpirationTime(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp;
  } catch (e) {
    return null;
  }
}

/**
 * Get token payload
 */
export function getTokenPayload<T = any>(token: string): T | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Clear all authentication tokens
 */
export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return;
  
  // Clear localStorage
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  
  // Clear cookies
  deleteCookie('accessToken');
  deleteCookie('refreshToken');
}

/**
 * Get access token from cookie or localStorage
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Try to get from cookie first
  const cookieToken = getCookie('accessToken');
  if (cookieToken) {
    return cookieToken;
  }
  
  // Fallback to localStorage
  return localStorage.getItem('accessToken');
}

/**
 * Get refresh token from cookie or localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Try to get from cookie first
  const cookieToken = getCookie('refreshToken');
  if (cookieToken) {
    return cookieToken;
  }
  
  // Fallback to localStorage
  return localStorage.getItem('refreshToken');
}

/**
 * Save tokens to both cookie and localStorage
 */
export function saveTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window === 'undefined') return;
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Save to localStorage
  localStorage.setItem('accessToken', accessToken);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
  
  // Save to cookies
  setCookie('accessToken', accessToken, {
    maxAge: 60 * 15, // 15 minutes
    secure: isProduction,
    sameSite: 'lax',
    httpOnly: false, // Allow JavaScript to read
  });
  
  if (refreshToken) {
    setCookie('refreshToken', refreshToken, {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: isProduction,
      sameSite: 'lax',
      httpOnly: false, // Allow JavaScript to read
    });
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  
  return !!(accessToken && refreshToken && !isTokenExpired(accessToken));
}

/**
 * Redirect to login page
 */
export function redirectToLogin(): void {
  if (typeof window === 'undefined') return;
  
  window.location.href = '/login';
}