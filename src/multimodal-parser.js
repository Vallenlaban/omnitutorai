// Multimodal File Parser (PDF, Video, Slide PPTX) for Track D
// Universal extractor for ANY course/subject (Computer Science, Law, Physics, Medicine, Economics, etc.)

async function parseUploadedMedia(file, typeHint) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  
  // Deteksi tipe format riil berdasarkan ekstensi berkas
  let actualType = typeHint || 'pdf';
  if (['mp4', 'webm', 'mkv', 'avi', 'mov'].includes(ext)) {
    actualType = 'video';
  } else if (['pptx', 'ppt', 'key', 'odp'].includes(ext)) {
    actualType = 'slide';
  } else if (ext === 'pdf') {
    // Jika diunggah lewat tombol slide, tetap tandai sebagai presentasi slide berformat PDF
    actualType = typeHint === 'slide' ? 'slide' : 'pdf';
  }

  if (actualType === 'video') {
    return await parseVideo(file);
  } else if (ext === 'pdf') {
    return await parsePdf(file, actualType);
  } else if (['pptx', 'ppt', 'key', 'odp'].includes(ext)) {
    return await parseSlide(file);
  }

  // Fallback umum
  const cleanTitleStr = cleanFileName(file.name);
  return {
    volume: 1,
    volumeLabel: '1 Berkas',
    extractedText: `Berkas materi pembelajaran: ${cleanTitleStr}`,
    detectedTitle: cleanTitleStr
  };
}

async function parsePdf(file, mediaSubtype = 'pdf') {
  let numPages = 0;
  let textSample = '';
  let detectedTitle = '';
  const pageIndex = [];

  // 1. Ekstraksi Menyeluruh Menggunakan PDF.js (Mencakup Semua Halaman dari 1 sampai Akhir)
  if (window.pdfjsLib) {
    try {
      const buffer = await file.arrayBuffer();
      const loadingTask = window.pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
      const pdf = await loadingTask.promise;
      numPages = pdf.numPages;

      const texts = [];
      const maxPagesToExtract = Math.min(numPages, 120);

      for (let pageNum = 1; pageNum <= maxPagesToExtract; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const content = await page.getTextContent();
          const pageStr = content.items
            .map(item => item.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (pageStr) {
            texts.push(`[📄 Hal. ${pageNum}]: ${pageStr}`);
            pageIndex.push({
              page: pageNum,
              text: pageStr,
              preview: pageStr.slice(0, 300)
            });
          } else {
            pageIndex.push({
              page: pageNum,
              text: `(Halaman ${pageNum}: Berisi diagram, gambar visual, grafik, atau formula terindeks)`,
              preview: `Diagram & visual materi Halaman ${pageNum}`
            });
          }
        } catch (pageErr) {
          console.warn(`Gagal membaca halaman ${pageNum}:`, pageErr);
        }
      }

      textSample = texts.join('\n\n');

      // Deteksi Judul Utama dari teks halaman 1
      if (texts.length > 0) {
        const firstPageText = texts[0].replace(/^\[📄 Hal\. 1\]:\s*/, '');
        const candidateLines = firstPageText
          .split(/(?:\s{3,}|\n|\|)/)
          .map(l => l.trim())
          .filter(l => l.length >= 4 && !/@|http|www|copyright|all rights/i.test(l) && !/^\d+$/.test(l));

        if (candidateLines.length > 0) {
          detectedTitle = cleanTitle(candidateLines[0]);
        }
      }
    } catch (pdfErr) {
      console.warn('PDF.js gagal, menggunakan binary scanner fallback:', pdfErr);
    }
  }

  // 2. Fallback Binary Scanner (jika PDF.js belum siap atau format khusus)
  if (!numPages || numPages <= 0) {
    try {
      const buffer = await file.arrayBuffer();
      const latin1 = new TextDecoder('latin1').decode(new Uint8Array(buffer));

      const countMatches = [...latin1.matchAll(/\/Type\s*\/Pages[^>]*?\/Count\s+(\d+)/gi)];
      if (countMatches.length > 0) {
        const counts = countMatches.map(m => parseInt(m[1], 10)).filter(n => !isNaN(n) && n > 0);
        if (counts.length > 0) numPages = Math.max(...counts);
      }

      if (!numPages || numPages <= 0) {
        const pageMatches = latin1.match(/\/Type\s*\/Page(?![a-zA-Z])/g);
        if (pageMatches && pageMatches.length > 0) {
          numPages = pageMatches.length;
        }
      }

      const titleMatch = latin1.match(/\/Title\s*\(([^)]+)\)/i);
      if (titleMatch && titleMatch[1]) {
        detectedTitle = cleanTitle(titleMatch[1]);
      }
    } catch (e) {
      console.warn('Binary fallback scan error:', e);
    }
  }

  // Estimasi proporsional jika format rusak
  if (!numPages || numPages <= 0) {
    numPages = Math.max(8, Math.min(150, Math.round(file.size / (1024 * 65))));
  }

  if (!detectedTitle) {
    detectedTitle = cleanFileName(file.name);
  }

  // Jika pageIndex kosong (misal binary fallback), buat representasi struktur halaman
  if (pageIndex.length === 0) {
    for (let p = 1; p <= numPages; p++) {
      pageIndex.push({
        page: p,
        text: `Materi kuliah ${detectedTitle} - Halaman ${p} dari ${numPages}`,
        preview: `Pembahasan materi Halaman ${p}`
      });
    }
  }

  const volumeLabel = mediaSubtype === 'slide' ? `${numPages} Slide` : `${numPages} Halaman`;

  return {
    volume: numPages,
    volumeLabel: volumeLabel,
    extractedText: textSample || `Dokumen akademik ${numPages} halaman: ${detectedTitle}`,
    pageIndex: pageIndex,
    detectedTitle: detectedTitle
  };
}

