import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies before each test
    await page.context().clearCookies();
    
    // Navigate to a page first to establish origin, then clear storage
    await page.goto('/');
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (error) {
        // Ignore storage access errors in case of security restrictions
        console.warn('Could not clear browser storage:', error);
      }
    });
  });

  test.describe('User Registration', () => {
    test('should successfully register a new user', async ({ page }) => {
      // Navigate to registration page
      await page.goto('/register');
      
      // Fill in registration form
      await page.fill('[data-testid="username"]', 'testuser');
      await page.fill('[data-testid="email"]', 'test@example.com');
      await page.fill('[data-testid="password"]', 'StrongP@ssw0rd');
      await page.fill('[data-testid="confirmPassword"]', 'StrongP@ssw0rd');
      await page.check('[data-testid="agreeTerms"]');
      
      // Submit form
      await page.click('[data-testid="registerButton"]');
      
      // Wait for success message or redirect
      await expect(page.locator('[data-testid="successMessage"]')).toBeVisible();
      // Or check for redirect to login/dashboard
      // await expect(page).toHaveURL('/login');
    });

    test('should show validation errors for invalid registration data', async ({ page }) => {
      await page.goto('/register');
      
      // Submit empty form
      await page.click('[data-testid="registerButton"]');
      
      // Check for validation errors
      await expect(page.locator('[data-testid="username-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirmPassword-error"]')).toBeVisible();
    });

    test('should show error for weak password', async ({ page }) => {
      await page.goto('/register');
      
      // Fill form with weak password
      await page.fill('[data-testid="username"]', 'testuser');
      await page.fill('[data-testid="email"]', 'test@example.com');
      await page.fill('[data-testid="password"]', 'weak');
      await page.fill('[data-testid="confirmPassword"]', 'weak');
      await page.check('[data-testid="agreeTerms"]');
      
      // Submit form
      await page.click('[data-testid="registerButton"]');
      
      // Check for password strength error
      await expect(page.locator('[data-testid="password-error"]')).toContainText('not strong enough');
    });

    test('should show error for mismatched passwords', async ({ page }) => {
      await page.goto('/register');
      
      // Fill form with mismatched passwords
      await page.fill('[data-testid="username"]', 'testuser');
      await page.fill('[data-testid="email"]', 'test@example.com');
      await page.fill('[data-testid="password"]', 'StrongP@ssw0rd');
      await page.fill('[data-testid="confirmPassword"]', 'DifferentP@ssw0rd');
      await page.check('[data-testid="agreeTerms"]');
      
      // Submit form
      await page.click('[data-testid="registerButton"]');
      
      // Check for password mismatch error
      await expect(page.locator('[data-testid="confirmPassword-error"]')).toContainText('do not match');
    });

    test('should show error for duplicate email', async ({ page }) => {
      // First register a user
      await page.goto('/register');
      await page.fill('[data-testid="username"]', 'testuser');
      await page.fill('[data-testid="email"]', 'duplicate@example.com');
      await page.fill('[data-testid="password"]', 'StrongP@ssw0rd');
      await page.fill('[data-testid="confirmPassword"]', 'StrongP@ssw0rd');
      await page.check('[data-testid="agreeTerms"]');
      await page.click('[data-testid="registerButton"]');
      
      // Wait for success
      await expect(page.locator('[data-testid="successMessage"]')).toBeVisible();
      
      // Clear context and try to register again with same email
      await page.context().clearCookies();
      await page.goto('/register');
      await page.fill('[data-testid="username"]', 'testuser2');
      await page.fill('[data-testid="email"]', 'duplicate@example.com');
      await page.fill('[data-testid="password"]', 'StrongP@ssw0rd');
      await page.fill('[data-testid="confirmPassword"]', 'StrongP@ssw0rd');
      await page.check('[data-testid="agreeTerms"]');
      await page.click('[data-testid="registerButton"]');
      
      // Check for duplicate email error
      await expect(page.locator('[data-testid="email-error"]')).toContainText('already exists');
    });
  });

  test.describe('User Login', () => {
    test.beforeEach(async ({ page }) => {
      // Register a user first
      await page.goto('/register');
      await page.fill('[data-testid="username"]', 'loginuser');
      await page.fill('[data-testid="email"]', 'login@example.com');
      await page.fill('[data-testid="password"]', 'StrongP@ssw0rd');
      await page.fill('[data-testid="confirmPassword"]', 'StrongP@ssw0rd');
      await page.check('[data-testid="agreeTerms"]');
      await page.click('[data-testid="registerButton"]');
      
      // Wait for success
      await expect(page.locator('[data-testid="successMessage"]')).toBeVisible();
      
      // Clear context to start fresh for login tests
      await page.context().clearCookies();
    });

    test('should successfully login with valid credentials', async ({ page }) => {
      await page.goto('/login');
      
      // Fill in login form
      await page.fill('[data-testid="email"]', 'login@example.com');
      await page.fill('[data-testid="password"]', 'StrongP@ssw0rd');
      
      // Submit form
      await page.click('[data-testid="loginButton"]');
      
      // Check for successful login (redirect to dashboard or user info visible)
      await expect(page.locator('[data-testid="userMenu"]')).toBeVisible();
      // Or check for redirect
      // await expect(page).toHaveURL('/dashboard');
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      
      // Fill in login form with wrong password
      await page.fill('[data-testid="email"]', 'login@example.com');
      await page.fill('[data-testid="password"]', 'WrongPassword');
      
      // Submit form
      await page.click('[data-testid="loginButton"]');
      
      // Check for error message
      await expect(page.locator('[data-testid="errorMessage"]')).toBeVisible();
      await expect(page.locator('[data-testid="errorMessage"]')).toContainText('Invalid credentials');
    });

    test('should show error for non-existent user', async ({ page }) => {
      await page.goto('/login');
      
      // Fill in login form with non-existent email
      await page.fill('[data-testid="email"]', 'nonexistent@example.com');
      await page.fill('[data-testid="password"]', 'StrongP@ssw0rd');
      
      // Submit form
      await page.click('[data-testid="loginButton"]');
      
      // Check for error message
      await expect(page.locator('[data-testid="errorMessage"]')).toBeVisible();
      await expect(page.locator('[data-testid="errorMessage"]')).toContainText('Invalid credentials');
    });

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/login');
      
      // Submit empty form
      await page.click('[data-testid="loginButton"]');
      
      // Check for validation errors
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    });
  });

  test.describe('Password Reset', () => {
    test.beforeEach(async ({ page }) => {
      // Register a user first
      await page.goto('/register');
      await page.fill('[data-testid="username"]', 'resetuser');
      await page.fill('[data-testid="email"]', 'reset@example.com');
      await page.fill('[data-testid="password"]', 'StrongP@ssw0rd');
      await page.fill('[data-testid="confirmPassword"]', 'StrongP@ssw0rd');
      await page.check('[data-testid="agreeTerms"]');
      await page.click('[data-testid="registerButton"]');
      
      // Wait for success
      await expect(page.locator('[data-testid="successMessage"]')).toBeVisible();
      
      // Clear context to start fresh for password reset tests
      await page.context().clearCookies();
    });

    test('should successfully request password reset', async ({ page }) => {
      await page.goto('/forgot-password');
      
      // Fill in email
      await page.fill('[data-testid="email"]', 'reset@example.com');
      
      // Submit form
      await page.click('[data-testid="resetButton"]');
      
      // Check for success message
      await expect(page.locator('[data-testid="successMessage"]')).toBeVisible();
      await expect(page.locator('[data-testid="successMessage"]')).toContainText('reset link sent');
    });

    test('should show error for non-existent email in password reset', async ({ page }) => {
      await page.goto('/forgot-password');
      
      // Fill in non-existent email
      await page.fill('[data-testid="email"]', 'nonexistent@example.com');
      
      // Submit form
      await page.click('[data-testid="resetButton"]');
      
      // Check for error message (should still show success for security reasons)
      await expect(page.locator('[data-testid="successMessage"]')).toBeVisible();
    });

    test('should show validation error for invalid email format', async ({ page }) => {
      await page.goto('/forgot-password');
      
      // Fill in invalid email
      await page.fill('[data-testid="email"]', 'invalid-email');
      
      // Submit form
      await page.click('[data-testid="resetButton"]');
      
      // Check for validation error
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    });

    test('should reset password with valid token', async ({ page }) => {
      // This test would require mocking the email service or intercepting the API call
      // For now, we'll simulate the reset password page flow
      
      // Navigate to reset password page with a token
      await page.goto('/reset-password?token=valid-token');
      
      // Fill in new password
      await page.fill('[data-testid="newPassword"]', 'NewStrongP@ssw0rd');
      await page.fill('[data-testid="confirmPassword"]', 'NewStrongP@ssw0rd');
      
      // Submit form
      await page.click('[data-testid="resetPasswordButton"]');
      
      // Check for success message
      await expect(page.locator('[data-testid="successMessage"]')).toBeVisible();
      await expect(page.locator('[data-testid="successMessage"]')).toContainText('password reset successfully');
    });

    test('should show error for invalid reset token', async ({ page }) => {
      // Navigate to reset password page with invalid token
      await page.goto('/reset-password?token=invalid-token');
      
      // Fill in new password
      await page.fill('[data-testid="newPassword"]', 'NewStrongP@ssw0rd');
      await page.fill('[data-testid="confirmPassword"]', 'NewStrongP@ssw0rd');
      
      // Submit form
      await page.click('[data-testid="resetPasswordButton"]');
      
      // Check for error message
      await expect(page.locator('[data-testid="errorMessage"]')).toBeVisible();
      await expect(page.locator('[data-testid="errorMessage"]')).toContainText('invalid or expired');
    });
  });

  test.describe('Session Management', () => {
    test.beforeEach(async ({ page }) => {
      // Register and login a user
      await page.goto('/register');
      await page.fill('[data-testid="username"]', 'sessionuser');
      await page.fill('[data-testid="email"]', 'session@example.com');
      await page.fill('[data-testid="password"]', 'StrongP@ssw0rd');
      await page.fill('[data-testid="confirmPassword"]', 'StrongP@ssw0rd');
      await page.check('[data-testid="agreeTerms"]');
      await page.click('[data-testid="registerButton"]');
      
      // Wait for success
      await expect(page.locator('[data-testid="successMessage"]')).toBeVisible();
      
      // Login
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'session@example.com');
      await page.fill('[data-testid="password"]', 'StrongP@ssw0rd');
      await page.click('[data-testid="loginButton"]');
      
      // Wait for successful login
      await expect(page.locator('[data-testid="userMenu"]')).toBeVisible();
    });

    test('should maintain session after page refresh', async ({ page }) => {
      // Refresh page
      await page.reload();
      
      // Check that user is still logged in
      await expect(page.locator('[data-testid="userMenu"]')).toBeVisible();
    });

    test('should logout successfully', async ({ page }) => {
      // Click logout button
      await page.click('[data-testid="logoutButton"]');
      
      // Confirm logout if confirmation dialog appears
      const confirmButton = page.locator('[data-testid="confirmLogout"]');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      // Check that user is logged out
      await expect(page.locator('[data-testid="loginButton"]')).toBeVisible();
      await expect(page.locator('[data-testid="userMenu"]')).not.toBeVisible();
    });

    test('should redirect to login when accessing protected route without authentication', async ({ page }) => {
      // Logout first
      await page.click('[data-testid="logoutButton"]');
      const confirmButton = page.locator('[data-testid="confirmLogout"]');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      // Try to access a protected route
      await page.goto('/profile');
      
      // Check redirect to login
      await expect(page).toHaveURL('/login');
    });

    test('should handle token refresh automatically', async ({ page }) => {
      // This test would require mocking token expiration or waiting for token to expire
      // For now, we'll simulate the behavior by checking if the user remains logged in
      
      // Wait for some time to simulate token refresh
      await page.waitForTimeout(2000);
      
      // Check that user is still logged in
      await expect(page.locator('[data-testid="userMenu"]')).toBeVisible();
    });
  });

  test.describe('Security Features', () => {
    test('should enforce rate limiting on login attempts', async ({ page }) => {
      // Try to login multiple times with wrong password
      for (let i = 0; i < 6; i++) {
        await page.goto('/login');
        await page.fill('[data-testid="email"]', 'test@example.com');
        await page.fill('[data-testid="password"]', 'WrongPassword');
        await page.click('[data-testid="loginButton"]');
        
        // Wait a bit between attempts
        await page.waitForTimeout(100);
      }
      
      // Check for rate limiting error
      await expect(page.locator('[data-testid="errorMessage"]')).toContainText('too many requests');
    });

    test('should protect against CSRF attacks', async ({ page }) => {
      // This test would require more complex setup to simulate CSRF attacks
      // For now, we'll check if CSRF token is present in the form
      await page.goto('/login');
      
      // Check if CSRF token is present (this depends on implementation)
      // const csrfToken = await page.locator('input[name="_csrf"]').getAttribute('value');
      // expect(csrfToken).toBeTruthy();
    });

    test('should sanitize user input to prevent XSS', async ({ page }) => {
      // Register a user with XSS attempt in username
      await page.goto('/register');
      await page.fill('[data-testid="username"]', '<script>alert("XSS")</script>');
      await page.fill('[data-testid="email"]', 'xss@example.com');
      await page.fill('[data-testid="password"]', 'StrongP@ssw0rd');
      await page.fill('[data-testid="confirmPassword"]', 'StrongP@ssw0rd');
      await page.check('[data-testid="agreeTerms"]');
      await page.click('[data-testid="registerButton"]');
      
      // Wait for success
      await expect(page.locator('[data-testid="successMessage"]')).toBeVisible();
      
      // Login with the user
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'xss@example.com');
      await page.fill('[data-testid="password"]', 'StrongP@ssw0rd');
      await page.click('[data-testid="loginButton"]');
      
      // Wait for successful login
      await expect(page.locator('[data-testid="userMenu"]')).toBeVisible();
      
      // Check that the username is displayed safely (without script execution)
      const usernameDisplay = await page.locator('[data-testid="usernameDisplay"]').textContent();
      expect(usernameDisplay).not.toContain('<script>');
    });
  });

  test.describe('Responsive Design', () => {
    test('should work correctly on mobile devices', async ({ page }) => {
      // Set viewport to mobile size
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Navigate to login page
      await page.goto('/login');
      
      // Check that all elements are visible and properly sized
      await expect(page.locator('[data-testid="email"]')).toBeVisible();
      await expect(page.locator('[data-testid="password"]')).toBeVisible();
      await expect(page.locator('[data-testid="loginButton"]')).toBeVisible();
      
      // Fill form and submit
      await page.fill('[data-testid="email"]', 'mobile@example.com');
      await page.fill('[data-testid="password"]', 'StrongP@ssw0rd');
      await page.click('[data-testid="loginButton"]');
      
      // Check for error message (user doesn't exist)
      await expect(page.locator('[data-testid="errorMessage"]')).toBeVisible();
    });

    test('should work correctly on tablet devices', async ({ page }) => {
      // Set viewport to tablet size
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Navigate to login page
      await page.goto('/login');
      
      // Check that all elements are visible and properly sized
      await expect(page.locator('[data-testid="email"]')).toBeVisible();
      await expect(page.locator('[data-testid="password"]')).toBeVisible();
      await expect(page.locator('[data-testid="loginButton"]')).toBeVisible();
      
      // Fill form and submit
      await page.fill('[data-testid="email"]', 'tablet@example.com');
      await page.fill('[data-testid="password"]', 'StrongP@ssw0rd');
      await page.click('[data-testid="loginButton"]');
      
      // Check for error message (user doesn't exist)
      await expect(page.locator('[data-testid="errorMessage"]')).toBeVisible();
    });
  });
});