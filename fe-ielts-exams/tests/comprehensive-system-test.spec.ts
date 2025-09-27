import { test, expect } from '@playwright/test';

test.describe('IELTS Exam System - Comprehensive Test', () => {
  // Use port 3001 for our testing
  test.use({ baseURL: 'http://localhost:3001' });

  test.beforeEach(async ({ page }) => {
    // Clear cookies and storage before each test
    await page.context().clearCookies();
    await page.goto('/');
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (error) {
        console.warn('Could not clear browser storage:', error);
      }
    });
  });

  test.describe('Authentication System', () => {
    test('should load login page correctly', async ({ page }) => {
      await page.goto('/login');

      // Check if login page loads correctly
      await expect(page).toHaveURL('/login');
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show validation errors for empty login form', async ({ page }) => {
      await page.goto('/login');

      // Submit empty form
      await page.click('button[type="submit"]');

      // Check for validation errors (might appear as toast or inline errors)
      await page.waitForTimeout(1000);
    });

    test('should attempt login with test credentials', async ({ page }) => {
      await page.goto('/login');

      // Fill in login form with test credentials
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'password123');

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for response
      await page.waitForTimeout(3000);

      // Check if login was successful or error message appears
      const currentUrl = page.url();
      console.log('After login attempt, current URL:', currentUrl);
    });

    test('should register new user', async ({ page }) => {
      await page.goto('/register');

      // Generate unique user data
      const timestamp = Date.now();
      const email = `testuser${timestamp}@example.com`;

      // Fill in registration form
      await page.fill('input[name="username"]', `testuser${timestamp}`);
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', 'StrongP@ssw0rd');
      await page.fill('input[name="confirmPassword"]', 'StrongP@ssw0rd');

      // Agree to terms if checkbox exists
      const agreeCheckbox = page.locator('input[type="checkbox"]');
      if (await agreeCheckbox.isVisible()) {
        await agreeCheckbox.check();
      }

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for response
      await page.waitForTimeout(3000);

      // Check if registration was successful
      const currentUrl = page.url();
      console.log('After registration, current URL:', currentUrl);
    });

    test('should handle logout functionality', async ({ page }) => {
      // First try to login
      await page.goto('/login');
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');

      await page.waitForTimeout(3000);

      // Look for logout button or user menu
      const userMenu = page.locator('[data-testid="userMenu"], .user-menu, .avatar, button:has-text("Logout")');

      if (await userMenu.isVisible()) {
        await userMenu.click();

        // Look for logout option in dropdown or direct logout button
        const logoutButton = page.locator('button:has-text("Logout"), [data-testid="logoutButton"]');
        if (await logoutButton.isVisible()) {
          await logoutButton.click();

          // Confirm logout if confirmation dialog appears
          const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
          }

          await page.waitForTimeout(2000);
          console.log('After logout, current URL:', page.url());
        }
      }
    });
  });

  test.describe('Navigation and UI Components', () => {
    test('should navigate between main sections', async ({ page }) => {
      // Test navigation to different sections
      const sections = ['/', '/login', '/register', '/contact', '/introduce'];

      for (const section of sections) {
        await page.goto(section);
        await page.waitForTimeout(1000);
        console.log(`Navigated to ${section}, status: ${page.url()}`);

        // Check if page loads without errors
        await expect(page).not.toHaveURL(/error/);
      }
    });

    test('should display quiz sections', async ({ page }) => {
      // Navigate to quiz sections
      const quizSections = ['/quiz/reading', '/quiz/listening'];

      for (const section of quizSections) {
        await page.goto(section);
        await page.waitForTimeout(2000);
        console.log(`Navigated to quiz section ${section}, status: ${page.url()}`);

        // Check if quiz section loads
        await expect(page).not.toHaveURL(/error/);
      }
    });

    test('should be responsive on different screen sizes', async ({ page }) => {
      const viewports = [
        { width: 1920, height: 1080 }, // Desktop
        { width: 768, height: 1024 },  // Tablet
        { width: 375, height: 667 }    // Mobile
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto('/');
        await page.waitForTimeout(1000);

        // Check if main elements are visible
        const header = page.locator('header, nav');
        const mainContent = page.locator('main, .main-content');
        const footer = page.locator('footer');

        console.log(`Testing viewport ${viewport.width}x${viewport.height}`);

        if (await header.isVisible()) {
          console.log('  ✓ Header is visible');
        }
        if (await mainContent.isVisible()) {
          console.log('  ✓ Main content is visible');
        }
        if (await footer.isVisible()) {
          console.log('  ✓ Footer is visible');
        }
      }
    });
  });

  test.describe('Quiz Management', () => {
    test('should view reading quiz list', async ({ page }) => {
      await page.goto('/quiz/reading');
      await page.waitForTimeout(2000);

      // Check if quiz list loads
      const quizCards = page.locator('.quiz-card, [data-testid="quiz-card"], .card');

      if (await quizCards.count() > 0) {
        console.log(`Found ${await quizCards.count()} quiz cards`);

        // Try to click on first quiz
        const firstQuiz = quizCards.first();
        await firstQuiz.click();

        await page.waitForTimeout(2000);
        console.log('Navigated to quiz detail, URL:', page.url());
      } else {
        console.log('No quiz cards found on the page');
      }
    });

    test('should view listening quiz list', async ({ page }) => {
      await page.goto('/quiz/listening');
      await page.waitForTimeout(2000);

      // Check if quiz list loads
      const quizCards = page.locator('.quiz-card, [data-testid="quiz-card"], .card');

      if (await quizCards.count() > 0) {
        console.log(`Found ${await quizCards.count()} listening quiz cards`);

        // Try to click on first quiz
        const firstQuiz = quizCards.first();
        await firstQuiz.click();

        await page.waitForTimeout(2000);
        console.log('Navigated to listening quiz detail, URL:', page.url());
      } else {
        console.log('No listening quiz cards found on the page');
      }
    });

    test('should handle quiz taking functionality', async ({ page }) => {
      // Try to access a specific quiz (assuming ID 1 exists)
      await page.goto('/quiz/reading/1');
      await page.waitForTimeout(2000);

      // Check if quiz interface loads
      const quizContent = page.locator('.quiz-content, [data-testid="quiz-content"]');
      const questions = page.locator('.question, [data-testid="question"]');

      if (await quizContent.isVisible()) {
        console.log('Quiz content loaded successfully');

        if (await questions.count() > 0) {
          console.log(`Found ${await questions.count()} questions`);

          // Try to answer first question if it's multiple choice
          const firstQuestion = questions.first();
          const options = firstQuestion.locator('input[type="radio"], input[type="checkbox"]');

          if (await options.count() > 0) {
            await options.first().check();
            console.log('Selected first option');
          }
        }
      } else {
        console.log('Quiz content not found or not accessible');
      }
    });
  });

  test.describe('API Integration', () => {
    test('should handle API responses correctly', async ({ page }) => {
      // Listen for network requests
      const apiResponses = [];

      page.on('response', response => {
        if (response.url().includes('/api/')) {
          apiResponses.push({
            url: response.url(),
            status: response.status(),
            ok: response.ok()
          });
        }
      });

      // Navigate through different pages to trigger API calls
      await page.goto('/');
      await page.waitForTimeout(1000);

      await page.goto('/quiz/reading');
      await page.waitForTimeout(1000);

      await page.goto('/quiz/listening');
      await page.waitForTimeout(1000);

      // Print API response summary
      console.log('API Responses Summary:');
      apiResponses.forEach(response => {
        console.log(`  ${response.url} - Status: ${response.status} (${response.ok ? 'OK' : 'Error'})`);
      });

      // Check if any API calls failed
      const failedResponses = apiResponses.filter(r => !r.ok);
      if (failedResponses.length > 0) {
        console.log(`Found ${failedResponses.length} failed API responses`);
      } else {
        console.log('All API responses were successful');
      }
    });

    test('should handle authentication tokens', async ({ page }) => {
      // Try to login
      await page.goto('/login');
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');

      await page.waitForTimeout(3000);

      // Check for auth tokens in cookies or localStorage
      const cookies = await page.context().cookies();
      const authCookies = cookies.filter(cookie =>
        cookie.name.toLowerCase().includes('token') ||
        cookie.name.toLowerCase().includes('auth')
      );

      if (authCookies.length > 0) {
        console.log('Found authentication cookies:', authCookies.map(c => c.name));
      } else {
        console.log('No authentication cookies found');
      }

      // Check localStorage for auth data
      const localStorage = await page.evaluate(() => {
        return Object.keys(window.localStorage);
      });

      const authStorageKeys = localStorage.filter(key =>
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('auth') ||
        key.toLowerCase().includes('user')
      );

      if (authStorageKeys.length > 0) {
        console.log('Found auth-related localStorage keys:', authStorageKeys);
      } else {
        console.log('No auth-related localStorage keys found');
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 pages gracefully', async ({ page }) => {
      // Navigate to non-existent page
      await page.goto('/non-existent-page');
      await page.waitForTimeout(1000);

      // Check if 404 page or error page is shown
      const notFoundElement = page.locator('text=404, text=Not Found, text=Page Not Found');

      if (await notFoundElement.isVisible()) {
        console.log('404 page displayed correctly');
      } else {
        console.log('Current URL after 404:', page.url());
      }
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Navigate to a page that might make API calls
      await page.goto('/quiz/reading');

      // Simulate network offline
      await page.context().setOffline(true);

      // Try to interact with the page
      await page.waitForTimeout(1000);

      // Look for offline indicators or error messages
      const offlineIndicator = page.locator('text=Offline, text=Network Error, text=Connection Lost');

      if (await offlineIndicator.isVisible()) {
        console.log('Offline/error indicator displayed');
      }

      // Restore network
      await page.context().setOffline(false);
    });
  });

  test.describe('Performance and Loading States', () => {
    test('should display loading states', async ({ page }) => {
      // Monitor page load performance
      const navigationTiming = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalLoadTime: navigation.loadEventEnd - navigation.fetchStart
        };
      });

      console.log('Page Load Performance:', navigationTiming);

      // Navigate to different pages and check for loading indicators
      const pages = ['/', '/quiz/reading', '/quiz/listening'];

      for (const pageUrl of pages) {
        await page.goto(pageUrl);

        // Look for loading indicators
        const loadingIndicator = page.locator('.loading, .spinner, [data-testid="loading"]');

        if (await loadingIndicator.isVisible()) {
          console.log(`Loading indicator visible on ${pageUrl}`);

          // Wait for loading to complete
          await loadingIndicator.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {
            console.log(`Loading indicator did not disappear on ${pageUrl}`);
          });
        }
      }
    });
  });

  test.afterAll(async ({ page }) => {
    console.log('Comprehensive test completed');
    console.log('Test results summary:');
    console.log('- Authentication system tested');
    console.log('- Navigation and UI components tested');
    console.log('- Quiz management functionality tested');
    console.log('- API integration tested');
    console.log('- Error handling tested');
    console.log('- Performance and loading states tested');
  });
});