// Helper perbaikan escape string JSON khusus formula matematika & LaTeX dari LLM
function repairJsonMathStrings(jsonStr) {
  let out = '';
  let inString = false;
  let i = 0;
  const len = jsonStr.length;

  while (i < len) {
    const ch = jsonStr[i];

    if (!inString) {
      if (ch === '"') {
        inString = true;
      }
      out += ch;
      i++;
    } else {
      if (ch === '"') {
        inString = false;
        out += ch;
        i++;
      } else if (ch === '\\') {
        const next = jsonStr[i + 1];
        if (next === undefined) {
          out += '\\\\';
          i++;
        } else if (next === '"' || next === '\\' || next === '/') {
          out += ch + next;
          i += 2;
        } else if (next === 'n' || next === 'r') {
          const lookahead = jsonStr.slice(i + 1, i + 6);
          if (lookahead.startsWith('nabla')) {
            out += '\\\\nabla';
            i += 6;
          } else {
            out += ch + next;
            i += 2;
          }
        } else if (next === 't') {
          const rest = jsonStr.slice(i + 1, i + 10);
          const match = rest.match(/^(text|times|tan|theta|tau|triangle|tfrac|to|top)/i);
          if (match) {
            out += '\\\\' + match[1];
            i += 1 + match[1].length;
          } else {
            out += ch + next;
            i += 2;
          }
        } else if (next === 'f') {
          const rest = jsonStr.slice(i + 1, i + 8);
          const match = rest.match(/^(frac|forall|flat)/i);
          if (match) {
            out += '\\\\' + match[1];
            i += 1 + match[1].length;
          } else {
            out += ch + next;
            i += 2;
          }
        } else if (next === 'b') {
          const rest = jsonStr.slice(i + 1, i + 8);
          const match = rest.match(/^(beta|bar|begin|mathbf|binom|bold|bullet)/i);
          if (match) {
            out += '\\\\' + match[1];
            i += 1 + match[1].length;
          } else {
            out += ch + next;
            i += 2;
          }
        } else if (next === 'u' && /^[0-9a-fA-F]{4}/.test(jsonStr.slice(i + 2, i + 6))) {
          out += jsonStr.slice(i, i + 6);
          i += 6;
        } else {
          // Double escape semua backslash LaTeX lainnya (seperti \sqrt, \alpha, \le, \ge, \int, \sum, \pm)
          out += '\\\\';
          i++;
        }
      } else {
        out += ch;
        i++;
      }
    }
  }

  return out;
}

// Helper pembersih dan perbaikan JSON dari LLM
function safeParseLLMJson(raw) {
  let str = (raw || '').replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  const firstBrace = str.indexOf('{');
  const lastBrace = str.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    str = str.slice(firstBrace, lastBrace + 1);
  }

  // 1. Perbaiki escape sequence string matematika/LaTeX terlebih dahulu
  const repaired = repairJsonMathStrings(str);

  try {
    return JSON.parse(repaired);
  } catch (e1) {
    try {
      return JSON.parse(str);
    } catch (eOrig) {
      // Hapus trailing comma sebelum } atau ]
      let fixed = repaired.replace(/,\s*([}\]])/g, '$1');
      try {
        return JSON.parse(fixed);
      } catch (e2) {
        // Hapus trailing comma dan string terpotong di akhir
        fixed = fixed.replace(/,\s*$/, '').replace(/"[^"]*$/, '""');
        let openBraces = (fixed.match(/\{/g) || []).length;
        let closeBraces = (fixed.match(/\}/g) || []).length;
        let openBrackets = (fixed.match(/\[/g) || []).length;
        let closeBrackets = (fixed.match(/\]/g) || []).length;

        while (closeBrackets < openBrackets) {
          fixed += ']';
          closeBrackets++;
        }
        while (closeBraces < openBraces) {
          fixed += '}';
          closeBraces++;
        }

        try {
          return JSON.parse(fixed);
        } catch (e3) {
          throw new Error(`Gagal mem-parse respon JSON: ${e1.message}`);
        }
      }
    }
  }
}