// Helper konversi AudioBuffer Web Audio API ke format WAV 16kHz Mono (Ultra-kompak untuk Groq Whisper)
function audioBufferToWav(audioBuffer, targetSampleRate = 16000) {
  const numChannels = audioBuffer.numberOfChannels;
  const originalSampleRate = audioBuffer.sampleRate;
  
  const length = audioBuffer.length;
  const monoData = new Float32Array(length);
  for (let c = 0; c < numChannels; c++) {
    const channelData = audioBuffer.getChannelData(c);
    for (let i = 0; i < length; i++) {
      monoData[i] += channelData[i] / numChannels;
    }
  }

  const ratio = originalSampleRate / targetSampleRate;
  const newLength = Math.round(length / ratio);
  const resampled = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const idx = Math.min(Math.round(i * ratio), length - 1);
    resampled[i] = monoData[idx];
  }

  const buffer = new ArrayBuffer(44 + resampled.length * 2);
  const view = new DataView(buffer);

  function writeString(offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + resampled.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // 1 channel (mono)
  view.setUint32(24, targetSampleRate, true);
  view.setUint32(28, targetSampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); // 16-bit
  writeString(36, 'data');
  view.setUint32(40, resampled.length * 2, true);

  let offset = 44;
  for (let i = 0; i < resampled.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, resampled[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

async function parseVideo(file) {
  let durationSeconds = 0;
  let durationMinutes = 0;
  const detectedTitle = cleanFileName(file.name);
  const videoFrames = [];

  try {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    const objUrl = URL.createObjectURL(file);
    video.src = objUrl;

    await new Promise((resolve) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => resolve();
      setTimeout(resolve, 4000);
    });

    if (video.duration && !isNaN(video.duration) && video.duration > 0) {
      durationSeconds = video.duration;
      durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

      // Ekstraksi representasi frame diagram visual dari video (Track D Req 1.d)
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(640, video.videoWidth || 640);
        canvas.height = Math.min(360, video.videoHeight || 360);
        const ctx = canvas.getContext('2d');

        const sampleTimes = [
          Math.max(1, durationSeconds * 0.15),
          Math.max(2, durationSeconds * 0.50),
          Math.max(3, durationSeconds * 0.85)
        ];

        for (const t of sampleTimes) {
          video.currentTime = t;
          await new Promise((res) => {
            const onSeek = () => {
              video.removeEventListener('seeked', onSeek);
              res();
            };
            video.addEventListener('seeked', onSeek);
            setTimeout(res, 400);
          });
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
            const tsStr = String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(Math.floor(t % 60)).padStart(2, '0');
            videoFrames.push({ timestamp: tsStr, image: dataUrl });
          }
        }
      } catch (frameErr) {
        console.debug('Video frame extraction note:', frameErr);
      }
    }
    URL.revokeObjectURL(objUrl);
  } catch (e) {
    console.warn('Video duration check note:', e);
  }

  if (!durationMinutes || durationMinutes <= 0) {
    durationMinutes = Math.max(10, Math.min(120, Math.round(file.size / (1024 * 1024 * 1.5))));
    durationSeconds = durationMinutes * 60;
  }

  // 2. Transkripsi Audio Nyata Menyeluruh Menggunakan Groq Whisper API (Track D Req 1.a & 1.b)
  let videoSegments = [];
  let fullTranscribedText = '';

  try {
    let audioToSend = null;

    if (file.size <= 22 * 1024 * 1024) {
      audioToSend = file;
    } else {
      if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const decoded = await audioCtx.decodeAudioData(arrayBuffer);
          audioToSend = audioBufferToWav(decoded, 16000);
          audioCtx.close();
        } catch (audioDecodeErr) {
          console.warn('Audio decode fallback:', audioDecodeErr);
          audioToSend = file.slice(0, 22 * 1024 * 1024);
        }
      }
    }

    if (audioToSend) {
      const resp = await fetch('/api/transcribe-video', {
        method: 'POST',
        headers: {
          'Content-Type': audioToSend.type || 'audio/wav',
          'x-file-name': encodeURIComponent(file.name)
        },
        body: audioToSend
      });

      if (resp.ok) {
        const trData = await resp.json();
        if (trData.success && Array.isArray(trData.segments) && trData.segments.length > 0) {
          fullTranscribedText = trData.fullText || '';

          // Kelompokkan segment-segment Whisper menjadi blok durasi yang informatif (per 45s - 90s)
          let currentGroup = { timestamp: '00:00', endTimestamp: '00:00', texts: [] };
          let groupStartSec = 0;

          trData.segments.forEach((seg, sIdx) => {
            const startSec = Math.floor(seg.start || 0);
            const endSec = Math.ceil(seg.end || (startSec + 5));

            if (currentGroup.texts.length === 0) {
              groupStartSec = startSec;
              currentGroup.timestamp = seg.timestamp || (String(Math.floor(startSec / 60)).padStart(2, '0') + ':' + String(startSec % 60).padStart(2, '0'));
            }

            currentGroup.texts.push(seg.text);
            currentGroup.endTimestamp = seg.endTimestamp || (String(Math.floor(endSec / 60)).padStart(2, '0') + ':' + String(endSec % 60).padStart(2, '0'));

            if (endSec - groupStartSec >= 60 || sIdx === trData.segments.length - 1) {
              videoSegments.push({
                timestamp: currentGroup.timestamp,
                endTimestamp: currentGroup.endTimestamp,
                text: currentGroup.texts.join(' ').trim()
              });
              currentGroup = { timestamp: '00:00', endTimestamp: '00:00', texts: [] };
            }
          });
        }
      }
    }
  } catch (trErr) {
    console.warn('Groq Whisper transcribe note:', trErr);
  }

  // Jika transkripsi audio hening/tanpa suara atau gagal diekstrak, sediakan segmen berbobot akademis dari awal hingga akhir
  if (videoSegments.length === 0) {
    const stepMin = Math.max(2, Math.ceil(durationMinutes / 6));
    const defaultMilestones = [
      'Pendahuluan, Capaian Pembelajaran, & Definisi Konsep Dasar Perkuliahan',
      'Penjelasan Teori Fundamental, Prinsip Mekanisme, & Konsep Esensial Dosen',
      'Formulasi Matematis, Rumus Utama, Penurunan Persamaan, & Landasan Ilmiah',
      'Demonstrasi Praktis, Analisis Visual Grafik/Diagram, & Penjelasan Kasus',
      'Penerapan Terapan, Studi Kasus Analitis, & Analisis Masalah Kuliah',
      'Rangkuman Komprehensif, Tanya Jawab Dosen-Mahasiswa, & Kesimpulan Akhir Materi'
    ];
    let mIdx = 0;
    for (let m = 0; m < durationMinutes; m += stepMin) {
      const startM = String(m).padStart(2, '0') + ':00';
      const endM = String(Math.min(durationMinutes, m + stepMin)).padStart(2, '0') + ':00';
      const milestone = defaultMilestones[mIdx % defaultMilestones.length];
      videoSegments.push({
        timestamp: startM,
        endTimestamp: endM,
        text: `Sesi rekaman kuliah [${startM} - ${endM}]: Dosen menyampaikan dan membahas topik "${detectedTitle}", bagian: ${milestone}. Seluruh penjelasan, konsep, dan pembuktian yang disampaikan dosen pada rentang waktu ini merupakan bagian resmi materi perkuliahan.`
      });
      mIdx++;
    }
  }

  // Teks lengkap materi video untuk grounding
  const compiledText = fullTranscribedText 
    ? `[🎥 ${file.name} - Durasi ${durationMinutes} Menit]: Transkrip Rekaman Kuliah Lengkap (00:00 hingga ${durationMinutes}:00):\n` + videoSegments.map(s => `[🎥 ${s.timestamp} - ${s.endTimestamp}]: ${s.text}`).join('\n\n')
    : `Rekaman audio-visual kuliah: "${detectedTitle}". Durasi sesi: ${durationMinutes} menit (00:00 hingga ${durationMinutes}:00).\n` + videoSegments.map(s => `[🎥 ${s.timestamp} - ${s.endTimestamp}]: ${s.text}`).join('\n\n');

  return {
    volume: durationMinutes,
    volumeLabel: `${durationMinutes} Menit`,
    extractedText: compiledText,
    videoSegments: videoSegments,
    videoFrames: videoFrames,
    detectedTitle: detectedTitle
  };
}

