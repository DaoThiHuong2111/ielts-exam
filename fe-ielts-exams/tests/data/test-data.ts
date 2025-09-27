/**
 * Test data for authentication tests
 */
export const TestUsers = {
  validUser: {
    username: 'testuser',
    email: 'test@example.com',
    password: 'StrongP@ssw0rd',
  },
  weakPasswordUser: {
    username: 'weakuser',
    email: 'weak@example.com',
    password: 'weak',
  },
  mismatchedPasswordUser: {
    username: 'mismatchuser',
    email: 'mismatch@example.com',
    password: 'StrongP@ssw0rd',
    confirmPassword: 'DifferentP@ssw0rd',
  },
  xssAttemptUser: {
    username: '<script>alert("XSS")</script>',
    email: 'xss@example.com',
    password: 'StrongP@ssw0rd',
  },
  longUsernameUser: {
    username: 'a'.repeat(100), // Very long username
    email: 'long@example.com',
    password: 'StrongP@ssw0rd',
  },
  specialCharsUser: {
    username: 'user!@#$%^&*()',
    email: 'special@example.com',
    password: 'StrongP@ssw0rd',
  },
};

export const TestCredentials = {
  valid: {
    email: 'test@example.com',
    password: 'StrongP@ssw0rd',
  },
  invalidPassword: {
    email: 'test@example.com',
    password: 'WrongPassword',
  },
  nonExistentUser: {
    email: 'nonexistent@example.com',
    password: 'StrongP@ssw0rd',
  },
  empty: {
    email: '',
    password: '',
  },
  invalidEmail: {
    email: 'invalid-email',
    password: 'StrongP@ssw0rd',
  },
};

export const TestPasswords = {
  strong: 'StrongP@ssw0rd',
  weak: 'weak',
  noUppercase: 'strongp@ssw0rd',
  noLowercase: 'STRONGP@SSW0RD',
  noNumbers: 'StrongPassword!',
  noSpecialChars: 'StrongPassword123',
  withCommonWords: 'Password123!',
  withRepeatingChars: 'Passswoord123!',
  withSequentialNumbers: 'Password123!',
  withSequentialLetters: 'Abcdefgh123!',
  veryLong: 'a'.repeat(50) + 'A1!',
  veryShort: 'A1!',
};

export const TestEmails = {
  valid: 'test@example.com',
  invalid: 'invalid-email',
  alreadyRegistered: 'duplicate@example.com',
  nonExistent: 'nonexistent@example.com',
  withSpecialChars: 'test+alias@example.com',
  long: 'a'.repeat(50) + '@example.com',
};

export const TestTokens = {
  valid: 'valid-token-12345',
  invalid: 'invalid-token',
  expired: 'expired-token',
  malformed: 'malformed-token!',
  empty: '',
  veryLong: 'a'.repeat(1000),
};

export const TestRoutes = {
  public: [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/about',
    '/contact',
  ],
  protected: [
    '/dashboard',
    '/profile',
    '/settings',
    '/quiz',
    '/results',
  ],
  auth: [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/auth/refresh',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
  ],
};

