import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('Starting global setup...');

  // Launch a browser
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to the application
  await page.goto(config.projects[0].use.baseURL!);

  // Wait for the application to be ready
  await page.waitForSelector('body', { state: 'visible' });

  // Close browser
  await context.close();
  await browser.close();

  console.log('Global setup completed');
}

export default globalSetup;