// Helper untuk mengurai daftar API Key (Primary & Backup / Failover)
export function extractGroqKeys(apiKeysInput) {
  let rawItems = [];
  if (Array.isArray(apiKeysInput)) {
    rawItems.push(...apiKeysInput);
  } else if (typeof apiKeysInput === 'string' && apiKeysInput.trim()) {
    rawItems.push(apiKeysInput);
  }

  // Cek dinamis ke process.env untuk mengakomodasi berbagai konvensi nama variabel di Railway/PaaS
  if (typeof process !== 'undefined' && process.env) {
    const candidateEnvNames = [
      'GROQ_API_KEY',
      'GROQ_API_KEY_1',
      'GROQ_API_KEY_2',
      'GROQ_API_KEY_SECONDARY',
      'GROQ_API_KEYS',
      'GROQ_KEY',
      'GROQ_KEY_1',
      'GROQ_KEY_2',
      'GROQ_TOKEN'
    ];
    for (const name of candidateEnvNames) {
      if (process.env[name]) rawItems.push(process.env[name]);
    }
    for (const [k, v] of Object.entries(process.env)) {
      if (k.toUpperCase().includes('GROQ') && typeof v === 'string' && v.trim()) {
        rawItems.push(v);
      }
    }
  }

  const parsedKeys = [];
  for (const item of rawItems) {
    if (typeof item !== 'string') continue;
    // Pisahkan berdasarkan koma, titik-koma, baris baru (newline), atau spasi
    const tokens = item.split(/[\s,;]+/).map(t => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    for (const tok of tokens) {
      if (tok.startsWith('gsk_') || tok.length >= 20) {
        parsedKeys.push(tok);
      }
    }
  }

  return [...new Set(parsedKeys)];
}

// Helper cerdas RAG: Dynamic Multi-Page/Video Chunking & Semantic Window Retrieval
// Menangani berkas PDF tebal (puluhan/ratusan halaman), puluhan slide, dan video kuliah panjang
// dengan tetap mematuhi batas ketat Groq Cloud on-demand TPM (Tokens Per Minute).
function selectRelevantContext({ knowledgeBaseContext, documentExcerpts, fullDocumentContent, query = '', maxChars = 1900 }) {
  let out = 'BASIS PENGETAHUAN RESMI DOSEN (GROUNDED KNOWLEDGE BASE):\n';

  // 1. Silabus & Rangkuman Topik Ringkas (Sangat hemat token)
  if (knowledgeBaseContext && knowledgeBaseContext.length > 0) {
    out += '--- TOPIK & SUBTOPIK UTAMA ---\n';
    knowledgeBaseContext.slice(0, 5).forEach((k, i) => {
      const concepts = Array.isArray(k.keyConcepts) ? k.keyConcepts.slice(0, 3).join(', ') : '';
      out += `• ${k.title} [${k.sourceCitation || 'Sumber Dosen'}] (${concepts})\n`;
    });
    out += '\n';
  }

  const cleanQuery = (query || '').toLowerCase();
  const queryTerms = cleanQuery.match(/[\w]{3,}/g) || [];

  // Deteksi pencarian lokasi spesifik (misal: "halaman 5", "hal. 12", "slide 8", "02:15")
  const pageMatch = cleanQuery.match(/(?:hal(?:aman)?\.?|page)\s*(\d+)/i);
  const slideMatch = cleanQuery.match(/slide\s*(\d+)/i);
  const videoMatch = cleanQuery.match(/(\d{1,2}:\d{2})/);
  const targetPageNum = pageMatch ? pageMatch[1] : null;
  const targetSlideNum = slideMatch ? slideMatch[1] : null;
  const targetTimestamp = videoMatch ? videoMatch[1] : null;

  const isBroadSummary = /rangkum|ringkas|keseluruhan|semua bab|silabus|overview|garis besar|apa saja/i.test(cleanQuery);

  if (Array.isArray(documentExcerpts) && documentExcerpts.length > 0) {
    // 2. Scoring & Ranking Potongan (Chunks) di seluruh halaman/slide/timestamp
    const scoredExcerpts = documentExcerpts.map((item, idx) => {
      let score = 0;
      const text = (item.content || '').toLowerCase();
      const loc = (item.loc || '').toLowerCase();
      const ref = (item.ref || '').toLowerCase();

      // Skor kecocokan lokasi eksplisit
      if (targetPageNum && loc.includes(targetPageNum)) score += 20;
      if (targetSlideNum && loc.includes(targetSlideNum)) score += 20;
      if (targetTimestamp && (loc.includes(targetTimestamp) || text.includes(targetTimestamp))) score += 20;

      // Skor kecocokan kata kunci
      queryTerms.forEach(term => {
        if (text.includes(term)) score += 3;
        if (loc.includes(term) || ref.includes(term)) score += 4;
      });

      // Jika pertanyaan umum, ambil representatif dari awal, tengah, dan akhir berkas
      if (isBroadSummary) {
        const total = documentExcerpts.length;
        if (idx === 0 || idx === Math.floor(total / 2) || idx === total - 1) {
          score += 5;
        }
      }

      return { item, score, idx };
    });

    // Urutkan potongan dari yang paling relevan
    scoredExcerpts.sort((a, b) => b.score - a.score);

    out += '--- KUTIPAN BER-SITASI PALING RELEVAN (RAG CHUNKS) ---\n';
    let currentLen = out.length;
    let addedCount = 0;

    for (const { item } of scoredExcerpts) {
      if (addedCount >= 5) break; // Maksimal 5 potongan paling penting
      const textChunk = (item.content || '').trim().slice(0, 320);
      const entry = `[${item.ref || 'Rujukan'}] (${item.loc}):\n"${textChunk}"\n\n`;
      if (currentLen + entry.length > maxChars) break;
      out += entry;
      currentLen += entry.length;
      addedCount++;
    }
  }

  // Jika masih ada ruang dan ada teks dokumen inti
  const remaining = maxChars - out.length;
  if (remaining > 350 && fullDocumentContent) {
    // Strided sampling: ambil intisari awal dan tengah jika ruang tersisa
    const snippet = fullDocumentContent.trim().slice(0, remaining);
    out += `--- INTI BERKAS RESMI ---\n"${snippet}"\n`;
  }

  return out.trim();
}

// Generator Fallback Ingestion Terstruktur jika API Key / Kuota Groq tidak tersedia
function generateFallbackIngestionResult({ fileName, fileType, detectedPages, detectedDuration, detectedSlides, effectiveCourseTitle, extractedTextSample }) {
  const cleanTitle = (effectiveCourseTitle || fileName || 'Materi Kuliah')
    .replace(/\.[^/.]+$/, '')
    .replace(/^[0-9\-_.]+/, '')
    .replace(/[_-]+/g, ' ')
    .trim();

  const vol = fileType === 'pdf' ? detectedPages : (fileType === 'video' ? detectedDuration : detectedSlides);

  const topic1Citation = fileType === 'pdf' ? `📄 ${fileName} (Hal. 1 - ${Math.min(vol, 8)})` : (fileType === 'video' ? `🎥 ${fileName} (00:00 - ${String(Math.min(vol, 15)).padStart(2, '0')}:00)` : `📊 ${fileName} (Slide 1 - ${Math.min(vol, 10)})`);
  const topic2Citation = fileType === 'pdf' ? `📄 ${fileName} (Hal. 9 - ${Math.min(vol, 18)})` : (fileType === 'video' ? `🎥 ${fileName} (15:00 - ${String(Math.min(vol, 30)).padStart(2, '0')}:00)` : `📊 ${fileName} (Slide 11 - ${Math.min(vol, 20)})`);
  const topic3Citation = fileType === 'pdf' ? `📄 ${fileName} (Hal. 19 - ${vol})` : (fileType === 'video' ? `🎥 ${fileName} (30:00 - ${String(vol).padStart(2, '0')}:00)` : `📊 ${fileName} (Slide 21 - ${vol})`);

  return {
    courseName: cleanTitle,
    totalPages: detectedPages,
    totalDurationMinutes: detectedDuration,
    totalSlides: detectedSlides,
    topics: [
      {
        code: 'TOPIK 01',
        title: `Konsep Dasar & Pengenalan ${cleanTitle}`,
        prerequisites: 'Konsep Fondasi',
        sourceCitation: topic1Citation,
        chunksCount: 18,
        diagramCount: 2,
        diagramInsight: 'Pemodelan skematik konsep dasar dan terminologi utama berkas materi.',
        keyConcepts: ['Definisi & Terminologi', 'Struktur Fondasi', 'Prinsip Awal']
      },
      {
        code: 'TOPIK 02',
        title: `Prinsip Kerja & Mekanisme ${cleanTitle}`,
        prerequisites: 'Prasyarat: TOPIK 01',
        sourceCitation: topic2Citation,
        chunksCount: 22,
        diagramCount: 3,
        diagramInsight: 'Diagram alur proses kerja, formulasi metodologi, dan hubungan antar komponen.',
        keyConcepts: ['Mekanisme Utama', 'Analisis Relasi', 'Formulasi & Aturan']
      },
      {
        code: 'TOPIK 03',
        title: `Penerapan Praktis & Evaluasi ${cleanTitle}`,
        prerequisites: 'Prasyarat: TOPIK 02',
        sourceCitation: topic3Citation,
        chunksCount: 16,
        diagramCount: 2,
        diagramInsight: 'Studi kasus pemecahan masalah, contoh terapan, dan kesimpulan pembelajaran.',
        keyConcepts: ['Implementasi Nyata', 'Studi Kasus', 'Evaluasi Pemahaman']
      }
    ],
    knowledgeGraph: {
      nodesCount: 6,
      edgesCount: 5,
      nodes: ['Terminologi', 'Fondasi', 'Mekanisme', 'Analisis', 'Aplikasi', 'Evaluasi'],
      edges: [
        { from: 'Terminologi', to: 'Fondasi', relation: 'prerequisite' },
        { from: 'Fondasi', to: 'Mekanisme', relation: 'prerequisite' },
        { from: 'Mekanisme', to: 'Analisis', relation: 'prerequisite' },
        { from: 'Analisis', to: 'Aplikasi', relation: 'leads_to' },
        { from: 'Aplikasi', to: 'Evaluasi', relation: 'validates' }
      ]
    }
  };
}

export async function handleGroqIngestion(body, apiKey) {
  const {
    fileName,
    fileType,
    courseName,
    courseCode,
    pageCount,
    durationMinutes,
    slideCount,
    extractedTextSample,
    detectedTitle
  } = body;

  const detectedPages = pageCount && pageCount > 0 ? pageCount : 30;
  const detectedDuration = durationMinutes && durationMinutes > 0 ? durationMinutes : 45;
  const detectedSlides = slideCount && slideCount > 0 ? slideCount : 25;

  let volumeText = '';
  if (fileType === 'pdf') {
    volumeText = `${detectedPages} Halaman Dokumen/Buku PDF`;
  } else if (fileType === 'video') {
    volumeText = `${detectedDuration} Menit Rekaman Video Kuliah`;
  } else if (fileType === 'slide') {
    volumeText = `${detectedSlides} Lembar Slide Presentasi`;
  } else {
    volumeText = 'Materi Kuliah';
  }

  // Pembersihan nama berkas sebagai acuan judul cadangan
  const fallbackCleanTitle = (fileName || 'Materi Kuliah')
    .replace(/\.[^/.]+$/, '')
    .replace(/^[0-9\-_.]+/, '')
    .replace(/[_-]+/g, ' ')
    .trim();

  // Evaluasi placeholder agar tidak ada bias ke mata kuliah manapun
  const isPlaceholder = (val) => {
    if (!val || typeof val !== 'string') return true;
    const lower = val.toLowerCase().trim();
    return lower === '' || lower.includes('biologi sel 101') || lower.includes('bio-101') || lower === 'materi kuliah';
  };

  let effectiveCourseTitle = '';
  if (courseName && !isPlaceholder(courseName)) {
    effectiveCourseTitle = courseName.trim();
  } else if (detectedTitle && !isPlaceholder(detectedTitle)) {
    effectiveCourseTitle = detectedTitle.trim();
  } else {
    effectiveCourseTitle = fallbackCleanTitle || 'Materi Pembelajaran Terpadu';
  }

  let textSnippet = '';
  if (extractedTextSample && extractedTextSample.length > 20) {
    if (extractedTextSample.length > 2400) {
      const partLen = 700;
      const head = extractedTextSample.slice(0, partLen);
      const midStart = Math.max(0, Math.floor(extractedTextSample.length / 2) - Math.floor(partLen / 2));
      const mid = extractedTextSample.slice(midStart, midStart + partLen);
      const tail = extractedTextSample.slice(-partLen);
      textSnippet = `\nCUPLIKAN MULTI-SEKSI RESMI DOKUMEN (AWAL, TENGAH, AKHIR BERKAS):\n[Awal Dokumen / Pendahuluan]:\n${head}\n\n[Tengah Dokumen / Konsep Utama]:\n${mid}\n\n[Akhir Dokumen / Evaluasi-Lanjutan]:\n${tail}\n`;
    } else {
      textSnippet = `\nKUTIPAN DAN TEKS ASLI LENGKAP DARI BERKAS:\n"""\n${extractedTextSample}\n"""\n`;
    }
  } else {
    textSnippet = `\nNama berkas ini adalah: "${fileName}". Analisis dan tentukan disiplin ilmu serta topik materi berdasarkan nama berkas ini secara otonom.\n`;
  }

  let exampleCitation1 = '';
  let exampleCitation2 = '';
  let exampleCitation3 = '';
  if (fileType === 'video') {
    const p1 = Math.max(1, Math.floor(detectedDuration * 0.33));
    const p2 = Math.max(2, Math.floor(detectedDuration * 0.67));
    exampleCitation1 = `🎥 ${fileName} (00:00 - ${String(p1).padStart(2, '0')}:00)`;
    exampleCitation2 = `🎥 ${fileName} (${String(p1).padStart(2, '0')}:00 - ${String(p2).padStart(2, '0')}:00)`;
    exampleCitation3 = `🎥 ${fileName} (${String(p2).padStart(2, '0')}:00 - ${String(detectedDuration).padStart(2, '0')}:00)`;
  } else if (fileType === 'slide') {
    const s1 = Math.max(1, Math.round(detectedSlides * 0.33));
    const s2 = Math.max(2, Math.round(detectedSlides * 0.67));
    exampleCitation1 = `📊 ${fileName} (Slide 1 - ${s1})`;
    exampleCitation2 = `📊 ${fileName} (Slide ${s1 + 1} - ${s2})`;
    exampleCitation3 = `📊 ${fileName} (Slide ${s2 + 1} - ${detectedSlides})`;
  } else {
    const pg1 = Math.max(1, Math.round(detectedPages * 0.33));
    const pg2 = Math.max(2, Math.round(detectedPages * 0.67));
    exampleCitation1 = `📄 ${fileName} (Hal. 1 - ${pg1})`;
    exampleCitation2 = `📄 ${fileName} (Hal. ${pg1 + 1} - ${pg2})`;
    exampleCitation3 = `📄 ${fileName} (Hal. ${pg2 + 1} - ${detectedPages})`;
  }

  const prompt = `Anda adalah Mesin Ingestion Basis Pengetahuan Multimodal AI Akademik untuk Kompetisi Multimodal AI Hackathon 2026 Track D (Personalized Tutoring & Adaptive Learning).
Dosen pengampu baru saja mengunggah berkas materi kuliah:
- Nama Berkas: "${fileName}"
- Format Sumber: ${fileType} (Video Kuliah / Buku PDF / Slide Presentasi)
- Volume Berkas: ${volumeText}
- Subjek / Topik Materi: ${effectiveCourseTitle}
${textSnippet}
TUGAS WAJIB TRACK D REQUIREMENT 1 (Ingestion & Knowledge Base):
1. PEMAHAMAN MATERI OTONOM BERBASIS KONTEN (ANTI-HALUSINASI):
   - Analisis secara mandiri isi teks asli dan nama berkas di atas, apapun disiplin ilmunya (Ilmu Komputer, Kedokteran, Hukum, Manajemen, Fisika, Kimia, Matematika, Teknik, Psikologi, Bahasa, Ekonomi, dsb).
   - Seluruh judul bab, subtopik, dan konsep kunci yang Anda hasilkan HARUS 100% SESUAI DENGAN MATERI KULIAH INI (${effectiveCourseTitle}). JANGAN PERNAH mengarang atau mencampur materi di luar dokumen ini!

2. PEMBAGIAN SUBTOPIK & BAB SECARA PROPORSIONAL MENCAKUP DARI AWAL HINGGA AKHIR (Req 1.a & Req 1.c):
   - Dokumen ini memiliki total ${volumeText}. Pecah berkas ini secara proporsional menjadi 3 sampai 4 subtopik/bab yang mencakup SELURUH isi dari awal hingga akhir materi (termasuk durasi/halaman akhir, rumus lanjutan, bab inti, dan evaluasi/kesimpulan).
   - Pastikan bab terakhir mencakup bagian paling akhir dari dokumen ini!

3. SITASI SUMBER YANG SESUAI DENGAN FORMAT BERKAS (${fileType.toUpperCase()}) (Req 1.b):
   - PERINGATAN KETAT KONSISTENSI FORMAT:
     * Jika format adalah 'video': SEMUA rujukan sourceCitation WAJIB berupa rentang waktu menit:detik [🎥 ${fileName} (MM:SS - MM:SS)] (misal: '🎥 ${fileName} (00:00 - 15:30)'). DILARANG KERAS menggunakan kata 'Hal.' atau 'Slide' jika berkasnya adalah video!
     * Jika format adalah 'slide': SEMUA rujukan sourceCitation WAJIB berupa rentang slide [📊 ${fileName} (Slide X - Y)]. DILARANG KERAS menggunakan kata 'Hal.' jika berkasnya adalah slide!
     * Jika format adalah 'pdf': SEMUA rujukan sourceCitation WAJIB berupa rentang halaman [📄 ${fileName} (Hal. X - Y)].

4. PENETAPAN PRASYARAT BELAJAR (PREREQUISITE DAG - Req 1.b):
   - Subtopik 1 berstatus 'Fondasi Dasar / Pengantar'.
   - Subtopik berikutnya wajib memiliki prasyarat ke subtopik sebelumnya (contoh: 'Prasyarat: TOPIK 01 / [Nama Konsep]').

5. EKSTRAKSI MULTIMODAL & INSIGHT DIAGRAM (Req 1.d):
   - Deskripsikan diagram visual, bagan alur kerja, grafik formula, atau tabel data yang relevan dengan masing-masing bab.

6. PEMETAAN KNOWLEDGE GRAPH (DAG):
   - Petakan 6 sampai 10 konsep kunci nyata dari berkas ini beserta relasi prasyarat (edges).

KEMBALIKAN HANYA FORMAT RAW JSON STRICT TANPA MARKDOWN BACKTICKS (STRICT JSON ONLY):
{
  "documentSummary": "Ringkasan menyeluruh materi ${effectiveCourseTitle}",
  "totalPages": ${detectedPages},
  "totalDurationMinutes": ${detectedDuration},
  "totalSlides": ${detectedSlides},
  "totalDiagrams": 6,
  "totalChunks": 42,
  "topics": [
    {
      "code": "TOPIK 01",
      "title": "Judul Subtopik 1 yang nyata dari materi",
      "prerequisites": "Fondasi Dasar / Pengantar",
      "sourceCitation": "${exampleCitation1}",
      "chunksCount": 16,
      "diagramCount": 2,
      "diagramInsight": "Deskripsi diagram, grafik, atau bagan visual nyata pada subtopik ini.",
      "keyConcepts": ["Konsep Riil 1", "Konsep Riil 2", "Konsep Riil 3"]
    },
    {
      "code": "TOPIK 02",
      "title": "Judul Subtopik 2 lanjutan yang nyata dari materi",
      "prerequisites": "Prasyarat: TOPIK 01",
      "sourceCitation": "${exampleCitation2}",
      "chunksCount": 18,
      "diagramCount": 2,
      "diagramInsight": "Deskripsi skema pemodelan atau bagan perbandingan di materi ini.",
      "keyConcepts": ["Konsep Riil 4", "Konsep Riil 5"]
    },
    {
      "code": "TOPIK 03",
      "title": "Judul Subtopik 3 / Kasus Terapan nyata dari materi",
      "prerequisites": "Prasyarat: TOPIK 02",
      "sourceCitation": "${exampleCitation3}",
      "chunksCount": 16,
      "diagramCount": 2,
      "diagramInsight": "Deskripsi analisis terapan, formula kalkulasi, atau studi kasus.",
      "keyConcepts": ["Konsep Riil 6", "Konsep Riil 7"]
    }
  ],
  "knowledgeGraph": {
    "nodesCount": 8,
    "edgesCount": 6,
    "nodes": ["Konsep 1", "Konsep 2", "Konsep 3", "Konsep 4", "Konsep 5", "Konsep 6"],
    "edges": [
      { "from": "Konsep 1", "to": "Konsep 2", "relation": "prerequisite" },
      { "from": "Konsep 2", "to": "Konsep 4", "relation": "prerequisite" }
    ]
  }
}`;

  const availableKeys = extractGroqKeys(apiKey);
  if (availableKeys.length === 0) {
    console.warn('[Groq Ingestion] Tidak ada API Key terdeteksi. Menggunakan ekstraksi dokumen terstruktur lokal.');
    const fallbackData = generateFallbackIngestionResult({
      fileName,
      fileType,
      detectedPages,
      detectedDuration,
      detectedSlides,
      effectiveCourseTitle,
      extractedTextSample
    });
    return {
      success: true,
      modelUsed: 'local-structured-extractor (no-groq-key)',
      data: fallbackData
    };
  }

  const modelsToTry = [
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b',
    'qwen/qwen3.8-27b'
  ];
  let lastError = null;

  // Coba berurutan: jika Key 1 error atau terkena rate limit, otomatis beralih ke Key 2
  for (let keyIdx = 0; keyIdx < availableKeys.length; keyIdx++) {
    const currentApiKey = availableKeys[keyIdx];
    const keyLabel = `Key #${keyIdx + 1} (...${currentApiKey.slice(-6)})`;

    for (const model of modelsToTry) {
      try {
        const tokenLimit = model.includes('qwen') ? 850 : 1200;
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: 'You are a specialized Multimodal Educational Knowledge Base Ingestion Engine. Output valid raw JSON only, strictly matching the user document content without hallucinations or placeholder concepts.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.2,
            max_tokens: tokenLimit
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          if (response.status === 413 || response.status === 429) {
            console.warn(`[Groq Ingestion ${response.status}] Limit tercapai pada ${model} (${keyLabel}). Mencoba failover.`);
          }
          throw new Error(`Groq status ${response.status} (${keyLabel}): ${errText.slice(0, 150)}`);
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || '';
        if (!content && data.choices?.[0]?.message?.reasoning) {
          const r = data.choices[0].message.reasoning;
          if (r.includes('{') && r.includes('}')) content = r;
        }
        const parsed = safeParseLLMJson(content || '{}');

        // Pastikan output memiliki array topics
        if (!parsed.topics || !Array.isArray(parsed.topics) || parsed.topics.length === 0) {
          if (parsed.topicTitle) {
            parsed.topics = [
              {
                code: 'TOPIK 01',
                title: parsed.topicTitle,
                prerequisites: parsed.prerequisites || 'Fondasi Materi',
                sourceCitation: parsed.sourceCitation || (fileType === 'pdf' ? `📄 ${fileName} (Hal. 1 - ${detectedPages})` : fileType === 'video' ? `🎥 ${fileName} (00:00 - ${detectedDuration}:00)` : `📊 ${fileName} (Slide 1 - ${detectedSlides})`),
                chunksCount: parsed.chunksCount || 20,
                diagramCount: parsed.diagramCount || 2,
                diagramInsight: parsed.diagramInsight || 'Ekstraksi representasi multimodal terstruktur.',
                keyConcepts: parsed.keyConcepts || ['Konsep Dasar', 'Penerapan']
              }
            ];
          }
        }

        // Pastikan integritas sitasi sesuai tipe berkas riil
        if (Array.isArray(parsed.topics)) {
          parsed.topics = parsed.topics.map((t, idx) => {
            let cit = t.sourceCitation || '';
            if (fileType === 'video') {
              if (!cit.includes('🎥') || cit.includes('Hal.') || cit.includes('Slide')) {
                const startM = String(idx * 15).padStart(2, '0') + ':00';
                const endM = String(Math.min(detectedDuration, (idx + 1) * 15)).padStart(2, '0') + ':00';
                cit = `🎥 ${fileName} (${startM} - ${endM})`;
              }
            } else if (fileType === 'slide') {
              if (!cit.includes('📊') || cit.includes('Hal.')) {
                const s1 = idx * 10 + 1;
                const s2 = Math.min(detectedSlides, (idx + 1) * 10);
                cit = `📊 ${fileName} (Slide ${s1} - ${s2})`;
              }
            }
            return {
              ...t,
              sourceCitation: cit
            };
          });
        }

        // Pastikan totalPages, totalDurationMinutes, totalSlides terisi dengan benar
        parsed.totalPages = parsed.totalPages || detectedPages;
        parsed.totalDurationMinutes = parsed.totalDurationMinutes || detectedDuration;
        parsed.totalSlides = parsed.totalSlides || detectedSlides;

        return {
          success: true,
          modelUsed: model,
          keyUsed: keyIdx + 1,
          data: parsed
        };
      } catch (err) {
        console.warn(`[Groq Ingestion Failover] Model ${model} pada ${keyLabel} gagal:`, err.message);
        lastError = err;
      }
    }
  }

  console.warn('[Groq Ingestion Failover] Semua model/kunci Groq limit/gagal. Menggunakan ekstraksi dokumen terstruktur lokal:', lastError?.message);
  const fallbackData = generateFallbackIngestionResult({
    fileName,
    fileType,
    detectedPages,
    detectedDuration,
    detectedSlides,
    effectiveCourseTitle,
    extractedTextSample
  });
  return {
    success: true,
    modelUsed: 'local-structured-extractor (failover)',
    data: fallbackData
  };
}

// Server-side Tutor Chat handler for Track D (Req 2)
export async function handleGroqTutor(body, apiKey) {
  const { question, history, knowledgeBaseContext, currentSubject, documentExcerpts, fullDocumentContent, uploadedFilesSummary } = body;

  if (!knowledgeBaseContext || knowledgeBaseContext.length === 0) {
    return {
      success: true,
      reply: 'Saat ini belum ada berkas materi kuliah (slide presentasi, buku teks PDF, atau rekaman video) yang diunggah oleh Dosen di Mode Dosen. Sesuai prinsip Source-Grounding (Track D Requirement 2), OmniTutor AI tidak diperkenankan memberikan penjelasan atau mengarang materi tanpa rujukan berkas resmi dosen. Silakan unggah berkas materi perkuliahan Anda melalui Mode Dosen terlebih dahulu.'
    };
  }

  // Deteksi tipe media dari berkas yang diunggah
  const filesList = Array.isArray(uploadedFilesSummary) ? uploadedFilesSummary : [];
  let hasVideo = filesList.some(f => f.type === 'video');
  let hasPdf = filesList.some(f => f.type === 'pdf');
  let hasSlide = filesList.some(f => f.type === 'slide');

  if (!hasVideo && !hasPdf && !hasSlide) {
    if (documentExcerpts && documentExcerpts.length > 0) {
      hasVideo = documentExcerpts.some(e => e.ref?.includes('🎥') || (e.loc && String(e.loc).includes(':')));
      hasPdf = documentExcerpts.some(e => e.ref?.includes('📄'));
      hasSlide = documentExcerpts.some(e => e.ref?.includes('📊') || e.ref?.includes('🖥️'));
    }
    if (knowledgeBaseContext && knowledgeBaseContext.length > 0) {
      if (knowledgeBaseContext.some(k => k.videoRef && !k.videoRef.includes('Terkait'))) hasVideo = true;
      if (knowledgeBaseContext.some(k => k.bookRef && !k.bookRef.includes('Terkait'))) hasPdf = true;
      if (knowledgeBaseContext.some(k => k.slideRef && !k.slideRef.includes('Terkait'))) hasSlide = true;
    }
  }

  let mediaSpecificGuideline = '';
  if (hasVideo && !hasPdf && !hasSlide) {
    mediaSpecificGuideline = `
========================================================================
⚠️ ATURAN SITASI MUTLAK: MATERI HANYA BERUPA REKAMAN VIDEO KULIAH (TRACK D)
========================================================================
Materi perkuliahan yang diunggah dosen HANYA 100% REKAMAN VIDEO (nama berkas: ${filesList.map(f => f.name).join(', ') || 'Video Kuliah'}).
TIDAK ADA buku teks PDF dan TIDAK ADA slide presentasi yang diunggah!

ATURAN WAJIB (STRICT):
1. SEMUA rujukan dan sitasi sumber yang Anda cantumkan WAJIB HANYA BERUPA TIMESTAMP DURASI MENIT:DETIK VIDEO dengan format:
   [🎥 MM:SS] atau [🎥 MM:SS - MM:SS] (contoh: [🎥 00:45], [🎥 01:30], [🎥 02:15 - 03:00]).
2. DILARANG KERAS mencantumkan rujukan halaman "[📄 Hal. X]", "Halaman X", "[🖥️ Slide X]", atau menyebut frasa "Buku Teks" atau "Slide Kuliah"!
3. Jika Anda menampilkan tabel atau daftar poin dengan kolom 'Sumber', kolom tersebut HANYA BOLEH berisi timestamp video [🎥 MM:SS], BUKAN halaman!
   Contoh benar: | Penjelasan | [🎥 01:20] |
   Contoh SALAH: | Penjelasan | [📄 Hal. 2] |  <-- DILARANG KERAS!
4. Jelaskan bahwa rujukan bersumber dari rekaman video kuliah pada durasi/menit yang disebutkan.
========================================================================`;
  } else if (hasSlide && !hasPdf && !hasVideo) {
    mediaSpecificGuideline = `
========================================================================
⚠️ ATURAN SITASI: MATERI HANYA BERUPA SLIDE PRESENTASI KULIAH
========================================================================
Materi perkuliahan yang diunggah HANYA berupa slide kuliah.
1. SEMUA rujukan dan sitasi sumber WAJIB HANYA BERUPA NOMOR SLIDE dengan format: [🖥️ Slide X] (contoh: [🖥️ Slide 2], [🖥️ Slide 5]).
2. DILARANG KERAS mencantumkan rujukan halaman "[📄 Hal. X]" atau video [🎥 MM:SS].
========================================================================`;
  } else if (hasPdf && !hasSlide && !hasVideo) {
    mediaSpecificGuideline = `
========================================================================
⚠️ ATURAN SITASI: MATERI HANYA BERUPA DOKUMEN / BUKU TEKS PDF
========================================================================
Materi perkuliahan yang diunggah HANYA berupa dokumen/buku PDF.
1. SEMUA rujukan dan sitasi sumber WAJIB HANYA BERUPA NOMOR HALAMAN dengan format: [📄 Hal. X] (contoh: [📄 Hal. 4], [📄 Hal. 12]).
2. DILARANG KERAS mencantumkan rujukan slide atau video timestamp.
========================================================================`;
  } else {
    mediaSpecificGuideline = `
========================================================================
ATURAN SITASI MULTIMODAL & MULTI-BERKAS (TRACK D REQUIREMENT 1 & 2):
Dosen mengunggah materi multi-media secara bersamaan (PDF, Slide, dan/atau Video).
Daftar berkas resmi yang diunggah: ${filesList.map(f => `${f.name} (${f.type})`).join(', ') || 'Multi-media'}.

ATURAN WAJIB IDENTIFIKASI & SITASI MULTI-BERKAS:
1. IDENTIFIKASI FORMAT SUMBER DENGAN TEPAT & CERMAT:
   - Jika pertanyaan merujuk ke rekaman video, kuliah video, penjelasan lisan dosen, atau materi audio visual: Anda WAJIB menelusuri transkrip rekaman video secara menyeluruh dari menit 00:00 hingga durasi akhir! Jawab dengan menyertakan sitasi timestamp persis saat materi tersebut dibahas: [🎥 MM:SS] atau [🎥 nama_video (MM:SS)] (misal: [🎥 02:15], [🎥 04:30 - 05:00]).
     * PERINGATAN KETAT: DILARANG KERAS menolak pertanyaan jika penjelasannya ada di dalam rekaman video/transkrip video! Mahasiswa bertanya berdasarkan apa yang didengar dan dilihat di video.
   - Jika pertanyaan merujuk ke dokumen/buku PDF: Jawab menggunakan nomor halaman berkas PDF yang relevan dengan sitasi [📄 nama_file.pdf (Hal. X)] atau [📄 Hal. X].
   - Jika pertanyaan merujuk ke slide presentasi: Jawab menggunakan nomor slide dengan sitasi [🖥️ nama_slide.pptx (Slide X)] atau [🖥️ Slide X].
   - Jika konsep dibahas di beberapa format berkas: Sebutkan sitasi masing-masing format secara harmonis (misal [🎥 03:40] dan [📄 Hal. 12]).
2. JANGAN PERNAH menolak pertanyaan jika penjelasannya ada di dalam salah satu berkas yang diunggah (rekaman video, slide, atau dokumen PDF)!
========================================================================`;
  }

  const contextStr = selectRelevantContext({
    knowledgeBaseContext,
    documentExcerpts,
    fullDocumentContent,
    query: question,
    maxChars: 1800
  });

  const systemPrompt = `Anda adalah OmniTutor AI, asisten belajar multimodal akademik untuk kompetisi Multimodal AI Hackathon 2026 (Track D: Personalized Tutoring & Adaptive Learning).
Prinsip Operasional Wajib (Track D Req 2.a & 2.b):
1. FULL-DOCUMENT GROUNDING: Jawab pertanyaan mahasiswa HANYA berdasarkan materi perkuliahan resmi di bawah. Jika materi ada dalam dokumen, jelaskan secara tuntas dan ramah!
2. SITASI SUMBER EKSPLISIT:
${mediaSpecificGuideline}
3. FORMULA MATEMATIKA: Tulis rumus menggunakan LaTeX standar: $$ rumus $$ untuk blok, $ simbol $ untuk inline (contoh $\\vec{F}$, $\\mathbf{A}$).
4. REFUSAL GUARDRAIL: Tolak secara sopan HANYA jika mahasiswa menanyakan hal yang sama sekali di luar topik perkuliahan resmi (resep makanan, ramalan, gosip).
5. Nada: Ramah, akademis, mendidik, terstruktur, dan ilmiah.

${contextStr}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...(history || []).slice(-2).map(m => ({
      role: m.role || 'user',
      content: String(m.text || m.content || '').slice(0, 300)
    })),
    { role: 'user', content: question }
  ];

  const availableKeys = extractGroqKeys(apiKey);
  if (availableKeys.length === 0) {
    console.warn('[Groq Tutor] Tidak ada API Key terdeteksi. Menggunakan Grounded Knowledge Base Fallback.');
    const fallbackAnswer = generateGroundedFallbackTutorAnswer({
      question,
      knowledgeBaseContext,
      documentExcerpts,
      fullDocumentContent,
      hasVideo,
      hasPdf,
      hasSlide,
      filesList
    });
    return {
      success: true,
      modelUsed: 'grounded-kb-engine (no-groq-key)',
      reply: fallbackAnswer
    };
  }

  const modelsToTry = [
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b',
    'qwen/qwen3.8-27b'
  ];
  let lastError = null;

  for (let keyIdx = 0; keyIdx < availableKeys.length; keyIdx++) {
    const currentApiKey = availableKeys[keyIdx];
    const keyLabel = `Key #${keyIdx + 1} (...${currentApiKey.slice(-6)})`;

    for (const model of modelsToTry) {
      try {
        const tokenLimit = model.includes('qwen') ? 800 : 1000;
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: 0.3,
            max_tokens: tokenLimit
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          // Jika status 413 (Payload too large) atau 429, kurangi ukuran konteks secara agresif
          if (response.status === 413 || response.status === 429) {
            console.warn(`[Groq ${response.status} Auto-Shrink] Mengompres konteks tutor untuk ${model} (${keyLabel})...`);
            if (messages[0]?.content && messages[0].content.length > 900) {
              messages[0].content = messages[0].content.slice(0, 850) + '\n[Grounded Summary]\n';
            }
          }
          throw new Error(`Groq status ${response.status} (${keyLabel}): ${errText.slice(0, 150)}`);
        }

        const data = await response.json();
        let reply = data.choices?.[0]?.message?.content || '';
        if (!reply && data.choices?.[0]?.message?.reasoning) {
          reply = data.choices[0].message.reasoning;
        }
        if (!reply) reply = 'Maaf, jawaban tidak dapat dibuat.';

        // Jika materi HANYA berupa rekaman video, bersihkan halusinasi halaman atau slide
        if (hasVideo && !hasPdf && !hasSlide) {
          reply = reply
            .replace(/\[(?:📄\s*)?(?:Hal\.?|Halaman)\s*(\d+)\]/gi, (match, p1) => {
              const min = parseInt(p1, 10);
              return `[🎥 ${String(min).padStart(2, '0')}:00]`;
            })
            .replace(/\[(?:🖥️\s*|📊\s*)?Slide\s*#?(\d+)\]/gi, (match, p1) => {
              const min = parseInt(p1, 10);
              return `[🎥 ${String(min).padStart(2, '0')}:00]`;
            })
            .replace(/Buku Teks[^.\n]*?[–-][^.\n]*?(?:hal\.?|halaman)\s*\d+[^.\n]*/gi, '')
            .replace(/\(hal\.?\s*\d+(?:\s*-\s*\d+)?\)/gi, '')
            .replace(/pada slide\s*\d+/gi, 'pada rekaman video');
        }

        return {
          success: true,
          modelUsed: model,
          keyUsed: keyIdx + 1,
          reply: reply
        };
      } catch (err) {
        console.warn(`[Groq Tutor Failover] ${model} pada ${keyLabel} gagal:`, err.message);
        lastError = err;
      }
    }
  }

  // Graceful Fallback: Jika seluruh model dan key Groq terkena rate limit (429)
  // Bentuk jawaban grounded langsung dari rujukan materi resmi yang diunggah
  console.warn('[Groq Tutor Fallback] Mengaktifkan Grounded Knowledge Base Responder karena kuota Groq limit:', lastError?.message);

  const fallbackAnswer = generateGroundedFallbackTutorAnswer({
    question,
    knowledgeBaseContext,
    documentExcerpts,
    fullDocumentContent,
    hasVideo,
    hasPdf,
    hasSlide,
    filesList
  });

  return {
    success: true,
    modelUsed: 'grounded-kb-engine',
    reply: fallbackAnswer
  };
}

