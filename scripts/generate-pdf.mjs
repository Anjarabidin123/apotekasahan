import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

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

  close() {
    if (this.ws) {
      try { this.ws.close(); } catch {}
    }
  }
}

async function renderHtmlToPdf(htmlFilePath, outputPdfPath) {
  const tempUserDataDir = path.join(os.tmpdir(), `cdp-pdf-${Date.now()}`);
  fs.mkdirSync(tempUserDataDir, { recursive: true });

  const cdpPort = 9500 + Math.floor(Math.random() * 300);
  const browserProc = spawn(
    chromePath,
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

  try {
    let targets = null;
    for (let i = 0; i < 35; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
        if (res.ok) {
          targets = await res.json();
          if (targets.length > 0) break;
        }
      } catch {}
      await sleep(200);
    }

    if (!targets || targets.length === 0) {
      throw new Error('Chrome CDP target not ready');
    }

    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
    cdpClient = new CdpClient(pageTarget.webSocketDebuggerUrl);
    await cdpClient.connect();

    await cdpClient.send('Page.enable');
    const fileUrl = 'file:///' + path.resolve(htmlFilePath).replace(/\\/g, '/');
    await cdpClient.send('Page.navigate', { url: fileUrl });
    await sleep(1200);

    const pdfRes = await cdpClient.send('Page.printToPDF', {
      printBackground: true,
      paperWidth: 8.27, // A4
      paperHeight: 11.69,
      marginTop: 0.45,
      marginBottom: 0.45,
      marginLeft: 0.5,
      marginRight: 0.5,
    });

    const pdfBuffer = Buffer.from(pdfRes.data, 'base64');
    fs.writeFileSync(outputPdfPath, pdfBuffer);
    console.log(`[SUCCESS] PDF created at: ${outputPdfPath} (${pdfBuffer.length} bytes)`);
  } finally {
    if (cdpClient) cdpClient.close();
    try { browserProc.kill(); } catch {}
    try { fs.rmSync(tempUserDataDir, { recursive: true, force: true }); } catch {}
  }
}

const htmlFile = path.join(rootDir, 'docs', 'catatan_triage_santai.html');
const pdfFileDocs = path.join(rootDir, 'docs', 'Catatan_Triage_12_Komentar_SIMAAF_Santai.pdf');
const pdfFileRoot = path.join(rootDir, 'Catatan_Triage_12_Komentar_SIMAAF_Santai.pdf');

await renderHtmlToPdf(htmlFile, pdfFileDocs);
fs.copyFileSync(pdfFileDocs, pdfFileRoot);
console.log(`[SUCCESS] Copied to root: ${pdfFileRoot}`);
