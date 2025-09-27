import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('Starting global teardown...');

  // Perform any cleanup tasks here
  // For example, clearing test data from the database
  
  console.log('Global teardown completed');
}

export default globalTeardown;