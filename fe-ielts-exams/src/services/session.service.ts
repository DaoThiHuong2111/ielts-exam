import { isAuthenticated, getAccessToken, getRefreshToken, isTokenExpired, clearAuthTokens } from '@/lib/token-utils';
import { clientService } from '@/lib/axios';
import { LogoutService } from './logout.service';

export interface SessionInfo {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null;
  isExpired: boolean;
  lastActivity: number;
}

export interface SessionConfig {
  inactivityTimeout: number; // in milliseconds
  warningTimeout: number; // in milliseconds, time before timeout to show warning
  checkInterval: number; // in milliseconds, interval to check session
}

const DEFAULT_SESSION_CONFIG: SessionConfig = {
  inactivityTimeout: 30 * 60 * 1000, // 30 minutes
  warningTimeout: 5 * 60 * 1000, // 5 minutes
  checkInterval: 60 * 1000, // 1 minute
};

/**
 * Service for managing user sessions
 */
export class SessionService {
  private static instance: SessionService;
  private config: SessionConfig;
  private lastActivity: number;
  private checkIntervalId: NodeJS.Timeout | null = null;
  private warningTimeoutId: NodeJS.Timeout | null = null;
  private listeners: Set<(session: SessionInfo) => void> = new Set();
  private warningListeners: Set<(timeLeft: number) => void> = new Set();
  private timeoutListeners: Set<() => void> = new Set();

  private constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
    this.lastActivity = Date.now();
    this.loadLastActivity();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<SessionConfig>): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService(config);
    }
    return SessionService.instance;
  }

  /**
   * Initialize session management
   */
  async initialize(): Promise<void> {
    try {
      // Kiểm tra session bằng cách gọi API (sẽ tự động gửi httpOnly cookies)
      await this.validateSession();
      
      // Nếu thành công, bắt đầu monitoring
      this.startMonitoring();
    } catch (error) {
      // Clear any invalid session data
      this.clearSession();
    }
  }

  /**
   * Start monitoring session activity
   */
  private startMonitoring(): void {
    // Clear any existing intervals
    this.stopMonitoring();

    // Set up activity event listeners
    this.setupActivityListeners();

    // Start periodic session checks
    this.checkIntervalId = setInterval(() => {
      this.checkSession();
    }, this.config.checkInterval);
  }

  /**
   * Stop monitoring session activity
   */
  private stopMonitoring(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }

    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
      this.warningTimeoutId = null;
    }

    // Remove activity event listeners
    this.removeActivityListeners();
  }

  /**
   * Set up activity event listeners
   */
  private setupActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, this.handleActivity.bind(this), { passive: true });
    });

    // Listen for visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  /**
   * Remove activity event listeners
   */
  private removeActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.removeEventListener(event, this.handleActivity.bind(this));
    });

    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  /**
   * Handle user activity
   */
  private handleActivity(): void {
    this.updateLastActivity();
    
    // If we were showing a warning, clear it
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
      this.warningTimeoutId = null;
    }
  }

  /**
   * Handle visibility change
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      // User returned to the tab, check session
      this.checkSession();
    }
  }

  /**
   * Update last activity timestamp
   */
  private updateLastActivity(): void {
    this.lastActivity = Date.now();
    this.saveLastActivity();
    this.notifyListeners();
  }

  /**
   * Save last activity to localStorage
   */
  private saveLastActivity(): void {
    try {
      localStorage.setItem('lastActivity', this.lastActivity.toString());
    } catch (e) {
      console.warn('Failed to save last activity:', e);
    }
  }

  /**
   * Load last activity from localStorage
   */
  private loadLastActivity(): void {
    try {
      const saved = localStorage.getItem('lastActivity');
      if (saved) {
        this.lastActivity = parseInt(saved, 10);
      }
    } catch (e) {
      console.warn('Failed to load last activity:', e);
    }
  }

  /**
   * Check session status
   */
  private async checkSession(): Promise<void> {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    
    // Check if session has timed out
    if (timeSinceActivity >= this.config.inactivityTimeout) {
      await this.handleSessionTimeout();
      return;
    }

    // Check if we should show a warning
    const timeUntilTimeout = this.config.inactivityTimeout - timeSinceActivity;
    if (timeUntilTimeout <= this.config.warningTimeout && !this.warningTimeoutId) {
      this.showSessionWarning(timeUntilTimeout);
    }

    // Check if tokens are still valid
    const accessToken = getAccessToken();
    if (accessToken && isTokenExpired(accessToken)) {
      // Try to refresh the token
      await this.refreshToken();
    }

    // Notify listeners of current session state
    this.notifyListeners();
  }

  /**
   * Show session timeout warning
   */
  private showSessionWarning(timeLeft: number): void {
    this.warningListeners.forEach(listener => {
      try {
        listener(timeLeft);
      } catch (e) {
        console.error('Error in session warning listener:', e);
      }
    });

    // Set up timeout for actual session expiration
    this.warningTimeoutId = setTimeout(() => {
      this.handleSessionTimeout();
    }, timeLeft);
  }

  /**
   * Handle session timeout
   */
  private async handleSessionTimeout(): Promise<void> {
    this.stopMonitoring();
    this.clearSession();
    
    // Notify timeout listeners
    this.timeoutListeners.forEach(listener => {
      try {
        listener();
      } catch (e) {
        console.error('Error in session timeout listener:', e);
      }
    });

    // Perform logout
    await LogoutService.forceLogout();
  }

  /**
   * Validate session with backend
   */
  private async validateSession(): Promise<boolean> {
    try {
      const response = await clientService.get('/api/user/profile');
      return response.status === 200;
    } catch (error) {
      console.warn('Session validation failed:', error);
      return false;
    }
  }

  /**
   * Refresh access token
   */
  private async refreshToken(): Promise<boolean> {
    try {
      const response = await clientService.post('/api/auth/refresh');
      return response.status === 200;
    } catch (error) {
      console.warn('Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Clear session data
   */
  private clearSession(): void {
    try {
      localStorage.removeItem('lastActivity');
    } catch (e) {
      console.warn('Failed to clear session data:', e);
    }
  }

  /**
   * Get current session information
   */
  getSessionInfo(): SessionInfo {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    const authenticated = isAuthenticated();
    
    let tokenExpiry: number | null = null;
    let isExpired = false;

    if (accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        tokenExpiry = payload.exp * 1000; // Convert to milliseconds
        isExpired = isTokenExpired(accessToken);
      } catch (e) {
        console.warn('Failed to parse token:', e);
        isExpired = true;
      }
    }

    return {
      isAuthenticated: authenticated,
      accessToken,
      refreshToken,
      tokenExpiry,
      isExpired,
      lastActivity: this.lastActivity,
    };
  }

  /**
   * Add session state listener
   */
  addSessionListener(listener: (session: SessionInfo) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove session state listener
   */
  removeSessionListener(listener: (session: SessionInfo) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Add warning listener
   */
  addWarningListener(listener: (timeLeft: number) => void): void {
    this.warningListeners.add(listener);
  }

  /**
   * Remove warning listener
   */
  removeWarningListener(listener: (timeLeft: number) => void): void {
    this.warningListeners.delete(listener);
  }

  /**
   * Add timeout listener
   */
  addTimeoutListener(listener: () => void): void {
    this.timeoutListeners.add(listener);
  }

  /**
   * Remove timeout listener
   */
  removeTimeoutListener(listener: () => void): void {
    this.timeoutListeners.delete(listener);
  }

  /**
   * Notify all session listeners
   */
  private notifyListeners(): void {
    const sessionInfo = this.getSessionInfo();
    this.listeners.forEach(listener => {
      try {
        listener(sessionInfo);
      } catch (e) {
        console.error('Error in session listener:', e);
      }
    });
  }

  /**
   * Extend session (call when user performs an action)
   */
  extendSession(): void {
    this.updateLastActivity();
  }

  /**
   * Destroy session service instance
   */
  destroy(): void {
    this.stopMonitoring();
    this.listeners.clear();
    this.warningListeners.clear();
    this.timeoutListeners.clear();
    SessionService.instance = new SessionService(this.config);
  }
}