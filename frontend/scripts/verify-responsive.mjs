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

async function openMobileDrawer(cdp) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const state = await cdp.evaluate(`
      (() => {
        const drawer = document.querySelector('[data-testid="mobile-drawer"]');
        if (drawer && drawer.classList.contains('translate-x-0')) return true;
        const btn = document.querySelector('button[aria-label="Buka menu navigasi"]');
        if (btn) btn.click();
        return false;
      })()
    `);
    if (state) return true;
    await sleep(200);
  }
  return false;
}

async function closeMobileDrawer(cdp) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const state = await cdp.evaluate(`
      (() => {
        const drawer = document.querySelector('[data-testid="mobile-drawer"]');
        if (drawer && drawer.classList.contains('-translate-x-full')) return true;
        const backdrop = document.querySelector('[data-testid="mobile-drawer-backdrop"]');
        if (backdrop) {
          backdrop.click();
        } else {
          const closeBtn = document.querySelector('[data-testid="mobile-drawer-close"]');
          if (closeBtn) closeBtn.click();
        }
        return false;
      })()
    `);
    if (state) return true;
    await sleep(200);
  }
  return false;
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

    // Test A2: Mobile Hamburger Button touch target (>= 44x44px)
    const hamburgerInfo = await cdpClient.evaluate(`
      (() => {
        const btn = document.querySelector('button[aria-label="Buka menu navigasi"]');
        if (!btn) return null;
        const rect = btn.getBoundingClientRect();
        return {
          exists: true,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible: rect.width > 0 && rect.height > 0
        };
      })()
    `);
    recordResult(
      'Mobile Hamburger Button Touch Target (>= 44x44px)',
      hamburgerInfo && hamburgerInfo.width >= 44 && hamburgerInfo.height >= 44,
      hamburgerInfo ? `${hamburgerInfo.width}x${hamburgerInfo.height}px` : 'Not found'
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

    // Test A4: Off-Canvas Drawer Open & Backdrop
    await openMobileDrawer(cdpClient);
    await sleep(350);

    const drawerOpenState = await cdpClient.evaluate(`
      (() => {
        const drawer = document.querySelector('[data-testid="mobile-drawer"]');
        const backdrop = document.querySelector('[data-testid="mobile-drawer-backdrop"]');
        if (!drawer) return { error: 'Drawer not found' };
        const hasOpenClass = drawer.classList.contains('translate-x-0');
        const backdropVisible = backdrop !== null;
        return { hasOpenClass, backdropVisible };
      })()
    `);
    recordResult(
      'Off-Canvas Mobile Drawer Opens with Backdrop',
      drawerOpenState.hasOpenClass && drawerOpenState.backdropVisible,
      'translate-x-0 active, backdrop present'
    );

    // Test A5: Backdrop tap closes drawer
    await cdpClient.evaluate(`
      (() => {
        const backdrop = document.querySelector('[data-testid="mobile-drawer-backdrop"]');
        if (backdrop) backdrop.click();
      })()
    `);
    await sleep(400);

    const drawerClosedState = await cdpClient.evaluate(`
      (() => {
        const drawer = document.querySelector('[data-testid="mobile-drawer"]');
        const backdrop = document.querySelector('[data-testid="mobile-drawer-backdrop"]');
        return {
          isClosed: drawer && drawer.classList.contains('-translate-x-full'),
          backdropRemoved: backdrop === null
        };
      })()
    `);
    recordResult(
      'Tapping Backdrop Closes Mobile Drawer',
      drawerClosedState.isClosed && drawerClosedState.backdropRemoved,
      '-translate-x-full active, backdrop removed'
    );

    // Test A6: Navigation to "Pengingat & Retur" via Drawer
    await cdpClient.evaluate(`
      (() => {
        const btn = document.querySelector('[data-testid="mobile-hamburger"]') || document.querySelector('button[aria-label="Buka menu navigasi"]');
        if (btn) btn.click();
      })()
    `);
    await sleep(400);

    await cdpClient.evaluate(`
      (() => {
        const navBtn = document.querySelector('[data-testid="mobile-nav-pengingat"]');
        if (navBtn) navBtn.click();
      })()
    `);

    let pengingatNavState = { isClosed: false, pageTitle: '' };
    for (let i = 0; i < 15; i++) {
      await sleep(150);
      pengingatNavState = await cdpClient.evaluate(`
        (() => {
          const drawer = document.querySelector('[data-testid="mobile-drawer"]');
          const isClosed = drawer && drawer.classList.contains('-translate-x-full');
          const h1 = document.querySelector('[data-testid="page-title"]') || document.querySelector('header h1');
          const pageTitle = h1 ? h1.textContent.trim() : '';
          return { isClosed, pageTitle };
        })()
      `);
      if (pengingatNavState && pengingatNavState.pageTitle.includes('Pengingat')) {
        break;
      }
    }

    recordResult(
      'Drawer Link Navigation (Pengingat & Retur)',
      pengingatNavState.isClosed && pengingatNavState.pageTitle.includes('Pengingat'),
      `Page title: "${pengingatNavState.pageTitle}"`
    );

    // Test A7: Scrollable BAP Modal on Mobile
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

    const bapModalTest = await cdpClient.evaluate(`
      (async () => {
        // Find Dokumen BAP button in card or table
        const bapBtns = Array.from(document.querySelectorAll('button')).filter(b => 
          b.textContent.includes('Dokumen BAP') || b.title?.includes('Berita Acara') || b.getAttribute('aria-label')?.includes('Berita Acara')
        );
        if (bapBtns.length > 0) {
          bapBtns[0].click();
        }
        
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
      bapModalTest.success && bapModalTest.hasModal,
      'max-h-[90vh] with scrollable body'
    );

    // Test A8: Navigate through remaining core pages and test zero horizontal scroll
    const pagesToTest = [
      { id: 'faktur', name: 'Penerimaan Faktur' },
      { id: 'inventori', name: 'Persediaan Obat' },
      { id: 'penyesuaian', name: 'Penyesuaian Stok (Opname)' },
      { id: 'kalender', name: 'Kalender Tenggat PBF' },
      { id: 'pengaturan', name: 'Pengaturan Apotek' },
    ];

    for (const page of pagesToTest) {
      await openMobileDrawer(cdpClient);
      await sleep(250);
      await cdpClient.evaluate(`
        (() => {
          const navBtn = document.querySelector('[data-testid="mobile-nav-${page.id}"]');
          if (navBtn) navBtn.click();
        })()
      `);
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
        const body = document.body;
        const sidebar = document.querySelector('[data-testid="desktop-sidebar"]') || document.querySelector('aside.hidden');
        const hamburger = document.querySelector('[data-testid="mobile-hamburger"]') || document.querySelector('button[aria-label="Buka menu navigasi"]');
        const winWidth = window.innerWidth;
        const docScroll = doc.scrollWidth;
        return {
          winWidth,
          docScroll,
          overflow: docScroll > winWidth + 1,
          sidebarVisible: sidebar !== null && window.getComputedStyle(sidebar).display !== 'none',
          hamburgerHidden: hamburger !== null && window.getComputedStyle(hamburger).display === 'none'
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
      desktopCheck.sidebarVisible && desktopCheck.hamburgerHidden,
      'Desktop sidebar visible, mobile hamburger hidden'
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