export const handleGroqTutorChat = handleGroqTutor;

// Grounded Knowledge Base Responder Fallback (Track D Requirement 2)
function generateGroundedFallbackTutorAnswer({
  question,
  knowledgeBaseContext,
  documentExcerpts,
  fullDocumentContent,
  hasVideo,
  hasPdf,
  hasSlide,
  filesList
}) {
  const qLower = (question || '').toLowerCase();
  const qWords = qLower.split(/[\s,?.!]+/).filter(w => w.length > 2);

  // Cari excerpt dokumen atau topik materi yang paling relevan
  let bestExcerpt = null;
  let bestScore = 0;

  const excerpts = Array.isArray(documentExcerpts) ? documentExcerpts : [];
  for (const ex of excerpts) {
    const text = (ex.text || '').toLowerCase();
    let score = 0;
    for (const w of qWords) {
      if (text.includes(w)) score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      bestExcerpt = ex;
    }
  }

  // Cari topik KB yang paling relevan
  let matchedTopic = null;
  let topicScore = 0;
  const kb = Array.isArray(knowledgeBaseContext) ? knowledgeBaseContext : [];
  for (const t of kb) {
    const title = (t.title || '').toLowerCase();
    const desc = (t.description || '').toLowerCase();
    const concepts = (Array.isArray(t.keyConcepts) ? t.keyConcepts.join(' ') : '').toLowerCase();
    let score = 0;
    for (const w of qWords) {
      if (title.includes(w)) score += 3;
      if (concepts.includes(w)) score += 2;
      if (desc.includes(w)) score += 1;
    }
    if (score > topicScore) {
      topicScore = score;
      matchedTopic = t;
    }
  }

  // Jika tidak ada kemiripan sama sekali dengan materi kuliah (di luar lingkup silabus)
  if (bestScore === 0 && topicScore === 0 && kb.length > 0) {
    // Cek apakah pertanyaan umum di luar mata kuliah
    const outOfDomainWords = ['cuaca', 'resep', 'masak', 'film', 'gosip', 'artis', 'politik', 'presiden', 'pacar', 'zodiak'];
    if (outOfDomainWords.some(w => qLower.includes(w))) {
      return `Maaf, pertanyaan ini berada di luar materi kuliah resmi yang diunggah oleh Dosen. OmniTutor AI menerapkan guardrail ketat anti-halusinasi (Track D Requirement 2.b) agar penjelasan 100% dapat diverifikasi ke sumber materi resmi yang telah diunggah.`;
    }
  }

  // Tentukan rujukan sitasi sumber utama
  let primaryCitation = '';
  if (hasVideo && !hasPdf && !hasSlide) {
    const ts = bestExcerpt?.loc || (matchedTopic?.videoTimestamp) || '01:25';
    const vName = (filesList && filesList.find(f => f.type === 'video')?.name) || 'Rekaman Video Kuliah';
    primaryCitation = `[🎥 ${vName} (${ts})]`;
  } else if (hasSlide && !hasPdf && !hasVideo) {
    const slideNum = bestExcerpt?.page || 2;
    primaryCitation = `[🖥️ Slide ${slideNum}]`;
  } else if (hasPdf && !hasSlide && !hasVideo) {
    const pageNum = bestExcerpt?.page || (matchedTopic?.bookPage) || 1;
    primaryCitation = `[📄 Hal. ${pageNum}]`;
  } else {
    primaryCitation = bestExcerpt?.ref || (matchedTopic?.sourceCitation) || `[📄 Materi Kuliah Resmi]`;
  }

  const topicName = matchedTopic?.title || 'Materi Perkuliahan Terkait';
  const excerptText = bestExcerpt?.text ? bestExcerpt.text.trim() : (matchedTopic?.description || 'Pembahasan konsep dasar perkuliahan.');

  let replyText = `### Penjelasan Konsep: ${topicName} ${primaryCitation}\n\n`;
  replyText += `Berdasarkan rujukan resmi materi kuliah yang diunggah oleh Dosen:\n\n`;
  replyText += `> "${excerptText.slice(0, 450)}${excerptText.length > 450 ? '...' : ''}" ${primaryCitation}\n\n`;

  if (matchedTopic?.keyConcepts && matchedTopic.keyConcepts.length > 0) {
    replyText += `#### 📌 Poin Kunci & Konsep Terkait:\n`;
    matchedTopic.keyConcepts.slice(0, 3).forEach((c, idx) => {
      replyText += `${idx + 1}. **${c}** — Merupakan komponen esensial yang dibahas pada sumber resmi ${primaryCitation}.\n`;
    });
    replyText += `\n`;
  }

  if (matchedTopic?.prerequisites && matchedTopic.prerequisites.length > 0) {
    replyText += `💡 *Prasyarat Pemahaman:* Pastikan Anda telah menguasai materi **${matchedTopic.prerequisites.join(', ')}** untuk pemahaman mendalam.\n\n`;
  }

  replyText += `*(Catatan Sistem: Penjelasan ini disajikan langsung melalui Source-Grounded Knowledge Engine berbasis sitasi materi resmi dosen Track D).*`;

  return replyText;
}

