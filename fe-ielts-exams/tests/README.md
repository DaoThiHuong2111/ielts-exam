# Authentication Testing Suite

This directory contains a comprehensive testing suite for the authentication system of the IELTS Exams application.

## Test Structure

```
tests/
├── auth/
│   └── auth.e2e.spec.ts          # End-to-end tests for authentication flows
├── data/
│   └── test-data.ts              # Test data and scenarios
├── utils/
│   └── test-utils.ts             # Utility functions for testing
├── global-setup.ts               # Global setup for Playwright tests
├── global-teardown.ts            # Global teardown for Playwright tests
└── README.md                     # This file
```

## Test Categories

### 1. Unit Tests
- Backend unit tests: `be-ielts-exams/src/**/__tests__/*.test.ts`
- Frontend unit tests: `fe-ielts-exams/src/**/__tests__/*.test.ts`

### 2. Integration Tests
- API integration tests: `fe-ielts-exams/src/app/api/**/__tests__/*.test.ts`
- Service integration tests: `fe-ielts-exams/src/services/**/__tests__/*.test.ts`

### 3. End-to-End (E2E) Tests
- Authentication flow tests: `tests/auth/auth.e2e.spec.ts`

### 4. Security Tests
- Rate limiting tests
- CSRF protection tests
- Input sanitization tests
- XSS protection tests

## Test Coverage

The test suite covers the following authentication features:

### User Registration
- Successful registration with valid data
- Validation errors for invalid data
- Weak password detection
- Password confirmation matching
- Duplicate email handling
- XSS protection in user input

### User Login
- Successful login with valid credentials
- Error handling for invalid credentials
- Session persistence
- Automatic token refresh
- Logout functionality

### Password Reset
- Password reset request
- Token validation
- Password reset with valid token
- Error handling for invalid tokens

### Session Management
- Session persistence after page refresh
- Automatic logout for inactive users
- Protected route access control
- Token refresh mechanism

### Security Features
- Rate limiting on authentication endpoints
- CSRF protection
- Input sanitization
- Secure cookie settings
- Password strength requirements

## Running Tests

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Playwright browsers (installed automatically)

### Running All Tests

```bash
# From the project root directory
./fe-ielts-exams/scripts/run-auth-tests.sh
```

### Running Specific Test Categories

```bash
# Run only unit tests
./fe-ielts-exams/scripts/run-auth-tests.sh unit

# Run only E2E tests
./fe-ielts-exams/scripts/run-auth-tests.sh e2e

# Run only security tests
./fe-ielts-exams/scripts/run-auth-tests.sh security
```

### Running Tests with npm

```bash
# From the frontend directory
cd fe-ielts-exams

# Run all tests
npm test

# Run E2E tests
npx playwright test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx playwright test tests/auth/auth.e2e.spec.ts

# Run tests in headed mode (visible browser)
npx playwright test --headed

# Run tests in debug mode
npx playwright test --debug
```

### Running Backend Tests

```bash
# From the backend directory
cd be-ielts-exams

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test auth.service.spec.ts
```

## Test Configuration

### Playwright Configuration
Playwright configuration is defined in `fe-ielts-exams/playwright.config.ts`:

- **Browsers**: Chromium, Firefox, WebKit
- **Mobile Viewports**: Pixel 5, iPhone 12
- **Test Timeout**: 60 seconds
- **Action Timeout**: 10 seconds
- **Web Server**: Automatically starts the development server

### Jest Configuration
Jest configuration is defined in the respective `jest.config.js` files in both frontend and backend directories.

## Test Data

Test data is managed in `tests/data/test-data.ts` and includes:

- **Test Users**: Valid, weak password, XSS attempt, etc.
- **Test Credentials**: Valid, invalid, non-existent, etc.
- **Test Passwords**: Strong, weak, missing requirements, etc.
- **Test Emails**: Valid, invalid, duplicate, etc.
- **Test Tokens**: Valid, invalid, expired, etc.
- **Test Scenarios**: Predefined test scenarios for each feature

## Test Utilities

The `tests/utils/test-utils.ts` file provides utility functions for:

- User registration and login
- Password reset flow
- Session management
- Error handling
- Network simulation
- Screenshot capture
- Console log collection

## Test Reports

### HTML Reports
Playwright generates HTML reports for E2E tests:
```bash
npx playwright show-report
```

### Coverage Reports
Coverage reports are generated for both frontend and backend:
```bash
# Frontend coverage
cd fe-ielts-exams
npm run test:coverage

# Backend coverage
cd be-ielts-exams
npm run test:coverage
```

## Debugging Tests

### Debugging E2E Tests
1. Run tests in debug mode:
   ```bash
   npx playwright test --debug
   ```

2. Use Playwright Inspector:
   ```bash
   npx playwright test --debug
   ```

3. Add breakpoints in tests:
   ```typescript
   await page.pause(); // This will pause the test execution
   ```

### Debugging Unit Tests
1. Run tests with verbose output:
   ```bash
   npm test -- --verbose
   ```

2. Run specific test with debug information:
   ```bash
   npm test -- --testNamePattern="specific test name"
   ```

## Continuous Integration

The test suite is designed to run in CI/CD environments:

### GitHub Actions
The tests can be integrated with GitHub Actions using the following workflow:

```yaml
name: Authentication Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright browsers
      run: npx playwright install --with-deps
    
    - name: Run tests
      run: ./scripts/run-auth-tests.sh
    
    - name: Upload test results
      uses: actions/upload-artifact@v2
      if: always()
      with:
        name: test-results
        path: test-results/
```

## Best Practices

### Writing Tests
1. **Use descriptive test names**: Test names should clearly describe what is being tested
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Use test data utilities**: Leverage the provided test data and utilities
4. **Test both positive and negative scenarios**: Test both success and failure cases
5. **Mock external dependencies**: Mock APIs, databases, and external services
6. **Clean up after tests**: Ensure tests clean up any created data

### Maintaining Tests
1. **Update tests when features change**: Keep tests in sync with code changes
2. **Regular test execution**: Run tests frequently to catch regressions early
3. **Monitor test coverage**: Aim for high test coverage across all features
4. **Review test failures**: Investigate and fix test failures promptly
5. **Refactor tests**: Keep tests clean and maintainable

## Troubleshooting

### Common Issues

1. **Tests failing due to timing issues**:
   - Increase wait timeouts
   - Use more specific selectors
   - Add explicit waits for dynamic content

2. **E2E tests failing in CI but passing locally**:
   - Check CI environment configuration
   - Ensure all dependencies are installed in CI
   - Use headless mode for CI runs

3. **Test data conflicts**:
   - Use unique test data for each test
   - Clean up test data after each test
   - Use database transactions for rollback

### Getting Help

If you encounter issues with the test suite:

1. Check the test logs for error messages
2. Review the test configuration files
3. Consult the Playwright and Jest documentation
4. Reach out to the development team for assistance

## Contributing

When contributing to the test suite:

1. Follow the existing test structure and patterns
2. Add tests for new features and bug fixes
3. Ensure all tests pass before submitting changes
4. Update test data and utilities as needed
5. Document any new test utilities or configurations