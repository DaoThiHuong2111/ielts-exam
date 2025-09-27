import { Page } from '@playwright/test';

/**
 * Test utilities for authentication testing
 */
export class AuthTestUtils {
  /**
   * Register a new user
   */
  static async registerUser(
    page: Page,
    userData: {
      username: string;
      email: string;
      password: string;
    }
  ) {
    await page.goto('/register');
    
    await page.fill('[data-testid="username"]', userData.username);
    await page.fill('[data-testid="email"]', userData.email);
    await page.fill('[data-testid="password"]', userData.password);
    await page.fill('[data-testid="confirmPassword"]', userData.password);
    await page.check('[data-testid="agreeTerms"]');
    
    await page.click('[data-testid="registerButton"]');
    
    // Wait for success message or redirect
    try {
      await page.waitForSelector('[data-testid="successMessage"]', { timeout: 10000 });
    } catch (error) {
      // If success message is not found, check for redirect to login
      await page.waitForURL('**/login', { timeout: 10000 });
    }
  }

  /**
   * Login with existing user
   */
  static async loginUser(
    page: Page,
    credentials: {
      email: string;
      password: string;
    }
  ) {
    await page.goto('/login');
    
    await page.fill('[data-testid="email"]', credentials.email);
    await page.fill('[data-testid="password"]', credentials.password);
    
    await page.click('[data-testid="loginButton"]');
    
    // Wait for successful login
    await page.waitForSelector('[data-testid="userMenu"]', { timeout: 10000 });
  }

  /**
   * Logout current user
   */
  static async logoutUser(page: Page) {
    await page.click('[data-testid="logoutButton"]');
    
    // Check for confirmation dialog
    const confirmButton = page.locator('[data-testid="confirmLogout"]');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    
    // Wait for logout to complete
    await page.waitForSelector('[data-testid="loginButton"]', { timeout: 10000 });
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(page: Page, email: string) {
    await page.goto('/forgot-password');
    
    await page.fill('[data-testid="email"]', email);
    await page.click('[data-testid="resetButton"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="successMessage"]', { timeout: 10000 });
  }

  /**
   * Reset password with token
   */
  static async resetPassword(
    page: Page,
    token: string,
    newPassword: string
  ) {
    await page.goto(`/reset-password?token=${token}`);
    
    await page.fill('[data-testid="newPassword"]', newPassword);
    await page.fill('[data-testid="confirmPassword"]', newPassword);
    
    await page.click('[data-testid="resetPasswordButton"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="successMessage"]', { timeout: 10000 });
  }

  /**
   * Check if user is logged in
   */
  static async isLoggedIn(page: Page): Promise<boolean> {
    try {
      const userMenu = page.locator('[data-testid="userMenu"]');
      return await userMenu.isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }

  /**
   * Get current user info from UI
   */
  static async getCurrentUserInfo(page: Page) {
    const username = await page.locator('[data-testid="usernameDisplay"]').textContent();
    const email = await page.locator('[data-testid="emailDisplay"]').textContent();
    
    return {
      username: username || '',
      email: email || '',
    };
  }

  /**
   * Clear all cookies and storage
   */
  static async clearSession(page: Page) {
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => sessionStorage.clear());
  }

  /**
   * Wait for toast notification
   */
  static async waitForToast(page: Page, type: 'success' | 'error' | 'info' | 'warning') {
    await page.waitForSelector(`[data-testid="toast-${type}"]`, { timeout: 10000 });
    return page.locator(`[data-testid="toast-${type}"]`);
  }

  /**
   * Get toast message text
   */
  static async getToastMessage(page: Page, type: 'success' | 'error' | 'info' | 'warning') {
    const toast = await this.waitForToast(page, type);
    return await toast.textContent();
  }

  /**
   * Check if element has error state
   */
  static async hasError(page: Page, selector: string): Promise<boolean> {
    const element = page.locator(selector);
    const hasErrorClass = await element.getAttribute('class');
    return hasErrorClass?.includes('error') || false;
  }

  /**
   * Get error message for element
   */
  static async getErrorMessage(page: Page, selector: string): Promise<string> {
    const errorElement = page.locator(`${selector}-error`);
    return (await errorElement.textContent()) || '';
  }

  /**
   * Navigate to protected route and check if redirected to login
   */
  static async checkProtectedRouteAccess(page: Page, route: string): Promise<boolean> {
    await page.goto(route);
    
    // Check if redirected to login
    const currentUrl = page.url();
    return currentUrl.includes('/login');
  }

  /**
   * Test password strength indicator
   */
  static async testPasswordStrength(page: Page, password: string): Promise<string> {
    await page.goto('/register');
    await page.fill('[data-testid="password"]', password);
    
    const strengthIndicator = page.locator('[data-testid="passwordStrength"]');
    return await strengthIndicator.getAttribute('data-strength') || '';
  }

  /**
   * Simulate network delay
   */
  static async simulateNetworkDelay(page: Page, delayMs: number) {
    await page.route('**/*', (route) => {
      setTimeout(() => route.continue(), delayMs);
    });
  }

  /**
   * Simulate offline mode
   */
  static async simulateOffline(page: Page) {
    await page.context().setOffline(true);
  }

  /**
   * Simulate online mode
   */
  static async simulateOnline(page: Page) {
    await page.context().setOffline(false);
  }

  /**
   * Take screenshot on failure
   */
  static async takeScreenshot(page: Page, name: string) {
    await page.screenshot({ path: `test-failures/${name}.png`, fullPage: true });
  }

  /**
   * Get console logs
   */
  static async getConsoleLogs(page: Page): Promise<string[]> {
    const logs: string[] = [];
    
    page.on('console', (msg) => {
      logs.push(msg.text());
    });
    
    return logs;
  }

  /**
   * Get network requests
   */
  static async getNetworkRequests(page: Page): Promise<any[]> {
    const requests: any[] = [];
    
    page.on('request', (request) => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData(),
      });
    });
    
    return requests;
  }

  /**
   * Wait for API response
   */
  static async waitForApiResponse(page: Page, urlPattern: string) {
    const response = await page.waitForResponse((response) => {
      return response.url().includes(urlPattern);
    });
    
    return {
      status: response.status(),
      headers: response.headers(),
      body: await response.text(),
    };
  }
}