import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto('http://localhost:3003?cam=eave', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);
await page.screenshot({ path: '/tmp/yingzao-eaves2.png', fullPage: false });

// 从前面角度
await page.goto('http://localhost:3003?cam=front', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/yingzao-front.png', fullPage: false });

await browser.close();
console.log('Screenshots saved');