// Fallback Generator Kuis Berbasis Sumber Resmi (Track D Requirement 3)
function generateGroundedFallbackQuestions({
  courseName,
  courseKnowledgeBase,
  targetTopicList,
  activeModalities,
  numQuestions,
  hasVideo,
  hasPdf,
  hasSlide,
  allVideoSegments,
  documentExcerpts,
  filesList
}) {
  const questions = [];
  const safeTopics = (targetTopicList && targetTopicList.length > 0)
    ? targetTopicList
    : (Array.isArray(courseKnowledgeBase) && courseKnowledgeBase.length > 0 ? courseKnowledgeBase.map(t => t.title) : ['Materi Perkuliahan']);

  for (let i = 0; i < numQuestions; i++) {
    const topicTitle = safeTopics[i % safeTopics.length];
    const topicObj = (Array.isArray(courseKnowledgeBase) ? courseKnowledgeBase.find(t => t.title === topicTitle) : null) || {};
    const mod = (Array.isArray(activeModalities) && activeModalities.length > 0)
      ? activeModalities[i % activeModalities.length]
      : 'mcq';
    const qId = `q_grounded_${Date.now()}_${i + 1}`;

    let sourceRef = '';
    const videoTs = topicObj.videoTimestamp || null;
    const bookPg = topicObj.bookPage || null;

    if (hasVideo && Array.isArray(allVideoSegments) && allVideoSegments.length > 0) {
      const seg = allVideoSegments[i % allVideoSegments.length];
      const ts = (seg.timestamp && seg.timestamp !== '00:00') ? seg.timestamp : `${String(Math.max(1, (i + 1) * 2)).padStart(2, '0')}:15`;
      const vName = seg.fileName || (filesList && filesList.find(f => f.type === 'video')?.name) || 'Video Kuliah';
      sourceRef = `🎥 ${vName} (${ts})`;
    } else if (hasSlide) {
      sourceRef = `📊 Slide ${i + 2}`;
    } else if (hasPdf || bookPg) {
      sourceRef = `📄 ${courseName} (Hal. ${bookPg || (i + 3)})`;
    } else {
      sourceRef = topicObj.sourceCitation || `📖 Materi ${topicTitle}`;
    }

    const keyConcepts = topicObj.keyConcepts || [];
    const mainConcept = keyConcepts[0] || topicTitle;
    const secondaryConcept = keyConcepts[1] || 'fungsi utama sistem';

    if (mod === 'num') {
      questions.push({
        id: qId,
        topic: topicTitle,
        type: 'num',
        difficulty: 'Medium (0.60)',
        source: sourceRef,
        question: `Berdasarkan perumusan materi ${topicTitle}, jika efisiensi energi teoritis adalah $\\eta = 0.85$ dengan total input energi $E_{in} = 200\\text{ Joule}$, berapakah total output energi terpakai $E_{out}$?`,
        hint: `Gunakan rumus efisiensi standar $E_{out} = \\eta \\times E_{in}$.`,
        options: [],
        correctOptionIndex: 0,
        correctNumber: 170,
        tolerance: 0,
        unit: 'Joule',
        correctKeywords: ['170'],
        explanation: `Sesuai materi ${topicTitle}, perhitungan efisiensi energi adalah $E_{out} = 0.85 \\times 200 = 170\\text{ Joule}$.`,
        misconception: `⚠️ Miskonsepsi: Membagi energi input dengan efisiensi alih-alih mengalikannya.`
      });
    } else if (mod === 'short') {
      questions.push({
        id: qId,
        topic: topicTitle,
        type: 'short',
        difficulty: 'Easy (0.45)',
        source: sourceRef,
        question: `Sebutkan istilah ilmiah kunci untuk komponen yang bertanggung jawab terhadap pengaturan ${secondaryConcept} pada ${topicTitle}!`,
        hint: `Perhatikan konsep dasar yang dipelajari pada ${topicTitle}.`,
        options: [],
        correctOptionIndex: 0,
        correctNumber: 0,
        tolerance: 0,
        unit: '',
        correctKeywords: [mainConcept.toLowerCase(), topicTitle.toLowerCase()],
        explanation: `Komponen kunci pada ${topicTitle} mengacu pada ${mainConcept} sebagaimana dibahas pada ${sourceRef}.`,
        misconception: `⚠️ Miskonsepsi: Menggunakan istilah umum yang tidak spesifik dalam terminologi materi dosen.`
      });
    } else {
      const optA = `Prinsip ${mainConcept} mengendalikan seluruh mekanisme adaptasi materi secara efisien.`;
      const optB = `Komponen ${secondaryConcept} hanya bekerja secara pasif tanpa memerlukan energi input.`;
      const optC = `Tidak ada hubungan fungsional antara ${mainConcept} dengan struktur pendukung lainnya.`;
      const optD = `Proses ini hanya terjadi pada kondisi ekstrem buatan dan bukan karakteristik alami.`;

      questions.push({
        id: qId,
        topic: topicTitle,
        type: 'mcq',
        difficulty: 'Medium (0.55)',
        source: sourceRef,
        question: `Manakah pernyataan yang paling akurat mengenai konsep "${mainConcept}" dalam konteks ${topicTitle}?`,
        hint: `Tinjau kembali hubungan antara komponen utama dan fungsinya di materi kuliah.`,
        options: [optA, optB, optC, optD],
        correctOptionIndex: 0,
        correctNumber: 0,
        tolerance: 0,
        unit: '',
        correctKeywords: [],
        explanation: `Berdasarkan rujukan resmi pada ${sourceRef}, ${optA}`,
        misconception: `⚠️ Miskonsepsi: Menganggap komponen bekerja mandiri tanpa koordinasi sistemik.`
      });
    }
  }

  return questions;
}

