// Ferramentas de teste sem dependências:
//  - startServer(): servidor estático local (como o Live Server, mas para os testes)
//  - openBrowser(): abre o Chrome/Edge invisível e controla pelo DevTools Protocol
//    (o mesmo protocolo que o F12 usa), coletando erros do console e da rede.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
};

export function startServer(port = 0){
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
    if (!file.startsWith(ROOT)){ res.writeHead(403).end(); return; }
    fs.readFile(file, (err, data) => {
      if (err){ res.writeHead(404).end('not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((resolve, reject) => server.on('error', reject).listen(port, '127.0.0.1', () => {
    resolve({ url: `http://127.0.0.1:${server.address().port}/`, close: () => server.close() });
  }));
}

const BROWSERS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

export async function openBrowser({ width = 1280, height = 720 } = {}){
  const exe = process.env.BROWSER || BROWSERS.find(p => fs.existsSync(p));
  if (!exe) throw new Error('Nenhum Chrome/Edge encontrado. Defina a variável BROWSER com o caminho.');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ether-test-'));
  const proc = spawn(exe, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--mute-audio', `--window-size=${width},${height}`,
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(() => reject(new Error('O navegador não abriu a porta de depuração.')), 15000);
    proc.stderr.on('data', d => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m){ clearTimeout(timer); resolve(m[1]); }
    });
  });

  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let nextId = 1;
  const pending = new Map();
  const handlers = [];
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)){
      const { resolve, reject } = pending.get(msg.id); pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method){
      handlers.forEach(h => h(msg));
    }
  };
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const page = (method, params) => send(method, params, sessionId);

  // tudo que der errado na página vai para esta lista
  const problems = [];
  handlers.push(({ method, params, sessionId: s }) => {
    if (s !== sessionId) return;
    if (method === 'Runtime.exceptionThrown'){
      const d = params.exceptionDetails;
      problems.push(`Exceção: ${d.exception?.description || d.text} (${d.url || ''}:${d.lineNumber})`);
    } else if (method === 'Runtime.consoleAPICalled' && (params.type === 'error' || params.type === 'warning')){
      problems.push(`console.${params.type}: ${params.args.map(a => a.value ?? a.description).join(' ')}`);
    } else if (method === 'Log.entryAdded' && params.entry.level === 'error'){
      problems.push(`Log: ${params.entry.text} ${params.entry.url || ''}`);
    } else if (method === 'Network.responseReceived' && params.response.status >= 400){
      problems.push(`HTTP ${params.response.status}: ${params.response.url}`);
    } else if (method === 'Network.loadingFailed' && !params.canceled){
      problems.push(`Falha ao carregar: ${params.errorText}`);
    }
  });

  await page('Runtime.enable'); await page('Log.enable'); await page('Network.enable'); await page('Page.enable');
  await page('Emulation.setFocusEmulationEnabled', { enabled: true });
  await page('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });

  const KEYCODES = { Enter: 13, Escape: 27, ' ': 32, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 };

  return {
    problems,
    async goto(url){
      const loaded = new Promise(r => handlers.push(m => { if (m.method === 'Page.loadEventFired' && m.sessionId === sessionId) r(); }));
      await page('Page.navigate', { url });
      await loaded;
    },
    async eval(expr){
      const r = await page('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    async key(key){
      const base = { key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: KEYCODES[key] ?? 0 };
      await page('Input.dispatchKeyEvent', { type: 'keyDown', ...base });
      await page('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
    },
    async type(text){
      await page('Input.insertText', { text });
    },
    async click(selector){
      const box = await this.eval(`(() => { const r = document.querySelector(${JSON.stringify(selector)})?.getBoundingClientRect();
        return r ? { x: r.x + r.width/2, y: r.y + r.height/2 } : null; })()`);
      if (!box) throw new Error(`Elemento não encontrado: ${selector}`);
      for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased'])
        await page('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 });
    },
    async resize(w, h){
      await page('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
    },
    async screenshot(file){
      const { data } = await page('Page.captureScreenshot', { format: 'png' });
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, Buffer.from(data, 'base64'));
    },
    wait: ms => new Promise(r => setTimeout(r, ms)),
    async close(){
      try { await send('Browser.close'); } catch {}
      ws.close();
      await new Promise(r => { if (proc.exitCode !== null) r(); else proc.on('exit', r); setTimeout(r, 3000); });
      try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
    },
  };
}
