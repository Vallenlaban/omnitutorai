import path from 'path';
import { defineConfig, loadEnv } from 'vite';
// @ts-ignore
import { handleGroqIngestion, handleGroqTutorChat, handleGroqQuizGeneration, handleGroqAudioTranscription } from './server/groq-handler.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const GROQ_API_KEYS = [
    env.GROQ_API_KEY,
    env.GROQ_API_KEY_2,
    env.GROQ_API_KEY_SECONDARY,
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_SECONDARY,
    ...((env.GROQ_API_KEYS || process.env.GROQ_API_KEYS || '').split(','))
  ].map(k => (k || '').trim()).filter(Boolean);

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    plugins: [
      {
        name: 'groq-backend-endpoints',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/ingest' && req.method === 'POST') {
              let bodyStr = '';
              req.on('data', (chunk: any) => { bodyStr += chunk; });
              req.on('end', async () => {
                try {
                  const body = JSON.parse(bodyStr || '{}');
                  const result = await handleGroqIngestion(body, GROQ_API_KEYS);
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify(result));
                } catch (err: any) {
                  console.error('API /api/ingest error:', err);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, error: err?.message || 'Ingestion failed' }));
                }
              });
              return;
            }

            if (req.url === '/api/tutor' && req.method === 'POST') {
              let bodyStr = '';
              req.on('data', (chunk: any) => { bodyStr += chunk; });
              req.on('end', async () => {
                try {
                  const body = JSON.parse(bodyStr || '{}');
                  const result = await handleGroqTutorChat(body, GROQ_API_KEYS);
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify(result));
                } catch (err: any) {
                  console.error('API /api/tutor error:', err);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, error: err?.message || 'Tutor failed' }));
                }
              });
              return;
            }

            if (req.url === '/api/quiz' && req.method === 'POST') {
              let bodyStr = '';
              req.on('data', (chunk: any) => { bodyStr += chunk; });
              req.on('end', async () => {
                try {
                  const body = JSON.parse(bodyStr || '{}');
                  const result = await handleGroqQuizGeneration(body, GROQ_API_KEYS);
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify(result));
                } catch (err: any) {
                  console.error('API /api/quiz error:', err);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, error: err?.message || 'Quiz generation failed' }));
                }
              });
              return;
            }

            if (req.url === '/api/transcribe-video' && req.method === 'POST') {
              const chunks: any[] = [];
              req.on('data', (chunk: any) => { chunks.push(chunk); });
              req.on('end', async () => {
                try {
                  const rawFileName = (req.headers['x-file-name'] as string) || 'audio.wav';
                  let fileName = 'audio.wav';
                  try { fileName = decodeURIComponent(rawFileName); } catch (e) { fileName = rawFileName; }
                  const mimeType = (req.headers['content-type'] as string) || 'audio/wav';
                  const buffer = Buffer.concat(chunks);
                  const result = await handleGroqAudioTranscription(buffer, fileName, mimeType, GROQ_API_KEYS);
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify(result));
                } catch (err: any) {
                  console.error('API /api/transcribe-video error:', err);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, error: err?.message || 'Transcription failed' }));
                }
              });
              return;
            }

            if (req.url === '/api/health' && req.method === 'GET') {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                status: 'ok',
                provider: 'Groq Cloud',
                totalKeys: GROQ_API_KEYS.length,
                hasBackupKey: GROQ_API_KEYS.length > 1
              }));
              return;
            }

            next();
          });
        }
      }
    ]
  };
});