export const TestScenarios = {
  registration: {
    success: {
      description: 'Successful user registration',
      input: TestUsers.validUser,
      expected: {
        status: 'success',
        message: 'User registered successfully',
      },
    },
    weakPassword: {
      description: 'Registration with weak password',
      input: TestUsers.weakPasswordUser,
      expected: {
        status: 'error',
        message: 'Password is not strong enough',
      },
    },
    mismatchedPasswords: {
      description: 'Registration with mismatched passwords',
      input: TestUsers.mismatchedPasswordUser,
      expected: {
        status: 'error',
        message: 'Passwords do not match',
      },
    },
    duplicateEmail: {
      description: 'Registration with duplicate email',
      input: {
        ...TestUsers.validUser,
        email: TestEmails.alreadyRegistered,
      },
      expected: {
        status: 'error',
        message: 'Email already exists',
      },
    },
    xssAttempt: {
      description: 'Registration with XSS attempt',
      input: TestUsers.xssAttemptUser,
      expected: {
        status: 'success',
        message: 'User registered successfully',
        sanitized: true,
      },
    },
  },
  login: {
    success: {
      description: 'Successful login',
      input: TestCredentials.valid,
      expected: {
        status: 'success',
        redirect: '/dashboard',
      },
    },
    invalidPassword: {
      description: 'Login with invalid password',
      input: TestCredentials.invalidPassword,
      expected: {
        status: 'error',
        message: 'Invalid credentials',
      },
    },
    nonExistentUser: {
      description: 'Login with non-existent user',
      input: TestCredentials.nonExistentUser,
      expected: {
        status: 'error',
        message: 'Invalid credentials',
      },
    },
    emptyFields: {
      description: 'Login with empty fields',
      input: TestCredentials.empty,
      expected: {
        status: 'error',
        message: 'Email and password are required',
      },
    },
  },
  passwordReset: {
    requestSuccess: {
      description: 'Successful password reset request',
      input: {
        email: TestEmails.valid,
      },
      expected: {
        status: 'success',
        message: 'Password reset link sent',
      },
    },
    requestNonExistent: {
      description: 'Password reset request for non-existent email',
      input: {
        email: TestEmails.nonExistent,
      },
      expected: {
        status: 'success', // Should still show success for security
        message: 'Password reset link sent',
      },
    },
    resetSuccess: {
      description: 'Successful password reset',
      input: {
        token: TestTokens.valid,
        newPassword: TestPasswords.strong,
      },
      expected: {
        status: 'success',
        message: 'Password reset successfully',
      },
    },
    resetInvalidToken: {
      description: 'Password reset with invalid token',
      input: {
        token: TestTokens.invalid,
        newPassword: TestPasswords.strong,
      },
      expected: {
        status: 'error',
        message: 'Invalid or expired token',
      },
    },
  },
  session: {
    persistence: {
      description: 'Session persistence after page refresh',
      setup: async (page: any) => {
        // Login user first
        await page.goto('/login');
        await page.fill('[data-testid="email"]', TestCredentials.valid.email);
        await page.fill('[data-testid="password"]', TestCredentials.valid.password);
        await page.click('[data-testid="loginButton"]');
        await page.waitForSelector('[data-testid="userMenu"]');
      },
      test: async (page: any) => {
        await page.reload();
        return await page.locator('[data-testid="userMenu"]').isVisible();
      },
      expected: true,
    },
    logout: {
      description: 'Successful logout',
      setup: async (page: any) => {
        // Login user first
        await page.goto('/login');
        await page.fill('[data-testid="email"]', TestCredentials.valid.email);
        await page.fill('[data-testid="password"]', TestCredentials.valid.password);
        await page.click('[data-testid="loginButton"]');
        await page.waitForSelector('[data-testid="userMenu"]');
      },
      test: async (page: any) => {
        await page.click('[data-testid="logoutButton"]');
        const confirmButton = page.locator('[data-testid="confirmLogout"]');
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
        return await page.locator('[data-testid="loginButton"]').isVisible();
      },
      expected: true,
    },
    protectedRouteAccess: {
      description: 'Redirect to login when accessing protected route without authentication',
      setup: async (page: any) => {
        // Ensure user is logged out
        await page.context().clearCookies();
      },
      test: async (page: any) => {
        await page.goto('/dashboard');
        return page.url().includes('/login');
      },
      expected: true,
    },
  },
  security: {
    rateLimiting: {
      description: 'Rate limiting on login attempts',
      setup: async (page: any) => {
        // No setup needed
      },
      test: async (page: any) => {
        // Try to login multiple times with wrong password
        for (let i = 0; i < 6; i++) {
          await page.goto('/login');
          await page.fill('[data-testid="email"]', TestCredentials.valid.email);
          await page.fill('[data-testid="password"]', TestCredentials.invalidPassword.password);
          await page.click('[data-testid="loginButton"]');
          await page.waitForTimeout(100);
        }
        
        const errorMessage = page.locator('[data-testid="errorMessage"]');
        return await errorMessage.isVisible() && (await errorMessage.textContent())?.includes('too many requests');
      },
      expected: true,
    },
    xssProtection: {
      description: 'XSS protection in user input',
      setup: async (page: any) => {
        // Register user with XSS attempt
        await page.goto('/register');
        await page.fill('[data-testid="username"]', TestUsers.xssAttemptUser.username);
        await page.fill('[data-testid="email"]', TestUsers.xssAttemptUser.email);
        await page.fill('[data-testid="password"]', TestUsers.xssAttemptUser.password);
        await page.fill('[data-testid="confirmPassword"]', TestUsers.xssAttemptUser.password);
        await page.check('[data-testid="agreeTerms"]');
        await page.click('[data-testid="registerButton"]');
        await page.waitForSelector('[data-testid="successMessage"]');
        
        // Login with the user
        await page.goto('/login');
        await page.fill('[data-testid="email"]', TestUsers.xssAttemptUser.email);
        await page.fill('[data-testid="password"]', TestUsers.xssAttemptUser.password);
        await page.click('[data-testid="loginButton"]');
        await page.waitForSelector('[data-testid="userMenu"]');
      },
      test: async (page: any) => {
        const usernameDisplay = page.locator('[data-testid="usernameDisplay"]');
        const usernameText = await usernameDisplay.textContent();
        return usernameText && !usernameText.includes('<script>');
      },
      expected: true,
    },
  },
};

export const TestDataGenerators = {
  randomEmail: () => {
    const randomString = Math.random().toString(36).substring(2, 15);
    return `test-${randomString}@example.com`;
  },
  randomUsername: () => {
    const randomString = Math.random().toString(36).substring(2, 15);
    return `user-${randomString}`;
  },
  randomPassword: (strength: 'weak' | 'medium' | 'strong' = 'strong') => {
    const randomString = Math.random().toString(36).substring(2, 15);
    
    if (strength === 'weak') {
      return randomString;
    }
    
    if (strength === 'medium') {
      return `${randomString}123`;
    }
    
    // Strong password with uppercase, lowercase, numbers, and special chars
    const uppercase = randomString.substring(0, 1).toUpperCase();
    const lowercase = randomString.substring(1);
    const numbers = Math.floor(Math.random() * 1000);
    const specialChars = '!@#$%^&*';
    const randomSpecialChar = specialChars[Math.floor(Math.random() * specialChars.length)];
    
    return `${uppercase}${lowercase}${numbers}${randomSpecialChar}`;
  },
  randomToken: () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  },
};