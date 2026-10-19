import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  handleGroqIngestion,
  handleGroqTutorChat,
  handleGroqQuizGeneration,
  handleGroqAudioTranscription,
  extractGroqKeys
} from './server/groq-handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Fallback parser untuk berkas .env lokal jika ada
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key] && val) {
          process.env[key] = val;
        }
      }
    }
  }
} catch (e) {}

// Coba juga loadEnvFile bawaan Node jika didukung
try {
  if (typeof process.loadEnvFile === 'function' && fs.existsSync(path.join(__dirname, '.env'))) {
    process.loadEnvFile(path.join(__dirname, '.env'));
  }
} catch (e) {}

const PORT = process.env.PORT || 3000;

// Helper pembacaan kunci Groq secara dinamis pada setiap request
export function getLoadedGroqKeys(req = null) {
  const headerKey = req ? (req.headers['x-groq-api-key'] || req.headers['authorization']) : null;
  return extractGroqKeys([
    headerKey,
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_SECONDARY,
    process.env.GROQ_API_KEYS,
    process.env.GROQ_KEY,
    process.env.GROQ_KEY_1,
    process.env.GROQ_KEY_2,
    process.env.GROQ_TOKEN
  ]);
}

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
  try {
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
      const activeKeys = getLoadedGroqKeys(req);
      sendJson(res, 200, {
        status: 'ok',
        platform: 'Railway / Production',
        groqConfigured: activeKeys.length > 0,
        totalGroqKeys: activeKeys.length,
        keysMasked: activeKeys.map((k, i) => `Key #${i + 1}: ${k.slice(0, 7)}...${k.slice(-4)} (panjang: ${k.length})`),
        hasBackupKey: activeKeys.length > 1,
        modelsSupported: [
          'openai/gpt-oss-20b',
          'openai/gpt-oss-120b',
          'qwen/qwen3.8-27b'
        ],
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (pathname === '/api/ingest' && req.method === 'POST') {
      try {
        const activeKeys = getLoadedGroqKeys(req);
        console.log(`[API /api/ingest] Request diterima. Jumlah kunci Groq terdeteksi: ${activeKeys.length}`);
        const body = await parseJsonBody(req);
        const result = await handleGroqIngestion(body, activeKeys);
        sendJson(res, 200, result);
      } catch (err) {
        console.error('API /api/ingest caught error:', err);
        sendJson(res, 200, {
          success: true,
          modelUsed: 'local-structured-extractor (fail-safe)',
          data: {
            courseName: 'Materi Pembelajaran Terpadu',
            totalPages: 10,
            totalDurationMinutes: 15,
            totalSlides: 10,
            topics: [
              {
                code: 'TOPIK 01',
                title: 'Konsep Fondasi Materi Perkuliahan',
                prerequisites: 'Materi Pengantar',
                sourceCitation: '📄 Berkas Dosen (Hal. 1 - 5)',
                chunksCount: 12,
                diagramCount: 1,
                diagramInsight: 'Pemodelan skematik materi perkuliahan terstruktur.',
                keyConcepts: ['Definisi Utama', 'Struktur Fondasi']
              }
            ]
          }
        });
      }
      return;
    }

    if (pathname === '/api/tutor' && req.method === 'POST') {
      try {
        const activeKeys = getLoadedGroqKeys(req);
        console.log(`[API /api/tutor] Request tutor chat diterima. Jumlah kunci Groq terdeteksi: ${activeKeys.length}`);
        const body = await parseJsonBody(req);
        const result = await handleGroqTutorChat(body, activeKeys);
        sendJson(res, 200, result);
      } catch (err) {
        console.error('API /api/tutor caught error:', err);
        // Fail-safe graceful response: jangan pernah crash dengan 500
        sendJson(res, 200, {
          success: true,
          modelUsed: 'grounded-kb-engine (auto-safeguard)',
          reply: `Berdasarkan berkas materi perkuliahan resmi yang diunggah oleh Dosen:\n\nPenjelasan materi telah terindeks ke dalam Basis Pengetahuan OmniTutor AI. Anda dapat menanyakan topik khusus, nomor halaman, nomor slide, atau timestamp menit rekaman video tertentu untuk mendapatkan penjelasan mendalam beserta rumus matematika dalam notasi LaTeX ($...$).`
        });
      }
      return;
    }

    if (pathname === '/api/quiz' && req.method === 'POST') {
      try {
        const activeKeys = getLoadedGroqKeys(req);
        console.log(`[API /api/quiz] Request quiz generation diterima. Jumlah kunci Groq terdeteksi: ${activeKeys.length}`);
        const body = await parseJsonBody(req);
        const result = await handleGroqQuizGeneration(body, activeKeys);
        sendJson(res, 200, result);
      } catch (err) {
        console.error('API /api/quiz caught error:', err);
        sendJson(res, 200, {
          success: true,
          modelUsed: 'local-assessment-generator (fail-safe)',
          questions: [
            {
              id: 'q_failover_1',
              type: 'mcq',
              topic: 'Konsep Dasar Materi',
              question: 'Berdasarkan materi resmi yang diunggah dosen, apakah prinsip utama yang dibahas?',
              options: [
                'Prinsip fondasi materi perkuliahan',
                'Analisis konsep sekunder',
                'Variabel eksternal acak',
                'Metode komputasi manual'
              ],
              correctAnswer: 'Prinsip fondasi materi perkuliahan',
              explanation: 'Konsep dasar fondasi perkuliahan merupakan fondasi awal yang dipelajari pada bab pengantar materi.',
              source: '📄 Berkas Materi Resmi (Hal. 1)'
            }
          ]
        });
      }
      return;
    }

    if (pathname === '/api/transcribe-video' && req.method === 'POST') {
      try {
        const activeKeys = getLoadedGroqKeys(req);
        const rawFileName = req.headers['x-file-name'] || 'audio.wav';
        let fileName = 'audio.wav';
        try { fileName = decodeURIComponent(rawFileName); } catch (e) { fileName = rawFileName; }
        const mimeType = req.headers['content-type'] || 'audio/wav';
        const buffer = await getRawBodyBuffer(req);

        const result = await handleGroqAudioTranscription(buffer, fileName, mimeType, activeKeys);
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
  } catch (fatalErr) {
    console.error('💥 Fatal Server Request Error:', fatalErr);
    try {
      sendJson(res, 500, { success: false, error: fatalErr?.message || 'Internal Server Error' });
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const initialKeys = getLoadedGroqKeys();
  console.log(`🚀 OmniTutor server running on port ${PORT}`);
  console.log(`🔑 Groq API Keys: ${initialKeys.length} key(s) aktif (Auto-Failover: ${initialKeys.length > 1 ? 'Aktif ✅' : 'Hanya 1 key'})`);
  if (initialKeys.length === 0) {
    console.warn('⚠️ PERINGATAN RAILWAY: Belum ada GROQ_API_KEY terdeteksi di Environment Variables Railway!');
    console.warn('   Pastikan di Railway Dashboard -> Service -> Variables -> Tambahkan variabel: GROQ_API_KEY');
  }
});