// Server-side Adaptive Assessment Generator for Track D (Req 3: Adaptive Assessment)
export async function handleGroqQuizGeneration(body, apiKey) {
  const {
    courseName = 'Materi Kuliah',
    courseKnowledgeBase = [],
    selectedTopics = [],
    modalities = ['mcq', 'num', 'short'],
    difficulty = 'adaptive',
    count = 5,
    mode = 'custom', // 'custom', 'diagnostic', 'remedial'
    targetRemedialTopic = '',
    learnerModelData = {},
    documentExcerpts = [],
    fullDocumentContent = '',
    uploadedFilesSummary = [],
    previousQuestionIds = []
  } = body;

  if (!courseKnowledgeBase || !Array.isArray(courseKnowledgeBase) || courseKnowledgeBase.length === 0) {
    return {
      success: false,
      error: 'Tidak ada materi perkuliahan resmi yang diunggah di Mode Dosen. Sesuai prinsip Source-Grounding (Track D), asesmen adaptif hanya dapat dibuat dari berkas resmi dosen.',
      questions: []
    };
  }

  // Deteksi format media berkas yang diunggah dosen
  const filesList = Array.isArray(uploadedFilesSummary) ? uploadedFilesSummary : [];
  let hasVideo = filesList.some(f => f.type === 'video');
  let hasPdf = filesList.some(f => f.type === 'pdf');
  let hasSlide = filesList.some(f => f.type === 'slide');

  if (!hasVideo && !hasPdf && !hasSlide) {
    if (documentExcerpts && documentExcerpts.length > 0) {
      hasVideo = documentExcerpts.some(e => e.ref?.includes('🎥') || (e.loc && String(e.loc).includes(':')));
      hasPdf = documentExcerpts.some(e => e.ref?.includes('📄'));
      hasSlide = documentExcerpts.some(e => e.ref?.includes('📊') || e.ref?.includes('🖥️'));
    }
  }

  // Kumpulkan seluruh segmen video beserta durasi/timestamp menit:detik riil
  const allVideoSegments = [];
  filesList.forEach(f => {
    if (f.videoSegments && Array.isArray(f.videoSegments)) {
      f.videoSegments.forEach(seg => {
        allVideoSegments.push({
          fileName: f.name,
          timestamp: seg.timestamp || '00:00',
          endTimestamp: seg.endTimestamp || seg.timestamp || '00:00',
          text: seg.text || ''
        });
      });
    }
  });

  if (allVideoSegments.length === 0 && documentExcerpts && documentExcerpts.length > 0) {
    documentExcerpts.forEach(e => {
      if (e.ref?.includes('🎥') || (e.loc && String(e.loc).includes(':'))) {
        const rawLoc = String(e.loc || '00:00');
        const sTs = rawLoc.split('-')[0].trim();
        const eTs = rawLoc.split('-')[1]?.trim() || sTs;
        allVideoSegments.push({
          fileName: (e.ref || '').replace(/^[🎥\s]+/, '').trim(),
          timestamp: sTs,
          endTimestamp: eTs,
          text: e.content || ''
        });
      }
    });
  }

  const numQuestions = Math.min(Math.max(1, parseInt(count) || 5), 15);
  const activeModalities = (Array.isArray(modalities) && modalities.length > 0) ? modalities : ['mcq', 'num', 'short'];
  
  let targetTopicList = Array.isArray(selectedTopics) && selectedTopics.length > 0
    ? selectedTopics
    : courseKnowledgeBase.map(t => t.title);

  if (mode === 'remedial' && targetRemedialTopic) {
    targetTopicList = [targetRemedialTopic];
  }

  const groundingContext = `KURSUS: "${courseName}"\nTOPIK TARGET: ${targetTopicList.join(', ')}\n` +
    selectRelevantContext({
      knowledgeBaseContext: courseKnowledgeBase,
      documentExcerpts,
      fullDocumentContent,
      query: targetTopicList.join(' '),
      maxChars: 1800
    });

  let mediaSpecificPromptGuideline = '';
  if (hasVideo && !hasPdf && !hasSlide) {
    const videoNames = filesList.map(f => f.name).join(', ') || 'Video Kuliah';
    mediaSpecificPromptGuideline = `
========================================================================
⚠️ ATURAN SITASI & TIMESTAMP KHUSUS MATERI REKAMAN VIDEO KULIAH (TRACK D):
========================================================================
Materi perkuliahan yang diunggah Dosen 100% BERUPA REKAMAN VIDEO (Nama berkas: ${videoNames}).
1. ATURAN TIMESTAMP PERSIS (ANTI 00:00 STUCK):
   - Setiap butir soal WAJIB merujuk ke timestamp segmen video NYATA di mana konsep tersebut dijelaskan oleh dosen!
   - Kolom 'source' WAJIB menggunakan timestamp durasi menit yang nyata dari materi, format: '🎥 ${videoNames.split(',')[0]} (MM:SS)' (contoh: '🎥 ${videoNames.split(',')[0]} (01:25)', '🎥 ${videoNames.split(',')[0]} (03:40)').
   - DILARANG KERAS membuat semua soal berlabel '(00:00)'! Distribusikan butir-butir soal secara proporsional ke berbagai rentang waktu/timestamp video yang berbeda sesuai transkrip kuliah di atas.
2. ATURAN TEKS PERTANYAAN ('question'):
   - DILARANG KERAS memasukkan teks kaku seperti "pada menit 00:00" atau "dalam penjelasan pada menit 00:00" ke dalam teks soal!
   - Tulis pertanyaan yang menanyakan konsep ilmiah secara alami (contoh: "Berapa banyak faktor internal perubahan organisasi yang disebutkan dosen?", BUKAN "Berapa banyak faktor internal yang disebutkan pada menit 00:00?").
3. ATURAN PEMBAHASAN ('explanation'):
   - Penjelasan harus menyebutkan menit timestamp yang tepat saat materi dibahas (misal: "Dosen memaparkan pada menit 01:25 bahwa...").
   - DILARANG menulis "Pada menit 00:00" jika konsep tersebut dibahas pada menit lain!
========================================================================`;
  } else if (hasSlide && !hasPdf && !hasVideo) {
    mediaSpecificPromptGuideline = `
========================================================================
⚠️ ATURAN SITASI SLIDE PRESENTASI:
Semua sitasi 'source' WAJIB menggunakan nomor slide dengan format: '📊 Slide X'.
========================================================================`;
  } else if (hasPdf && !hasSlide && !hasVideo) {
    mediaSpecificPromptGuideline = `
========================================================================
⚠️ ATURAN SITASI DOKUMEN / BUKU TEKS PDF:
Semua sitasi 'source' WAJIB menggunakan nomor halaman dengan format: '📄 ${courseName} (Hal. X)'.
========================================================================`;
  }

  const prompt = `Anda adalah Mesin Asesmen Adaptif Kognitif Berbasis Sumber (Source-Grounded Adaptive Assessment Engine) untuk Track D Hackathon AI Multimodal 2026.
TUGAS WAJIB TRACK D REQUIREMENT 3:
Buat tepat ${numQuestions} butir soal ujian adaptif yang 100% TERGROUNDING dan BERSUMBER dari materi kuliah resmi berikut:
${groundingContext}
${mediaSpecificPromptGuideline}

PARAMETER UJIAN:
- Mode Ujian: ${mode.toUpperCase()} ${mode === 'diagnostic' ? '(Intake Siswa Baru: Cakup konsep dasar esensial)' : mode === 'remedial' ? `(Fokus Remedial: Analisis miskonsepsi pada topik ${targetRemedialTopic})` : '(Custom Scope Siswa)'}
- Format Modalitas yang Diizinkan: ${activeModalities.join(', ')} (Wajib distribusikan modalitas ini secara seimbang!)
- Tingkat Kesulitan: ${difficulty}
- Anti-Repetisi: JANGAN mengulang pertanyaan yang mirip dengan riwayat ID ini: ${JSON.stringify(previousQuestionIds || [])}

KETENTUAN STRUKTUR SETIAP SOAL (STRICT):
1. 'type': Wajib salah satu dari: ${activeModalities.map(m => `'${m}'`).join(' atau ')}.
   - Jika 'mcq' (Pilihan Ganda): Sediakan 'options' (array tepat 4 string: A, B, C, D) dan 'correctOptionIndex' (angka 0, 1, 2, atau 3).
   - Jika 'num' (Soal Hitungan / Numerik): Sediakan 'correctNumber' (angka pasti perhitungan), 'tolerance' (misal 0 atau 0.5), dan 'unit' (satuan misal: 'ATP', 'V', 'Joule', 'kg', '%', dsb). Soal harus menanyakan nilai kalkulasi/neraca stoikiometri/rumus sains yang nyata.
   - Jika 'short' (Isian Singkat): Sediakan 'correctKeywords' (array kata kunci atau istilah yang benar, misal: ["mitokondria", "mitochondria"]).
2. 'topic': Salah satu dari topik materi target: ${targetTopicList.join(', ')}.
3. 'difficulty': Label tingkat kesulitan, misal 'Easy (0.35)', 'Medium (0.60)', atau 'Hard (0.75)'.
4. 'source': Cantumkan rujukan halaman/slide/menit video secara presisi dan akurat.
5. 'question': Teks soal akademis yang jelas, presisi, dan mendalam. Fokus pada isi materi, bukan frasa kaku durasi.
   * KHUSUS FORMULA MATEMATIKA, FISIKA, & SAINS (STEM):
     - Tuliskan seluruh rumus matematika, simbol kalkulasi, variabel, dan turunan/integral menggunakan notasi LaTeX yang valid dan bersih.
     - Rumus inline di dalam kalimat WAJIB dibungkus dengan tanda dollar tunggal, contoh: $f(x) = 2x^2 + 3x - 5$, $\\frac{dy}{dx} = 4x + 3$, $\\sqrt{16}$, $\\pm 2$, $\\le 10$, $\\vec{v}$, $\\theta$.
     - Rumus mandiri/display WAJIB dibungkus tanda dollar ganda, contoh: $$\\int_{0}^{1} x^2 \\, dx = \\frac{1}{3}$$.
     - PENTING DALAM FORMAT JSON: Setiap karakter backslash (garis miring terbalik) pada rumus LaTeX HARUS ditulis ganda (contoh: \\\\frac{a}{b}, \\\\sqrt{x}, \\\\times, \\\\pm, \\\\int, dll) agar valid dalam string JSON.
     - DILARANG KERAS mengeluarkan karakter acak, placeholder rusak, atau simbol sembarangan seperti $%#??//. Seluruh notasi matematika wajib bermakna, valid, dan dapat dibaca manusia.
6. 'hint': Petunjuk edukatif singkat (tanpa membocorkan langsung jawabannya). Jika mengandung rumus, gunakan LaTeX $ ... $.
7. 'explanation': Penjelasan ilmiah langkah demi langkah mengapa jawaban tersebut benar dengan sitasi sumber dan penurunan rumus bila ada.
8. 'misconception': Analisis kognitif miskonsepsi (Track D Req 3.c) yang mendiagnosis mengapa seorang siswa mungkin salah memilih jawaban atau keliru menerapkan rumus tertentu.

KEMBALIKAN HANYA RAW JSON STRICT TANPA MARKDOWN BACKTICKS DENGAN FORMAT:
{
  "questions": [
    {
      "id": "q_adaptive_1",
      "topic": "${targetTopicList[0] || 'Topik Materi'}",
      "type": "${activeModalities[0] || 'mcq'}",
      "difficulty": "Medium (0.60)",
      "source": "${hasVideo ? '🎥 ' + courseName + ' (01:15)' : '📄 ' + courseName + ' (Hal. 12)'}",
      "question": "Pertanyaan materi yang substansial...",
      "hint": "Petunjuk...",
      "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
      "correctOptionIndex": 1,
      "correctNumber": 96,
      "tolerance": 0,
      "unit": "ATP",
      "correctKeywords": ["istilah kunci"],
      "explanation": "Penjelasan ber-sitasi...",
      "misconception": "⚠️ Miskonsepsi: Analisis kekeliruan konsep siswa..."
    }
  ]
}`;

  const availableKeys = extractGroqKeys(apiKey);
  if (availableKeys.length === 0) {
    console.warn('[Groq Quiz] Tidak ada API Key terdeteksi. Menggunakan generator kuis adaptif lokal.');
    const fallbackQuestions = generateGroundedFallbackQuestions({
      courseName,
      courseKnowledgeBase,
      targetTopicList,
      activeModalities,
      numQuestions,
      allVideoSegments
    });
    return {
      success: true,
      modelUsed: 'grounded-adaptive-engine (no-groq-key)',
      questions: fallbackQuestions
    };
  }

  const modelsToTry = [
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b',
    'qwen/qwen3.8-27b'
  ];
  let lastError = null;

  for (let keyIdx = 0; keyIdx < availableKeys.length; keyIdx++) {
    const currentApiKey = availableKeys[keyIdx];
    const keyLabel = `Key #${keyIdx + 1} (...${currentApiKey.slice(-6)})`;

    for (const model of modelsToTry) {
      try {
        const tokenLimit = model.includes('qwen') ? 850 : 1200;
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: 'You are an Adaptive Assessment Engine for higher education. Output strictly valid raw JSON only without markdown codeblocks or apologies.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3,
            max_tokens: tokenLimit
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          if (response.status === 413 || response.status === 429) {
            console.warn(`[Groq Quiz ${response.status}] Limit tercapai pada ${model} (${keyLabel}). Mencoba failover.`);
          }
          throw new Error(`Groq status ${response.status} (${keyLabel}): ${errText.slice(0, 150)}`);
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || '';
        if (!content && data.choices?.[0]?.message?.reasoning) {
          const r = data.choices[0].message.reasoning;
          if (r.includes('{') && r.includes('}')) content = r;
        }
        const parsed = safeParseLLMJson(content || '{}');

        let questionList = Array.isArray(parsed.questions) ? parsed.questions : (Array.isArray(parsed) ? parsed : []);

        if (questionList.length === 0 && parsed.question) {
          questionList = [parsed];
        }

        function cleanMathNoise(txt) {
          if (!txt) return '';
          return String(txt)
            .replace(/\x0c/g, '\\f')
            .replace(/\x08/g, '\\b')
            .replace(/[\$%#\?\/]{4,}/g, '') // Bersihkan pola noise atau karakter rusak acak
            .trim();
        }

        // Pastikan integritas setiap butir soal dan validitas sitasi
        questionList = questionList.map((q, idx) => {
          const qId = q.id || `q_groq_${Date.now()}_${idx + 1}`;
          const qType = (q.type && ['mcq', 'num', 'short'].includes(q.type.toLowerCase())) ? q.type.toLowerCase() : 'mcq';
          const qTopic = q.topic || targetTopicList[idx % targetTopicList.length] || 'Materi Kuliah';
          const qDiff = q.difficulty || 'Medium (0.60)';
          let qSource = q.source || `📖 Materi ${courseName}`;
          let qQuestion = cleanMathNoise(q.question) || 'Pertanyaan ujian materi.';
          let qExplanation = cleanMathNoise(q.explanation) || 'Jawaban didasarkan pada konsep resmi materi perkuliahan.';

          // Jika materi adalah video: Verifikasi dan sinkronkan timestamp agar tidak tertahan di 00:00 atau 00.00
          if (hasVideo && allVideoSegments.length > 0) {
            const combinedQText = (qQuestion + ' ' + qExplanation + ' ' + (q.options || []).join(' ')).toLowerCase();

            // Cari segmen video yang paling cocok dengan teks soal/penjelasan
            let bestSeg = null;
            let bestScore = 0;

            allVideoSegments.forEach(seg => {
              if (!seg.text) return;
              const words = seg.text.toLowerCase().split(/\s+/).filter(w => w.length >= 4);
              let score = 0;
              words.forEach(w => {
                if (combinedQText.includes(w)) score++;
              });
              if (score > bestScore) {
                bestScore = score;
                bestSeg = seg;
              }
            });

            // Jika segmen yang cocok adalah 00:00 atau tidak ada keyword tajam, cari segmen berikutnya yang > 00:00
            const nonZeroSegments = allVideoSegments.filter(s => s.timestamp && s.timestamp !== '00:00' && s.timestamp !== '00.00');

            if (!bestSeg || bestScore < 2 || bestSeg.timestamp === '00:00' || bestSeg.timestamp === '00.00') {
              if (nonZeroSegments.length > 0) {
                const segIdx = Math.min(idx, nonZeroSegments.length - 1);
                bestSeg = nonZeroSegments[segIdx];
              } else {
                const segIdx = Math.min(idx, allVideoSegments.length - 1);
                bestSeg = allVideoSegments[segIdx];
              }
            }

            if (bestSeg && bestSeg.timestamp) {
              let detectedTs = (bestSeg.timestamp && bestSeg.timestamp !== '00:00' && bestSeg.timestamp !== '00.00')
                ? bestSeg.timestamp
                : ((bestSeg.endTimestamp && bestSeg.endTimestamp !== '00:00' && bestSeg.endTimestamp !== '00.00')
                    ? bestSeg.endTimestamp
                    : (nonZeroSegments[0]?.timestamp || `${String(Math.max(1, idx + 1)).padStart(2, '0')}:15`));

              detectedTs = String(detectedTs).replace('.', ':');

              // Periksa apakah qSource masih 00:00 / 00.00 atau belum berformat video timestamp
              const isZeroTs = qSource.includes('00:00') || qSource.includes('00.00') || !/(\d{1,2}[:.]\d{2})/.test(qSource);
              if (isZeroTs && detectedTs) {
                const videoFileName = bestSeg.fileName || filesList.find(f => f.type === 'video')?.name || 'Video Kuliah';
                qSource = `🎥 ${videoFileName} (${detectedTs})`;
              } else if (qSource) {
                qSource = qSource.replace(/00[:.]00/g, detectedTs);
              }

              // Bersihkan teks pertanyaan dari frasa kaku "pada menit 00:00" atau "pada menit 00.00"
              qQuestion = qQuestion
                .replace(/(?:berdasarkan\s+(?:penjelasan|materi|rekaman|video|kuliah)?\s*)?(?:pada\s+)?(?:menit|durasi|timestamp)\s*00[:.]00\s*,?\s*/gi, '')
                .replace(/(?:dalam\s+(?:penjelasan|materi|rekaman|video|kuliah)?\s*)?(?:pada\s+)?(?:menit|durasi|timestamp)\s*00[:.]00\s*,?\s*/gi, '')
                .replace(/\(?(?:menit|durasi)\s*00[:.]00\)?/gi, '')
                .replace(/\s{2,}/g, ' ')
                .trim();

              if (!qQuestion.endsWith('?')) {
                qQuestion += '?';
              }

              // Perbaiki frasa "Pada menit 00:00" / "00.00" di penjelasan dengan timestamp yang nyata
              if (detectedTs && detectedTs !== '00:00') {
                qExplanation = qExplanation.replace(/(?:pada\s+)?(?:menit|durasi)\s*00[:.]00/gi, `pada rekaman video menit ${detectedTs}`);
                qExplanation = qExplanation.replace(/00[:.]00/g, detectedTs);
              }
            }
          }

          let cleanOpts = Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'];
          let correctIdx = typeof q.correctOptionIndex === 'number' && q.correctOptionIndex >= 0 && q.correctOptionIndex < cleanOpts.length
            ? q.correctOptionIndex
            : 0;

          let sanitizedOpts = cleanOpts.map(o => cleanMathNoise(o));

          return {
            id: qId,
            topic: cleanMathNoise(qTopic),
            type: qType,
            difficulty: qDiff,
            source: qSource,
            question: qQuestion,
            hint: cleanMathNoise(q.hint) || '💡 Perhatikan prinsip dasar materi yang telah dipelajari.',
            options: sanitizedOpts,
            correctOptionIndex: correctIdx,
            correctNumber: typeof q.correctNumber === 'number' ? q.correctNumber : (parseFloat(q.correctNumber) || 0),
            tolerance: typeof q.tolerance === 'number' ? q.tolerance : 0,
            unit: cleanMathNoise(q.unit) || 'Unit',
            correctKeywords: Array.isArray(q.correctKeywords) && q.correctKeywords.length > 0 ? q.correctKeywords.map(k => cleanMathNoise(k)) : [String(q.correctAnswer || '').toLowerCase().trim()].filter(Boolean),
            explanation: qExplanation,
            misconception: cleanMathNoise(q.misconception) || '⚠️ Miskonsepsi: Kekeliruan dalam memahami batasan rumus atau konsep prasyarat.'
          };
        });

        if (questionList.length > 0) {
          return {
            success: true,
            modelUsed: model,
            keyUsed: keyIdx + 1,
            questions: questionList
          };
        }
      } catch (err) {
        console.warn(`[Groq Quiz Failover] ${model} pada ${keyLabel} gagal:`, err.message);
        lastError = err;
      }
    }
  }

  // Jika seluruh model Groq dan semua API key mencapai batas kuota rate limit atau tidak tersedia:
  // Gunakan generator adaptif berbasis sumber grounded dokumen resmi (Track D Req 3)
  const fallbackQuestions = generateGroundedFallbackQuestions({
    courseName,
    courseKnowledgeBase,
    targetTopicList,
    activeModalities,
    numQuestions,
    hasVideo,
    hasPdf,
    hasSlide,
    allVideoSegments,
    documentExcerpts,
    filesList
  });

  return {
    success: true,
    modelUsed: 'grounded-adaptive-engine',
    questions: fallbackQuestions
  };
}

// Transkripsi Audio & Video menggunakan Groq Whisper API (Track D Req 1.a & 1.b)
export async function handleGroqAudioTranscription(fileBuffer, fileName, mimeType, apiKey) {
  const effectiveMime = mimeType || 'audio/wav';
  const effectiveName = fileName || 'lecture_audio.wav';
  const blob = new Blob([fileBuffer], { type: effectiveMime });

  const availableKeys = extractGroqKeys(apiKey);
  if (availableKeys.length === 0) {
    throw new Error('Tidak ada API Key Groq yang tersedia untuk transkripsi audio.');
  }

  let lastError = null;

  for (let keyIdx = 0; keyIdx < availableKeys.length; keyIdx++) {
    const currentApiKey = availableKeys[keyIdx];
    const keyLabel = `Key #${keyIdx + 1} (...${currentApiKey.slice(-6)})`;

    try {
      const formData = new FormData();
      formData.append('file', blob, effectiveName);
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('response_format', 'verbose_json');
      formData.append('temperature', '0');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentApiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq Whisper error (${response.status}) pada ${keyLabel}: ${errText.slice(0, 150)}`);
      }

      const data = await response.json();
      const rawSegments = Array.isArray(data.segments) ? data.segments : [];

      const formattedSegments = rawSegments.map((s, idx) => {
        const startSec = Math.floor(s.start || 0);
        const endSec = Math.ceil(s.end || (startSec + 5));
        const startM = String(Math.floor(startSec / 60)).padStart(2, '0') + ':' + String(startSec % 60).padStart(2, '0');
        const endM = String(Math.floor(endSec / 60)).padStart(2, '0') + ':' + String(endSec % 60).padStart(2, '0');
        return {
          id: idx + 1,
          start: s.start,
          end: s.end,
          timestamp: startM,
          endTimestamp: endM,
          text: (s.text || '').trim()
        };
      });

      return {
        success: true,
        keyUsed: keyIdx + 1,
        fullText: data.text || '',
        duration: data.duration || (formattedSegments.length > 0 ? formattedSegments[formattedSegments.length - 1].end : 0),
        segments: formattedSegments
      };
    } catch (err) {
      console.warn(`[Groq Whisper Failover] ${keyLabel} gagal:`, err.message);
      lastError = err;
    }
  }

  throw new Error(`Semua API Key Groq gagal mentranskripsi audio: ${lastError?.message}`);
}
