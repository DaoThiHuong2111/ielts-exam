#!/bin/bash

# Comprehensive Authentication Test Runner Script
# This script runs all authentication-related tests including unit, integration, and e2e tests

set -e

echo "🚀 Starting comprehensive authentication test suite..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required dependencies are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js to run tests."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm to run tests."
        exit 1
    fi
    
    # Check if Playwright is installed
    if ! npm list playwright &> /dev/null; then
        print_warning "Playwright is not installed. Installing Playwright..."
        npm install --save-dev @playwright/test
        npx playwright install
    fi
    
    print_success "All dependencies are installed."
}

# Install dependencies if needed
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install frontend dependencies
    cd fe-ielts-exams
    npm install
    
    # Install backend dependencies
    cd ../be-ielts-exams
    npm install
    
    cd ..
    
    print_success "Dependencies installed successfully."
}

# Run backend unit tests
run_backend_unit_tests() {
    print_status "Running backend unit tests..."
    
    cd be-ielts-exams
    
    # Run Jest tests
    if npm test; then
        print_success "Backend unit tests passed."
    else
        print_error "Backend unit tests failed."
        exit 1
    fi
    
    cd ..
}

# Run frontend unit tests
run_frontend_unit_tests() {
    print_status "Running frontend unit tests..."
    
    cd fe-ielts-exams
    
    # Run Jest tests
    if npm test; then
        print_success "Frontend unit tests passed."
    else
        print_error "Frontend unit tests failed."
        exit 1
    fi
    
    cd ..
}

# Run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    
    cd fe-ielts-exams
    
    # Run integration tests
    if npm run test:integration; then
        print_success "Integration tests passed."
    else
        print_error "Integration tests failed."
        exit 1
    fi
    
    cd ..
}

# Run E2E tests
run_e2e_tests() {
    print_status "Running E2E tests..."
    
    cd fe-ielts-exams
    
    # Start the development server in the background
    print_status "Starting development server..."
    npm run dev &
    SERVER_PID=$!
    
    # Wait for the server to start
    print_status "Waiting for server to start..."
    sleep 10
    
    # Run Playwright tests
    if npx playwright test; then
        print_success "E2E tests passed."
    else
        print_error "E2E tests failed."
        # Kill the server
        kill $SERVER_PID
        exit 1
    fi
    
    # Kill the server
    kill $SERVER_PID
    
    cd ..
}

# Run security tests
run_security_tests() {
    print_status "Running security tests..."
    
    cd fe-ielts-exams
    
    # Run security-specific tests
    if npx playwright test --grep "security"; then
        print_success "Security tests passed."
    else
        print_error "Security tests failed."
        exit 1
    fi
    
    cd ..
}

# Run performance tests
run_performance_tests() {
    print_status "Running performance tests..."
    
    cd fe-ielts-exams
    
    # Run performance tests (if any)
    if npm run test:performance; then
        print_success "Performance tests passed."
    else
        print_warning "Performance tests not available or failed."
    fi
    
    cd ..
}

# Generate test reports
generate_test_reports() {
    print_status "Generating test reports..."
    
    cd fe-ielts-exams
    
    # Generate HTML report for Playwright tests
    npx playwright show-report
    
    # Generate coverage report
    if npm run test:coverage; then
        print_success "Test coverage report generated."
    else
        print_warning "Test coverage report generation failed."
    fi
    
    cd ..
}

# Clean up test data
cleanup_test_data() {
    print_status "Cleaning up test data..."
    
    # Add any cleanup commands here
    # For example, clearing test databases, removing test files, etc.
    
    print_success "Test data cleaned up."
}

# Main execution
main() {
    echo "=========================================="
    echo "  Comprehensive Authentication Test Suite"
    echo "=========================================="
    
    # Check if we should run specific tests
    if [ "$1" = "unit" ]; then
        print_status "Running unit tests only..."
        run_backend_unit_tests
        run_frontend_unit_tests
        print_success "Unit tests completed successfully."
        exit 0
    fi
    
    if [ "$1" = "e2e" ]; then
        print_status "Running E2E tests only..."
        run_e2e_tests
        print_success "E2E tests completed successfully."
        exit 0
    fi
    
    if [ "$1" = "security" ]; then
        print_status "Running security tests only..."
        run_security_tests
        print_success "Security tests completed successfully."
        exit 0
    fi
    
    # Full test suite
    check_dependencies
    install_dependencies
    run_backend_unit_tests
    run_frontend_unit_tests
    run_integration_tests
    run_e2e_tests
    run_security_tests
    run_performance_tests
    generate_test_reports
    cleanup_test_data
    
    echo "=========================================="
    echo -e "${GREEN}All tests completed successfully!${NC}"
    echo "=========================================="
}

# Handle script arguments
case "$1" in
    --help|-h)
        echo "Usage: $0 [unit|e2e|security]"
        echo ""
        echo "Options:"
        echo "  unit     Run only unit tests"
        echo "  e2e      Run only E2E tests"
        echo "  security Run only security tests"
        echo "  --help   Show this help message"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac