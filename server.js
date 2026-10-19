import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  handleGroqIngestion,
  handleGroqTutorChat,
  handleGroqQuizGeneration,
  handleGroqAudioTranscription
} from './server/groq-handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env automatically if available
try {
  if (typeof process.loadEnvFile === 'function' && fs.existsSync(path.join(__dirname, '.env'))) {
    process.loadEnvFile(path.join(__dirname, '.env'));
  }
} catch (e) {}

const PORT = process.env.PORT || 3000;
const GROQ_API_KEYS = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_SECONDARY,
  ...(process.env.GROQ_API_KEYS ? process.env.GROQ_API_KEYS.split(',') : [])
].map(k => (k || '').trim()).filter(Boolean);

// Content-Type mapping for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.map': 'application/json'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-file-name, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let bodyStr = '';
    req.on('data', chunk => {
      bodyStr += chunk;
      if (bodyStr.length > 50 * 1024 * 1024) { // 50MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(bodyStr || '{}'));
      } catch (err) {
        reject(new Error('Invalid JSON: ' + err.message));
      }
    });
    req.on('error', reject);
  });
}

function getRawBodyBuffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      chunks.push(chunk);
      size += chunk.length;
      if (size > 100 * 1024 * 1024) { // 100MB limit for video/audio
        reject(new Error('File upload too large (max 100MB)'));
      }
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Static file server targeting 'dist' (or fallback to root for development)
function serveStaticFile(req, res, pathname) {
  // Normalize path
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '') {
    safePath = '/index.html';
  }

  // Look in dist first (production build), then fallback to workspace root
  const distDir = path.join(__dirname, 'dist');
  let filePath = path.join(distDir, safePath);

  if (!fs.existsSync(filePath)) {
    // If not found in dist, check root (e.g. public or local files)
    const rootPath = path.join(__dirname, safePath);
    if (fs.existsSync(rootPath) && !fs.statSync(rootPath).isDirectory()) {
      filePath = rootPath;
    } else {
      // SPA Fallback: serve dist/index.html or index.html
      const distIndex = path.join(distDir, 'index.html');
      if (fs.existsSync(distIndex)) {
        filePath = distIndex;
      } else {
        filePath = path.join(__dirname, 'index.html');
      }
    }
  }

  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
    });
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  }
}

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-file-name, Authorization'
    });
    res.end();
    return;
  }

  // API Endpoints
  if (pathname === '/api/health' && req.method === 'GET') {
    sendJson(res, 200, {
      status: 'ok',
      platform: 'Railway',
      groqConfigured: GROQ_API_KEYS.length > 0,
      totalGroqKeys: GROQ_API_KEYS.length,
      hasBackupKey: GROQ_API_KEYS.length > 1,
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (pathname === '/api/ingest' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const result = await handleGroqIngestion(body, GROQ_API_KEYS);
      sendJson(res, 200, result);
    } catch (err) {
      console.error('API /api/ingest error:', err);
      sendJson(res, 500, { success: false, error: err?.message || 'Ingestion failed' });
    }
    return;
  }

  if (pathname === '/api/tutor' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const result = await handleGroqTutorChat(body, GROQ_API_KEYS);
      sendJson(res, 200, result);
    } catch (err) {
      console.error('API /api/tutor error:', err);
      sendJson(res, 500, { success: false, error: err?.message || 'Tutor failed' });
    }
    return;
  }

  if (pathname === '/api/quiz' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const result = await handleGroqQuizGeneration(body, GROQ_API_KEYS);
      sendJson(res, 200, result);
    } catch (err) {
      console.error('API /api/quiz error:', err);
      sendJson(res, 500, { success: false, error: err?.message || 'Quiz generation failed' });
    }
    return;
  }

  if (pathname === '/api/transcribe-video' && req.method === 'POST') {
    try {
      const rawFileName = req.headers['x-file-name'] || 'audio.wav';
      let fileName = 'audio.wav';
      try { fileName = decodeURIComponent(rawFileName); } catch (e) { fileName = rawFileName; }
      const mimeType = req.headers['content-type'] || 'audio/wav';
      const buffer = await getRawBodyBuffer(req);

      const result = await handleGroqAudioTranscription(buffer, fileName, mimeType, GROQ_API_KEYS);
      sendJson(res, 200, result);
    } catch (err) {
      console.error('API /api/transcribe-video error:', err);
      sendJson(res, 500, { success: false, error: err?.message || 'Transcription failed' });
    }
    return;
  }

  // Serve static assets from production dist or root
  if (req.method === 'GET' || req.method === 'HEAD') {
    serveStaticFile(req, res, pathname);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'text/plain' });
  res.end('Method Not Allowed');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 OmniTutor server running on port ${PORT}`);
  console.log(`🔑 Groq API Keys: ${GROQ_API_KEYS.length} key(s) aktif (Auto-Failover: ${GROQ_API_KEYS.length > 1 ? 'Aktif ✅' : 'Hanya 1 key'})`);
});
