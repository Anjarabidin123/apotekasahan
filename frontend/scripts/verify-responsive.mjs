import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import os from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'dist');

// Find available browser executable
function findBrowser() {
  const candidates = [
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    process.env.CHROME_BIN,
  ].filter(Boolean);

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  throw new Error('No supported Chrome or Edge browser executable found.');
}

// Minimal static file server for dist
function startServer() {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.json': 'application/json',
  };

  const server = http.createServer((req, res) => {
    let cleanUrl = req.url.split('?')[0];
    let filePath = path.join(distDir, cleanUrl);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
      filePath = path.join(distDir, 'index.html');
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (err) {
      res.writeHead(500);
      res.end('Error loading ' + filePath);
    }
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port });
    });
  });
}

// Simple CDP client over native WebSocket
class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) {
            reject(new Error(msg.error.message || 'CDP Error'));
          } else {
            resolve(msg.result);
          }
        }
      };
    });
  }

  send(method, params = {}) {
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      const desc =
        res.exceptionDetails.exception?.description ||
        res.exceptionDetails.text ||
        JSON.stringify(res.exceptionDetails);
      throw new Error(`CDP Evaluate Exception: ${desc}`);
    }
    return res.result?.value;
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function navigateMobileBottomNav(cdp, pageId) {
  await cdp.evaluate(`
    (() => {
      const btn = document.querySelector('[data-testid="bottom-nav-${pageId}"]');
      if (btn) btn.click();
    })()
  `);
}