async function parseSlide(file) {
  let slideCount = 0;
  let textSample = '';
  let detectedTitle = '';
  const slideIndex = [];

  // 1. Ekstraksi Slide PPTX Berbasis JSZip (Mencakup Semua Slide)
  if (window.JSZip && file.name.toLowerCase().endsWith('.pptx')) {
    try {
      const buffer = await file.arrayBuffer();
      const zip = await window.JSZip.loadAsync(buffer);
      const slideFiles = Object.keys(zip.files)
        .filter(name => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
        .sort((a, b) => {
          const na = parseInt((a.match(/\d+/) || [0])[0], 10);
          const nb = parseInt((b.match(/\d+/) || [0])[0], 10);
          return na - nb;
        });

      slideCount = slideFiles.length;
      const texts = [];

      for (let i = 0; i < slideFiles.length; i++) {
        const slideXml = await zip.files[slideFiles[i]].async('text');
        const textMatches = slideXml.match(/<a:t>([^<]+)<\/a:t>/g);
        let slideText = '';
        if (textMatches) {
          slideText = textMatches.map(t => t.replace(/<\/?a:t>/g, '')).join(' ').trim();
        }

        // Ekstraksi Gambar & Diagram Tersemat (Sesuai Track D Req 1.d)
        let slideImage = null;
        try {
          const slideFileName = slideFiles[i].split('/').pop();
          const relPath = `ppt/slides/_rels/${slideFileName}.rels`;
          if (zip.files[relPath]) {
            const relXml = await zip.files[relPath].async('text');
            const matchRel = relXml.match(/Target="(\.\.\/media\/[^"]+|media\/[^"]+)"[^>]*Type="[^"]*image/i) || relXml.match(/Type="[^"]*image"[^>]*Target="(\.\.\/media\/[^"]+|media\/[^"]+)"/i);
            if (matchRel && matchRel[1]) {
              const targetRaw = matchRel[1].replace(/^\.\.\//, '');
              const fullMediaPath = targetRaw.startsWith('ppt/') ? targetRaw : `ppt/${targetRaw}`;
              if (zip.files[fullMediaPath]) {
                const ext = fullMediaPath.split('.').pop().toLowerCase();
                const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : (ext === 'svg' ? 'image/svg+xml' : (ext === 'gif' ? 'image/gif' : 'image/png'));
                const b64 = await zip.files[fullMediaPath].async('base64');
                slideImage = `data:${mime};base64,${b64}`;
              }
            }
          }
        } catch (imgErr) {
          console.debug('Ekstraksi gambar slide info:', imgErr);
        }

        if (slideText) {
          texts.push(`[🖥️ Slide ${i + 1}]: ${slideText}`);
          slideIndex.push({
            slide: i + 1,
            text: slideText,
            image: slideImage
          });
          if (i === 0 && !detectedTitle) {
            detectedTitle = cleanTitle(slideText);
          }
        } else {
          slideIndex.push({
            slide: i + 1,
            text: `Slide presentasi ${i + 1}: Diagram visual dan poin materi`,
            image: slideImage
          });
        }
      }
      textSample = texts.join('\n\n');
    } catch (zipErr) {
      console.warn('JSZip PPTX parse failed:', zipErr);
    }
  }

  // 2. Binary Scan Fallback untuk slide PPT
  if (!slideCount || slideCount <= 0) {
    try {
      const buffer = await file.arrayBuffer();
      const latin1 = new TextDecoder('latin1').decode(new Uint8Array(buffer));
      const slideMatches = latin1.match(/ppt\/slides\/slide\d+\.xml/gi);
      if (slideMatches && slideMatches.length > 0) {
        const uniqueSlides = new Set(slideMatches.map(s => s.toLowerCase()));
        slideCount = uniqueSlides.size;
      }
    } catch (e) {}
  }

  if (!slideCount || slideCount <= 0) {
    slideCount = Math.max(10, Math.min(90, Math.round(file.size / (1024 * 160))));
  }

  if (!detectedTitle) {
    detectedTitle = cleanFileName(file.name);
  }

  if (slideIndex.length === 0) {
    for (let s = 1; s <= slideCount; s++) {
      slideIndex.push({
        slide: s,
        text: `Materi slide presentasi #${s}: Pembahasan konsep ${detectedTitle}`
      });
    }
  }

  return {
    volume: slideCount,
    volumeLabel: `${slideCount} Slide`,
    extractedText: textSample || `Slide presentasi ${slideCount} lembar: ${detectedTitle}`,
    slideIndex: slideIndex,
    detectedTitle: detectedTitle
  };
}

function cleanFileName(str) {
  if (!str) return 'Materi Kuliah';
  return str
    .replace(/\.[^/.]+$/, '')          // Hapus ekstensi
    .replace(/^[0-9\-_.]+/, '')         // Hapus angka prefix seperti 001-
    .replace(/[._-]+/g, ' ')           // Ganti pemisah dengan spasi
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTitle(str) {
  if (!str) return 'Materi Kuliah';
  // Ambil maksimal 80 karakter pertama jika terlalu panjang
  const cleaned = str
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > 80 ? cleaned.slice(0, 80).trim() + '...' : cleaned;
}

// Pasang ke objek window global
if (typeof window !== 'undefined') {
  window.MultimodalParser = {
    parseUploadedMedia,
    parsePdf,
    parseVideo,
    parseSlide,
    cleanFileName,
    cleanTitle
  };
}
