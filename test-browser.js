const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  // The server should be running on localhost:5173
  await page.goto('http://localhost:5173/campaigns', { waitUntil: 'networkidle' });
  
  await browser.close();
})();