async function run() {
  console.log('================================================================');
  console.log(' SIMAAF Automated Responsive & Viewport Verification (CDP) ');
  console.log('================================================================\n');

  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    console.error('Error: dist/index.html not found. Please run "npm run build" first.');
    process.exit(1);
  }

  const browserPath = findBrowser();
  console.log(`[1/5] Using browser executable: ${browserPath}`);

  const { server, port } = await startServer();
  const appUrl = `http://127.0.0.1:${port}/`;
  console.log(`[2/5] Static app server running at: ${appUrl}`);

  const tempUserDataDir = path.join(os.tmpdir(), `cdp-test-${Date.now()}`);
  fs.mkdirSync(tempUserDataDir, { recursive: true });

  const cdpPort = 9222 + Math.floor(Math.random() * 500);
  const browserProc = spawn(
    browserPath,
    [
      '--headless=new',
      `--remote-debugging-port=${cdpPort}`,
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      `--user-data-dir=${tempUserDataDir}`,
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let cdpClient = null;
  const results = [];

  const recordResult = (name, passed, detail = '') => {
    results.push({ name, passed, detail });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${mark} - ${name} ${detail ? `(${detail})` : ''}`);
  };

  try {
    // Wait for CDP endpoint ready
    console.log(`[3/5] Connecting to Chrome DevTools Protocol on port ${cdpPort}...`);
    let targets = null;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
        if (res.ok) {
          targets = await res.json();
          if (targets.length > 0) break;
        }
      } catch {
        // wait
      }
      await sleep(300);
    }

    if (!targets || targets.length === 0) {
      throw new Error('Failed to connect to CDP endpoint.');
    }

    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
    cdpClient = new CdpClient(pageTarget.webSocketDebuggerUrl);
    await cdpClient.connect();
    console.log('[4/5] Connected via WebSocket to page target successfully.\n');

    await cdpClient.send('Page.enable');
    await cdpClient.send('Runtime.enable');
    await cdpClient.send('DOM.enable');

    console.log('[5/5] Executing Viewport & Layout Test Matrix:\n');

    // ===================================================================
    // Viewport 1: Mobile (375 x 812)
    // ===================================================================
    console.log('--- Test Suite A: Mobile Viewport (375x812 - iPhone X/11/SE) ---');
    await cdpClient.send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });

    await cdpClient.send('Page.navigate', { url: appUrl });
    await sleep(1500);

    // Wait until application shell is mounted
    for (let i = 0; i < 20; i++) {
      const isMounted = await cdpClient.evaluate(`document.querySelector('header h1') !== null`);
      if (isMounted) break;
      await sleep(200);
    }

    // Test A1: Zero horizontal scroll on initial load (Dashboard)
    const overflowCheck = await cdpClient.evaluate(`
      (() => {
        const doc = document.documentElement;
        const body = document.body;
        const main = document.querySelector('main');
        const docScroll = doc.scrollWidth;
        const bodyScroll = body.scrollWidth;
        const winWidth = window.innerWidth;
        const mainScroll = main ? main.scrollWidth : 0;
        const mainClient = main ? main.clientWidth : 0;
        return {
          winWidth,
          docScroll,
          bodyScroll,
          mainScroll,
          mainClient,
          overflow: (docScroll > winWidth + 1) || (bodyScroll > winWidth + 1) || (mainScroll > mainClient + 1)
        };
      })()
    `);
    recordResult(
      'Mobile Horizontal Overflow (Dashboard)',
      !overflowCheck.overflow,
      `scrollWidth: ${overflowCheck.docScroll}px vs clientWidth: ${overflowCheck.winWidth}px`
    );

    // Test A2: Hamburger-free Mobile Header & BottomNav Touch Targets (>= 44x44px)
    const mobileNavInfo = await cdpClient.evaluate(`
      (() => {
        const hamburger = document.querySelector('[data-testid="mobile-hamburger"]') || document.querySelector('button[aria-label="Buka menu navigasi"]');
        const drawer = document.querySelector('[data-testid="mobile-drawer"]');
        const tabBtns = Array.from(document.querySelectorAll('[data-testid^="bottom-nav-"]'));
        const rects = tabBtns.map(b => {
          const r = b.getBoundingClientRect();
          return { id: b.getAttribute('data-testid'), w: Math.round(r.width), h: Math.round(r.height) };
        });
        const allTouchOk = rects.length === 5 && rects.every(r => r.w >= 44 && r.h >= 44);
        return {
          hamburgerRemoved: hamburger === null && drawer === null,
          tabCount: rects.length,
          allTouchOk,
          sampleRect: rects[0] || null
        };
      })()
    `);
    recordResult(
      'Mobile Hamburger Removed & BottomNav Touch Targets (>= 44x44px)',
      mobileNavInfo && mobileNavInfo.hamburgerRemoved && mobileNavInfo.allTouchOk,
      mobileNavInfo ? `tabs: ${mobileNavInfo.tabCount}, sample: ${mobileNavInfo.sampleRect?.w}x${mobileNavInfo.sampleRect?.h}px` : 'Not found'
    );

    // Test A3: Header Role Toggle touch target (>= 44px height)
    const roleBtnInfo = await cdpClient.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('header button'));
        const roleBtn = btns.find(b => b.textContent.includes('Mode:') || b.textContent.includes('Anni') || b.textContent.includes('Karyawan'));
        if (!roleBtn) return null;
        const rect = roleBtn.getBoundingClientRect();
        return {
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      })()
    `);
    recordResult(
      'Mobile Header Role Toggle Touch Target (>= 44px height)',
      roleBtnInfo && roleBtnInfo.height >= 44,
      roleBtnInfo ? `Height: ${roleBtnInfo.height}px, Width: ${roleBtnInfo.width}px` : 'Not found'
    );

    // Test A4: Navigation to "Pengingat & Retur" via BottomNav
    await navigateMobileBottomNav(cdpClient, 'pengingat');

    let pengingatNavState = { pageTitle: '' };
    for (let i = 0; i < 15; i++) {
      await sleep(150);
      pengingatNavState = await cdpClient.evaluate(`
        (() => {
          const h1 = document.querySelector('[data-testid="page-title"]') || document.querySelector('header h1');
          const pageTitle = h1 ? h1.textContent.trim() : '';
          return { pageTitle };
        })()
      `);
      if (pengingatNavState && pengingatNavState.pageTitle.includes('Pengingat')) {
        break;
      }
    }

    recordResult(
      'BottomNav Navigation (Pengingat & Retur)',
      pengingatNavState.pageTitle.includes('Pengingat'),
      `Page title: "${pengingatNavState.pageTitle}"`
    );

    // Test A5: Scrollable BAP Modal on Mobile
    for (let i = 0; i < 15; i++) {
      const hasBapBtn = await cdpClient.evaluate(`
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          return btns.some(b => b.textContent.includes('Dokumen BAP') || b.title?.includes('Berita Acara') || b.getAttribute('aria-label')?.includes('Berita Acara'));
        })()
      `);
      if (hasBapBtn) break;
      await sleep(150);
    }

    await cdpClient.evaluate(`
      (() => {
        const bapBtns = Array.from(document.querySelectorAll('button')).filter(b =>
          b.textContent.includes('Dokumen BAP') || b.title?.includes('Berita Acara') || b.getAttribute('aria-label')?.includes('Berita Acara')
        );
        if (bapBtns.length > 0) bapBtns[0].click();
      })()
    `);
    await sleep(300);

    const bapModalTest = await cdpClient.evaluate(`
      (() => {
        const modal = document.querySelector('[data-testid="bap-modal"]');
        if (!modal) {
          return { success: false, reason: 'Modal not opened' };
        }

        const modalBox = modal.querySelector('div[class*="max-h"]') || modal.querySelector('.max-w-2xl');

        // Close modal
        const closeBtn = document.querySelector('[data-testid="bap-modal-close"]') || modal.querySelector('button');
        if (closeBtn) closeBtn.click();

        return {
          success: true,
          hasModal: true,
          maxHeightConstrained: modalBox !== null
        };
      })()
    `);
    recordResult(
      'BAP Modal Dialog Responsiveness & Vertical Constraint',
      bapModalTest.success && bapModalTest.hasModal && bapModalTest.maxHeightConstrained,
      'max-h-[90vh] with scrollable body'
    );

    // Test A6: Navigate through remaining core pages via BottomNav & Beranda Quick Actions
    const pagesToTest = [
      { via: 'bottom-nav', id: 'faktur', name: 'Penerimaan Faktur' },
      { via: 'bottom-nav', id: 'inventori', name: 'Persediaan Obat' },
      { via: 'bottom-nav', id: 'penyesuaian', name: 'Penyesuaian Stok (Opname)' },
      { via: 'quick-action', id: 'kalender', name: 'Kalender Tenggat PBF' },
      { via: 'quick-action', id: 'pengaturan', name: 'Pengaturan Apotek' },
    ];

    for (const page of pagesToTest) {
      if (page.via === 'quick-action') {
        await navigateMobileBottomNav(cdpClient, 'dashboard');
        await sleep(350);
        await cdpClient.evaluate(`
          (() => {
            const btn = document.querySelector('[data-testid="quick-action-${page.id}"]');
            if (btn) btn.click();
          })()
        `);
      } else {
        await navigateMobileBottomNav(cdpClient, page.id);
      }
      await sleep(500);

      const check = await cdpClient.evaluate(`
        (() => {
          const doc = document.documentElement;
          const body = document.body;
          const main = document.querySelector('main');
          const winWidth = window.innerWidth;
          const docScroll = doc.scrollWidth;
          const bodyScroll = body.scrollWidth;
          const mainScroll = main ? main.scrollWidth : 0;
          const mainClient = main ? main.clientWidth : 0;
          return {
            winWidth,
            docScroll,
            bodyScroll,
            overflow: (docScroll > winWidth + 1) || (bodyScroll > winWidth + 1) || (mainScroll > mainClient + 1)
          };
        })()
      `);
      recordResult(
        `Mobile Zero Horizontal Overflow (${page.name})`,
        !check.overflow,
        `scrollWidth: ${check.docScroll}px vs clientWidth: ${check.winWidth}px`
      );
    }

    // ===================================================================
    // Viewport 2: Tablet (768 x 1024)
    // ===================================================================
    console.log('\n--- Test Suite B: Tablet Viewport (768x1024 - iPad Portrait) ---');
    await cdpClient.send('Emulation.setDeviceMetricsOverride', {
      width: 768,
      height: 1024,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(500);

    const tabletCheck = await cdpClient.evaluate(`
      (() => {
        const doc = document.documentElement;
        const body = document.body;
        const main = document.querySelector('main');
        const winWidth = window.innerWidth;
        const docScroll = doc.scrollWidth;
        const mainScroll = main ? main.scrollWidth : 0;
        const mainClient = main ? main.clientWidth : 0;
        return {
          winWidth,
          docScroll,
          overflow: (docScroll > winWidth + 1) || (mainScroll > mainClient + 1)
        };
      })()
    `);
    recordResult(
      'Tablet Zero Horizontal Overflow (768px)',
      !tabletCheck.overflow,
      `scrollWidth: ${tabletCheck.docScroll}px vs clientWidth: ${tabletCheck.winWidth}px`
    );

    // ===================================================================
    // Viewport 3: Desktop (1280 x 800)
    // ===================================================================
    console.log('\n--- Test Suite C: Desktop Viewport (1280x800) ---');
    await cdpClient.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sleep(500);

    const desktopCheck = await cdpClient.evaluate(`
      (() => {
        const doc = document.documentElement;
        const sidebar = document.querySelector('[data-testid="desktop-sidebar"]') || document.querySelector('aside.hidden');
        const bottomNav = document.querySelector('[data-testid="mobile-bottom-nav"]') || document.querySelector('nav[aria-label="Navigasi Bawah"]');
        const winWidth = window.innerWidth;
        const docScroll = doc.scrollWidth;
        return {
          winWidth,
          docScroll,
          overflow: docScroll > winWidth + 1,
          sidebarVisible: sidebar !== null && window.getComputedStyle(sidebar).display !== 'none',
          bottomNavHidden: bottomNav !== null && window.getComputedStyle(bottomNav).display === 'none'
        };
      })()
    `);
    recordResult(
      'Desktop Zero Horizontal Overflow (1280px)',
      !desktopCheck.overflow,
      `scrollWidth: ${desktopCheck.docScroll}px vs clientWidth: ${desktopCheck.winWidth}px`
    );
    recordResult(
      'Desktop Navigation Shell Visibility Parity',
      desktopCheck.sidebarVisible && desktopCheck.bottomNavHidden,
      'Desktop sidebar visible, mobile bottom nav hidden'
    );

    // ===================================================================
    // Summary Evaluation
    // ===================================================================
    console.log('\n================================================================');
    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;
    console.log(` RESULTS SUMMARY: ${passedCount}/${totalCount} tests passed`);
    console.log('================================================================\n');

    if (passedCount !== totalCount) {
      console.error('Some responsive verification tests failed!');
      process.exit(1);
    } else {
      console.log('All responsive verification tests passed successfully! 🎉');
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal error during CDP verification:', err);
    process.exit(1);
  } finally {
    if (cdpClient) {
      cdpClient.close();
    }
    if (browserProc) {
      browserProc.kill();
    }
    server.close();
    try {
      fs.rmSync(tempUserDataDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

run();
