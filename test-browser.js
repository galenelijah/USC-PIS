const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  // Login first
  await page.goto('http://localhost:5173/');
  await page.fill('input[type="email"]', 'auditor@usc.edu.ph'); // assuming this user exists or I'll just use dummy to see if UI renders
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(2000); // wait for redirect
  
  await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  await browser.close();
})();
