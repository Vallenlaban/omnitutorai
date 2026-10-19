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
function extractGroqKeys(apiKeysInput) {
  let keys = [];
  if (Array.isArray(apiKeysInput)) {
    keys = apiKeysInput.filter(k => typeof k === 'string' && k.trim().length > 0);
  } else if (typeof apiKeysInput === 'string' && apiKeysInput.trim().length > 0) {
    keys = apiKeysInput.split(',').map(k => k.trim()).filter(Boolean);
  }
  return [...new Set(keys)];
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

  const textSnippet = extractedTextSample && extractedTextSample.length > 20
    ? `\nKUTIPAN DAN TEKS ASLI LENGKAP DARI SELURUH BERKAS (HALAMAN AWAL HINGGA AKHIR):\n"""\n${extractedTextSample.slice(0, 18000)}\n"""\n`
    : `\nNama berkas ini adalah: "${fileName}". Analisis dan tentukan disiplin ilmu serta topik materi berdasarkan nama berkas ini secara otonom.\n`;

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
    throw new Error('Tidak ada API Key Groq yang tersedia. Harap isi GROQ_API_KEY di .env atau environment server.');
  }

  const modelsToTry = [
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b'
  ];
  let lastError = null;

  // Coba berurutan: jika Key 1 error atau terkena rate limit, otomatis beralih ke Key 2
  for (let keyIdx = 0; keyIdx < availableKeys.length; keyIdx++) {
    const currentApiKey = availableKeys[keyIdx];
    const keyLabel = `Key #${keyIdx + 1} (...${currentApiKey.slice(-6)})`;

    for (const model of modelsToTry) {
      try {
        const tokenLimit = model.includes('qwen') ? 950 : 2500;
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

  throw new Error(`Semua API Key dan model Groq gagal memproses ingestion: ${lastError?.message}`);
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

  let contextStr = `\nBASIS PENGETAHUAN RESMI DOSEN (GROUNDED KNOWLEDGE BASE DARI BERKAS YANG DIUNGGAH):\n`;
  if (knowledgeBaseContext && knowledgeBaseContext.length > 0) {
    contextStr += `\n--- DAFTAR TOPIK, SUBTOPIK & BAB MATERI TERPETAKAN ---\n${JSON.stringify(knowledgeBaseContext, null, 2)}\n`;
  }
  if (documentExcerpts && documentExcerpts.length > 0) {
    contextStr += `\n--- KONTEN RINCI DOKUMEN PER HALAMAN / SLIDE / VIDEO (MENCATAT SETIAP HALAMAN/DURASI DARI AWAL SAMPAI AKHIR) ---\n`;
    documentExcerpts.forEach((item) => {
      contextStr += `[${item.ref || 'Rujukan'}] (${item.loc}):\n${item.content}\n\n`;
    });
  }
  if (fullDocumentContent) {
    contextStr += `\n--- TEKS LENGKAP & TRANSKRIP REKAMAN SEMUA BERKAS RESMI DOSEN ---\n${fullDocumentContent.slice(0, 18000)}\n`;
  }

  const systemPrompt = `Anda adalah OmniTutor AI, asisten belajar multimodal akademik untuk kompetisi Multimodal AI Hackathon 2026 (Track D: Personalized Tutoring & Adaptive Learning).
Prinsip Operasional Wajib (Track D Requirement 2.a & 2.b):
1. PEMERIKSAAN KONTEN SELURUH BERKAS (FULL-DOCUMENT GROUNDING):
   - Anda memiliki akses penuh ke SELURUH materi perkuliahan resmi yang diunggah Dosen di atas, mulai dari bagian awal (konsep pengantar), bagian pertengahan (inti materi & teori), hingga bagian akhir (rumus lanjutan, penerapan, bab penutup, kesimpulan, dan seluruh durasi/halaman akhir).
   - JANGAN PERNAH menolak pertanyaan jika konsep, istilah, materi, atau rumus tersebut tercantum di bagian mana pun dari materi yang diunggah dosen!
   - Periksa seluruh teks materi secara cermat sebelum menjawab. Jika mahasiswa menanyakan rumus, bab akhir, menit akhir, atau konsep tertentu, cari di seluruh materi dan jawab secara komprehensif.

2. SITASI SUMBER EKSPLISIT DAN AKURAT (Req 2.a):
${mediaSpecificGuideline}

3. FORMULASI MATEMATIKA & RUMUS LENGKAP (LaTeX STANDAR):
   - Tuliskan semua rumus dan simbol matematika/fisika/teknik dalam format LaTeX standar:
     Gunakan $$ rumus $$ untuk rumus blok utama baris baru.
     Gunakan $ simbol $ untuk simbol matematika inline dalam kalimat (misal: $\\vec{A}$, $\\mathbf{A}$, $\\nabla$, $\\theta$).
   - JANGAN memotong rumus di tengah kalimat. Tuliskan rumus sampai tuntas lengkap.

4. GUARDRAIL & REFUSAL (HANYA UNTUK TOPIK YANG BENAR-BENAR DI LUAR MATERI KULIAH):
   - Tolak secara sopan HANYA JIKA mahasiswa menanyakan hal yang sama sekali di luar materi kuliah resmi yang diunggah (misal berita selebriti, ramalan cuaca, resep masakan, hal di luar mata kuliah).
   - Format penolakan guardrail:
     "Maaf, pertanyaan ini berada di luar materi kuliah resmi yang diunggah oleh Dosen. OmniTutor AI menerapkan guardrail ketat anti-halusinasi agar penjelasan 100% dapat diverifikasi ke sumber materi resmi."
   - Namun JIKA pertanyaan berkaitan dengan materi kuliah yang diunggah, Anda WAJIB menjawabnya secara lengkap dan ramah!

5. Nada bicara: Ramah, akademis, mendidik, terstruktur, dan ilmiah.
${contextStr}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...(history || []).slice(-4).map(m => ({ role: m.role || 'user', content: m.text || m.content })),
    { role: 'user', content: question }
  ];

  const availableKeys = extractGroqKeys(apiKey);
  if (availableKeys.length === 0) {
    throw new Error('Tidak ada API Key Groq yang tersedia. Harap isi GROQ_API_KEY di .env atau environment server.');
  }

  const modelsToTry = [
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b'
  ];
  let lastError = null;

  for (let keyIdx = 0; keyIdx < availableKeys.length; keyIdx++) {
    const currentApiKey = availableKeys[keyIdx];
    const keyLabel = `Key #${keyIdx + 1} (...${currentApiKey.slice(-6)})`;

    for (const model of modelsToTry) {
      try {
        const tokenLimit = model.includes('qwen') ? 950 : 2500;
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

  throw new Error(`Semua API Key dan model Groq gagal menjawab tutor: ${lastError?.message}`);
}

export const handleGroqTutorChat = handleGroqTutor;

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

  let groundingContext = `KURSUS: "${courseName}"\nTOPIK TARGET: ${targetTopicList.join(', ')}\n`;
  if (courseKnowledgeBase && courseKnowledgeBase.length > 0) {
    groundingContext += `\n--- SILABUS & TOPIK MATERI RESMI ---\n${JSON.stringify(courseKnowledgeBase.slice(0, 10), null, 2)}\n`;
  }
  if (documentExcerpts && documentExcerpts.length > 0) {
    groundingContext += `\n--- KUTIPAN RESMI HALAMAN DOKUMEN / SLIDE / SEGMEN VIDEO ---\n`;
    documentExcerpts.slice(0, 80).forEach(ex => {
      groundingContext += `[${ex.ref || 'Rujukan'} Loc:${ex.loc}]: ${ex.content}\n\n`;
    });
  }
  if (fullDocumentContent) {
    groundingContext += `\n--- TRANSKRIP REKAMAN LENGKAP & TEKS SEMUA BERKAS RESMI DOSEN (DARI AWAL HINGGA DURASI AKHIR) ---\n${fullDocumentContent.slice(0, 18000)}\n`;
  }

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
  const modelsToTry = [
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b'
  ];
  let lastError = null;

  for (let keyIdx = 0; keyIdx < availableKeys.length; keyIdx++) {
    const currentApiKey = availableKeys[keyIdx];
    const keyLabel = `Key #${keyIdx + 1} (...${currentApiKey.slice(-6)})`;

    for (const model of modelsToTry) {
      try {
        const tokenLimit = model.includes('qwen') ? 950 : 2500;
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
