// =========================================================================
// OMNITUTOR MULTILINGUAL ENGINE (i18n) - TRACK D ULTIMATE LOCALIZATION
// Cycle order: United States 🇺🇸 (English) -> India 🇮🇳 (Hindi) -> Indonesia 🇮🇩 (Indonesian)
// Seamless 100% translation across Learn, AI Tutor, Practice, Progress, Lecturer Mode, and Modals
// =========================================================================

(function (window) {
  const LANGUAGES = ['en', 'hi', 'id'];

  // Default starting language is 'en' (as specified by user: starts with US flag)
  let currentLang = 'en';
  try {
    const saved = localStorage.getItem('omnitutor_lang');
    if (saved && LANGUAGES.includes(saved)) {
      currentLang = saved;
    }
  } catch (e) {}

  const LANG_CONFIG = {
    en: {
      code: 'en',
      badge: 'USA',
      name: 'English (US)',
      sub: 'United States',
      flag: '🇺🇸',
      speechLang: 'en-US',
      direction: 'ltr'
    },
    hi: {
      code: 'hi',
      badge: 'IND',
      name: 'हिन्दी (India)',
      sub: 'India',
      flag: '🇮🇳',
      speechLang: 'hi-IN',
      direction: 'ltr'
    },
    id: {
      code: 'id',
      badge: 'IDN',
      name: 'Indonesia',
      sub: 'Indonesia',
      flag: '🇮🇩',
      speechLang: 'id-ID',
      direction: 'ltr'
    }
  };

  // =========================================================================
  // MASTER COMPREHENSIVE PHRASE DICTIONARY
  // =========================================================================
  const DICTIONARY = {
    // Navigation & Core
    'OmniTutor': { en: 'OmniTutor', hi: 'ओम्नीट्यूटर' },
    'Teman Belajar AI Cerdas': { en: 'AI Study Companion', hi: 'एआई अध्ययन साथी' },
    'app_subtitle': { id: 'Teman Belajar AI Cerdas', en: 'AI Study Companion', hi: 'एआई अध्ययन साथी' },
    'Belajar': { en: 'Learn', hi: 'सीखें' },
    'AI Tutor': { en: 'AI Tutor', hi: 'एआई ट्यूटर' },
    'Latihan': { en: 'Practice', hi: 'अभ्यास' },
    'Progress': { en: 'Progress', hi: 'प्रगति' },
    'Ingestion Hub': { en: 'Ingestion Hub', hi: 'अंतर्ग्रहण हब' },
    'Mode Dosen': { id: 'Mode Dosen', en: 'Lecturer Mode', hi: 'शिक्षक मोड' },
    'Mode Mahasiswa': { id: 'Mode Mahasiswa', en: 'Student Mode', hi: 'छात्र मोड' },
    'btn_student_mode': { id: 'Mode Mahasiswa', en: 'Student Mode', hi: 'छात्र मोड' },
    'btn_lecturer_mode': { id: 'Mode Dosen', en: 'Lecturer Mode', hi: 'शिक्षक मोड' },
    'nav_learn': { id: 'Belajar', en: 'Learn', hi: 'सीखें' },
    'nav_aitutor': { id: 'AI Tutor', en: 'AI Tutor', hi: 'एआई ट्यूटर' },
    'nav_practice': { id: 'Latihan', en: 'Practice', hi: 'अभ्यास' },
    'nav_progress': { id: 'Progress', en: 'Progress', hi: 'प्रगति' },
    'nav_ingestion': { id: 'Ingestion Hub', en: 'Ingestion Hub', hi: 'अंतर्ग्रहण हब' },
    'Kembali ke Belajar': { en: 'Back to Learn', hi: 'सीखने पर वापस जाएं' },
    'Kembali ke Belajar (Learn)': { en: 'Back to Learn', hi: 'सीखने पर वापस जाएं' },

    // Stats
    'Mata Kuliah Seru': { en: 'Active Course', hi: 'सक्रिय पाठ्यक्रम' },
    'Biologi 101': { en: 'Biology 101', hi: 'जीव विज्ञान 101' },
    '7 Hari Berturut-turut!': { en: '7-Day Streak Active!', hi: '7-दिवसीय लकीर सक्रिय!' },
    '7 Hari': { en: '7 Days', hi: '7 दिन' },
    '0 Hari': { en: '0 Days', hi: '0 दिन' },
    'Koleksi Bintang Emas': { en: 'Gold Stars Collection', hi: 'स्वर्ण सितारे संग्रह' },
    'Koleksi Bintang': { en: 'Stars Collection', hi: 'सितारे संग्रह' },
    'Energi Semangat': { en: 'Energy Spirit', hi: 'ऊर्जा शक्ति' },
    'Semangat Belajar': { en: 'Study Spirit', hi: 'अध्ययन उत्साह' },
    '5 Penuh': { en: '5 Full', hi: '5 पूर्ण' },
    'Belum Ada Materi': { en: 'No Materials Yet', hi: 'कोई सामग्री नहीं' },

    // Learn Recommendations & Cards
    'Rekomendasi Adaptif Hari Ini': { en: 'Today\'s Adaptive Recommendation', hi: 'आज की अनुकूली सिफारिश' },
    'Respirasi Sel: 42% (Perlu Penguatan)': { en: 'Cellular Respiration: 42% (Needs Reinforcement)', hi: 'कोशिकीय श्वसन: 42% (सुदृढ़ीकरण आवश्यक)' },
    'Perkuat Respirasi Sel Sebelum Masuk ke Fotosintesis!': { en: 'Strengthen Cellular Respiration Before Entering Photosynthesis!', hi: 'प्रकाश संश्लेषण में जाने से पहले कोशिकीय श्वसन को मजबूत करें!' },
    'Sistem mendeteksi pemahamanmu di topik ini 42%. Luangkan 8 menit untuk review Video Kuliah Dosen (Menit 14:20) dan Buku Campbell Hal. 45 sebelum membuka materi Fotosintesis.': {
      en: 'System detected your topic mastery is at 42%. Spend 8 minutes reviewing Lecturer Video (Minute 14:20) and Campbell Book Page 45 before opening Photosynthesis.',
      hi: 'सिस्टम ने पाया कि इस विषय में आपकी महारत 42% है। प्रकाश संश्लेषण सामग्री खोलने से पहले व्याख्याता वीडियो (मिनट 14:20) और कैम्पबेल पुस्तक पृष्ठ 45 की समीक्षा के लिए 8 मिनट का समय लें।'
    },
    'Mulai Review Kilat (8 Min)': { en: 'Start Quick Review (8 Min)', hi: 'त्वरित समीक्षा शुरू करें (8 मिनट)' },
    'Klip Dosen (14:20)': { en: 'Lecture Clip (14:20)', hi: 'व्याख्याता क्लिप (14:20)' },
    'Buku Hal. 45': { en: 'Book Page 45', hi: 'पुस्तक पृष्ठ 45' },
    'Tanya AI Tutor': { en: 'Ask AI Tutor', hi: 'एआई ट्यूटर से पूछें' },

    // Learn Units
    'Unit 1 · Selesai': { en: 'Unit 1 · Completed', hi: 'इकाई 1 · पूर्ण' },
    'Unit 1 · Selesai ⭐': { en: 'Unit 1 · Completed ⭐', hi: 'इकाई 1 · पूर्ण ⭐' },
    'Dasar Seluler': { en: 'Cellular Fundamentals', hi: 'कोशिकीय आधार' },
    'Struktur organel & membran sel (Telah dikuasai dengan sangat baik!)': { en: 'Organelle & cell membrane structure (Mastered exceptionally well!)', hi: 'अंगक और कोशिका झिल्ली संरचना (बहुत अच्छी तरह से महारत हासिल!)' },
    'Rangkuman': { en: 'Summary', hi: 'सारांश' },
    '91% Mastery · Mahir ⭐': { en: '91% Mastery · Mastered ⭐', hi: '91% महारत · माहिर ⭐' },
    '81% Mastery · Mahir ⭐': { en: '81% Mastery · Mastered ⭐', hi: '81% महारत · माहिर ⭐' },
    '42% Mastery · Butuh Remedial ⚠️': { en: '42% Mastery · Needs Remedial ⚠️', hi: '42% महारत · सुधार आवश्यक ⚠️' },
    'Mahir ⭐': { en: 'Mastered ⭐', hi: 'माहिर ⭐' },
    'Review ✨': { en: 'Review ✨', hi: 'समीक्षा ✨' },
    'Unit 2 · Sedang Dipelajari ⚡': { en: 'Unit 2 · In Progress ⚡', hi: 'इकाई 2 · प्रगति पर ⚡' },
    'Unit 2 · Sedang Dipelajari': { en: 'Unit 2 · In Progress', hi: 'इकाई 2 · प्रगति पर' },
    'Transformasi Energi Sel': { en: 'Cellular Energy Transformation', hi: 'कोशिका ऊर्जा रूपांतरण' },
    'Respirasi Seluler & Fotosintesis (Kuasai prasyarat untuk membuka level)': { en: 'Cellular Respiration & Photosynthesis (Master prerequisites to unlock level)', hi: 'कोशिकीय श्वसन और प्रकाश संश्लेषण (स्तर अनलॉक करने के लिए आवश्यक शर्तें पूरी करें)' },
    'Respirasi Sel (Cellular Respiration)': { en: 'Cellular Respiration', hi: 'कोशिकीय श्वसन' },
    'Target Buka Lanjutan: ≥ 70%': { en: 'Target to Unlock Next: ≥ 70%', hi: 'अगला खोलने का लक्ष्य: ≥ 70%' },
    'Remedial (8 Min) ⚡': { en: 'Remedial (8 Min) ⚡', hi: 'सुधार (8 मिनट) ⚡' },
    'Remedial (8 Min)': { en: 'Remedial (8 Min)', hi: 'सुधार (8 मिनट)' },
    'Fotosintesis (Photosynthesis)': { en: 'Photosynthesis', hi: 'प्रकाश संश्लेषण' },
    'Terkunci 🔒 (Prasyarat)': { en: 'Locked 🔒 (Prerequisite)', hi: 'लॉक किया गया 🔒 (पूर्वापेक्षा)' },
    'Prasyarat: Kuatkan Respirasi Sel hingga ≥ 70% untuk membuka materi': { en: 'Prerequisite: Strengthen Cellular Respiration to ≥ 70% to unlock material', hi: 'पूर्वापेक्षा: सामग्री अनलॉक करने के लिए कोशिकीय श्वसन को ≥ 70% तक मजबूत करें' },
    'Lihat Syarat 🔒': { en: 'View Requirements 🔒', hi: 'शर्तें देखें 🔒' },
    'Lihat Syarat': { en: 'View Requirements', hi: 'शर्तें देखें' },
    'Ujian Komprehensif Bab 2': { en: 'Chapter 2 Comprehensive Exam', hi: 'अध्याय 2 व्यापक परीक्षा' },
    'Terkunci 🔒': { en: 'Locked 🔒', hi: 'लॉक किया गया 🔒' },
    'Syarat: Selesaikan materi Respirasi Sel dan Fotosintesis': { en: 'Requirement: Complete Cellular Respiration and Photosynthesis', hi: 'शर्त: कोशिकीय श्वसन और प्रकाश संश्लेषण पूरा करें' },
    'Detail Ujian': { en: 'Exam Details', hi: 'परीक्षा विवरण' },

    // Right Rail
    'Halo Rekan Mahasiswa! Kuatkan dulu Respirasi Sel (42%), lalu gerbang Fotosintesis akan otomatis terbuka lebar! 🚀': {
      en: 'Hello Fellow Learner! Strengthen Cellular Respiration (42%) first, and the gate to Photosynthesis will automatically open wide! 🚀',
      hi: 'नमस्ते साथी छात्र! पहले कोशिकीय श्वसन (42%) को मजबूत करें, फिर प्रकाश संश्लेषण का द्वार स्वतः खुल जाएगा! 🚀'
    },
    'Misi Bintang Hari Ini ⭐': { en: 'Today\'s Star Quests ⭐', hi: 'आज के स्टार मिशन ⭐' },
    'Misi Bintang Hari Ini': { en: 'Today\'s Star Quests', hi: 'आज के स्टार मिशन' },
    'Review Respirasi Sel (8 Min)': { en: 'Review Cellular Respiration (8 Min)', hi: 'कोशिकीय श्वसन समीक्षा (8 मिनट)' },
    '3 Soal Siklus Krebs': { en: '3 Questions on Krebs Cycle', hi: 'क्रेब्स चक्र पर 3 प्रश्न' },
    'Pertahankan 7 Hari Streak': { en: 'Maintain 7-Day Streak', hi: '7-दिवसीय लकीर बनाए रखें' },
    'Status Penguasaan (BKT) 🧠': { en: 'Mastery Status (BKT) 🧠', hi: 'महारत स्थिति (बीकेटी) 🧠' },
    'REMEDIAL TARGET 🎈': { en: 'REMEDIAL TARGET 🎈', hi: 'उपचारात्मक लक्ष्य 🎈' },
    'REMEDIAL TARGET': { en: 'REMEDIAL TARGET', hi: 'उपचारात्मक लक्ष्य' },
    'Respirasi Sel (42% Paham)': { en: 'Cellular Respiration (42% Understood)', hi: 'कोशिकीय श्वसन (42% समझ)' },
    'Kuis kilat 3 soal untuk memperkuat Siklus Krebs dan mencapai target 70%!': {
      en: 'Quick 3-question quiz to strengthen Krebs Cycle and reach 70% target!',
      hi: 'क्रेब्स चक्र को मजबूत करने और 70% लक्ष्य तक पहुंचने के लिए त्वरित 3-प्रश्न प्रश्नोत्तरी!'
    },
    'Mulai Remedial Kilat →': { en: 'Start Quick Remedial →', hi: 'त्वरित उपचारात्मक शुरू करें →' },
    'Mulai Remedial Kilat': { en: 'Start Quick Remedial', hi: 'त्वरित उपचारात्मक शुरू करें' },

    // Learn Empty State
    'STANDBY: MENUNGGU MATERI DOSEN': { en: 'STANDBY: WAITING FOR LECTURER MATERIALS', hi: 'प्रतीक्षारत: व्याख्यान सामग्री की प्रतीक्षा' },
    'Belum Ada Materi Pembelajaran yang Diunggah': { en: 'No Learning Materials Uploaded Yet', hi: 'अभी तक कोई शिक्षण सामग्री अपलोड नहीं की गई' },
    'Halaman Belajar terhubung langsung dengan materi kuliah resmi dosen (rekaman video kuliah, modul buku teks PDF, dan slide presentasi). Silakan masuk ke Mode Dosen untuk mengunggah materi perkuliahan pertama Anda agar jalur belajar adaptif, rekomendasi review, dan asesmen kuis otomatis terbentuk!': {
      en: 'The Learn space connects directly to official lecturer course materials (lecture video recordings, PDF textbook modules, and presentation slides). Switch to Lecturer Mode to upload your first course files and automatically generate adaptive learning paths, review recommendations, and quiz assessments!',
      hi: 'सीखें अनुभाग सीधे आधिकारिक शिक्षक पाठ्यक्रम सामग्री (व्याख्यान वीडियो रिकॉर्डिंग, पीडीएफ पाठ्यपुस्तक मॉड्यूल और प्रस्तुति स्लाइड) से जुड़ता है। अपनी पहली पाठ्यक्रम फाइलें अपलोड करने और स्वचालित रूप से अनुकूली सीखने के मार्ग, समीक्षा सिफारिशें और प्रश्नोत्तरी उत्पन्न करने के लिए शिक्षक मोड पर स्विच करें!'
    },
    'Buka Mode Dosen (Unggah Materi)': { en: 'Open Lecturer Mode (Upload Materials)', hi: 'शिक्षक मोड खोलें (सामग्री अपलोड करें)' },
    'Langkah Mudah Memulai 🚀': { en: 'Easy Steps to Start 🚀', hi: 'शुरू करने के आसान कदम 🚀' },
    'Bagaimana Cara Kerjanya?': { en: 'How Does It Work?', hi: 'यह कैसे काम करता है?' },
    '1. Buka Mode Dosen ➔ 2. Unggah Video, Buku PDF, atau Slide ➔ 3. OmniTutor otomatis menyusun kurikulum & rekomendasi adaptif!': {
      en: '1. Open Lecturer Mode ➔ 2. Upload Video, PDF Book, or Slides ➔ 3. OmniTutor automatically builds curriculum & adaptive recommendations!',
      hi: '1. शिक्षक मोड खोलें ➔ 2. वीडियो, पीडीएफ पुस्तक या स्लाइड अपलोड करें ➔ 3. ओम्नीट्यूटर स्वचालित रूप से पाठ्यक्रम और अनुकूली सिफारिशें बनाता है!'
    },
    'Misi Memulai Belajar ⭐': { en: 'Getting Started Quests ⭐', hi: 'शुरुआती अध्ययन मिशन ⭐' },
    'Unggah Materi di Mode Dosen': { en: 'Upload Materials in Lecturer Mode', hi: 'शिक्षक मोड में सामग्री अपलोड करें' },
    'Jelajahi Teman Belajar AI': { en: 'Explore AI Study Companion', hi: 'एआई अध्ययन साथी का अन्वेषण करें' },
    'Bangun Kebiasaan Belajar': { en: 'Build Daily Study Habit', hi: 'दैनिक अध्ययन की आदत बनाएं' },
    'Model kognitif Bayesian Knowledge Tracing (BKT) akan aktif memetakan tingkat kepahaman Anda setelah materi diunggah dan kuis dikerjakan.': {
      en: 'Bayesian Knowledge Tracing (BKT) cognitive model will actively map your understanding once course materials are uploaded and quizzes are completed.',
      hi: 'सामग्री अपलोड होने और क्विज़ हल करने के बाद बायेसियन नॉलेज ट्रेसिंग (BKT) संज्ञानात्मक मॉडल सक्रिय रूप से आपकी समझ को मैप करेगा।'
    },
    'Standby: Menunggu Materi': { en: 'Standby: Waiting for Materials', hi: 'प्रतीक्षारत: सामग्री की प्रतीक्षा' },
    'Rekomendasi remedial terarah akan otomatis muncul saat topik lemah terdeteksi.': {
      en: 'Targeted remedial recommendations will automatically appear once weak topics are detected.',
      hi: 'कमजोर विषयों का पता चलने पर लक्षित उपचारात्मक सिफारिशें स्वचालित रूप से दिखाई देंगी।'
    },
    'Unggah Materi Sekarang →': { en: 'Upload Materials Now →', hi: 'अभी सामग्री अपलोड करें →' },

    // AI Tutor View
    'OmniTutor AI Companion': { en: 'OmniTutor AI Companion', hi: 'ओम्नीट्यूटर एआई साथी' },
    'Standby: Terhubung dengan Berkas Resmi Mode Dosen': { en: 'Standby: Connected to Official Lecturer Files', hi: 'स्टैंडबाय: आधिकारिक व्याख्याता फाइलों से जुड़ा हुआ' },
    'Active Course: Fully Source-Grounded Knowledge Base': { en: 'Active Course: Fully Source-Grounded Knowledge Base', hi: 'सक्रिय पाठ्यक्रम: पूर्णतः स्रोत-आधारित ज्ञानकोष' },
    'Guardrail Aktif: Tolak Halusinasi': { en: 'Active Guardrail: Reject Hallucinations', hi: 'सक्रिय गार्डरेल: मतिभ्रम अस्वीकृति' },
    'Ketik pertanyaan Anda tentang materi kuliah...': { en: 'Type your question about course materials...', hi: 'पाठ्यक्रम सामग्री के बारे में अपना प्रश्न टाइप करें...' },
    'Kirim 🚀': { en: 'Send 🚀', hi: 'भेजें 🚀' },
    'Kirim': { en: 'Send', hi: 'भेजें' },
    'Bukti Sumber Terverifikasi': { en: 'Verified Source Evidence', hi: 'सत्यापित स्रोत साक्ष्य' },
    'Slide Kuliah': { en: 'Lecture Slides', hi: 'व्याख्यान स्लाइड' },
    'Dokumen PDF': { en: 'PDF Document', hi: 'पीडीएफ दस्तावेज' },
    'Video Kuliah': { en: 'Lecture Video', hi: 'व्याख्यान वीडियो' },
    'Belum Ada Dokumen PDF Diunggah': { en: 'No PDF Document Uploaded Yet', hi: 'अभी तक कोई पीडीएफ दस्तावेज अपलोड नहीं किया गया' },
    'Unggah berkas PDF materi kuliah di Mode Dosen untuk melihat pratinjau halaman buku dan dokumen di sini.': {
      en: 'Upload course PDF textbook or syllabus in Lecturer Mode to preview book pages and citations here.',
      hi: 'पुस्तक पृष्ठों और उद्धरणों का पूर्वावलोकन करने के लिए व्याख्याता मोड में पाठ्यक्रम पीडीएफ अपलोड करें।'
    },
    'Dokumen Kuliah': { en: 'Lecture Document', hi: 'व्याख्यान दस्तावेज' },
    'Sumber Terverifikasi Track D': { en: 'Track D Verified Source', hi: 'ट्रैक डी सत्यापित स्रोत' },
    'Memuat konten halaman dokumen...': { en: 'Loading document page content...', hi: 'दस्तावेज़ पृष्ठ सामग्री लोड हो रही है...' },
    'Halaman Sebelumnya': { en: 'Previous Page', hi: 'पिछला पृष्ठ' },
    'Halaman Selanjutnya': { en: 'Next Page', hi: 'अगला पृष्ठ' },
    'Standby: Player Video Kuliah': { en: 'Standby: Lecture Video Player', hi: 'स्टैंडबाय: व्याख्यान वीडियो प्लेयर' },
    'Timestamp akan otomatis menyesuaikan dengan kutipan menit materi': {
      en: 'Timestamp will automatically sync to cited video segment',
      hi: 'टाइमस्टैम्प स्वचालित रूप से उद्धृत वीडियो खंड से समन्वयित होगा'
    },
    'Transkrip Audio / Rangkuman Segmen Video:': { en: 'Audio Transcript / Video Summary Segment:', hi: 'ऑडियो प्रतिलेख / वीडियो सारांश खंड:' },
    'Transkrip audio dan rekaman video kuliah dosen akan ditampilkan di sini saat segmen video dirujuk.': {
      en: 'Audio transcripts and lecture video recordings will appear here when a video segment is cited.',
      hi: 'वीडियो खंड उद्धृत होने पर व्याख्याता के ऑडियो प्रतिलेख और वीडियो रिकॉर्डिंग यहां दिखाई देंगे।'
    },

    // Practice View
    'Adaptive Exam & Practice Center': { en: 'Adaptive Exam & Practice Center', hi: 'अनुकूली परीक्षा और अभ्यास केंद्र' },
    'BKT Engine: Active': { en: 'BKT Engine: Active', hi: 'बीकेटी इंजन: सक्रिय' },
    '0 Soal Duplikasi': { en: '0 Duplicate Questions', hi: '0 डुप्लिकेट प्रश्न' },
    'Groq LLaMA-3.3 70B Validated': { en: 'Groq LLaMA-3.3 70B Validated', hi: 'ग्रॉक लामा-3.3 70B सत्यापित' },
    'Generator Ujian Mandiri': { en: 'Self-Directed Exam Generator', hi: 'स्व-निर्देशित परीक्षा जनरेटर' },
    'Kuis Diagnostik (Intake Siswa Baru)': { en: 'Diagnostic Quiz (New Student Intake)', hi: 'नैदानिक प्रश्नोत्तरी (नए छात्र प्रवेश)' },
    'Remedial Sprint (Target Miskonsepsi)': { en: 'Remedial Sprint (Target Misconceptions)', hi: 'उपचारात्मक स्प्रिंट (लक्षित भ्रांतियां)' },
    'Buat Kuis Adaptif Mandiri (Custom Scope)': { en: 'Create Self-Directed Adaptive Quiz (Custom Scope)', hi: 'स्व-निर्देशित अनुकूली प्रश्नोत्तरी बनाएं (कस्टम दायरा)' },
    'Pilih cakupan topik materi, tingkat kesulitan, dan format soal. Algoritma akan men-generate soal terverifikasi sumber tanpa repetisi.': {
      en: 'Select topic scope, difficulty level, and question modalities. The algorithm generates source-verified, non-repetitive items.',
      hi: 'विषय का दायरा, कठिनाई स्तर और प्रश्न प्रारूप चुनें। एल्गोरिदम बिना दोहराव के स्रोत-सत्यापित प्रश्न उत्पन्न करेगा।'
    },
    '1. Pilih Cakupan Topik Materi (Multi-Topic):': { en: '1. Select Topic Scope (Multi-Topic):', hi: '1. विषय दायरा चुनें (बहु-विषय):' },
    'Unggah materi di Mode Dosen untuk memulai kuis.': { en: 'Upload materials in Lecturer Mode to start quiz.', hi: 'प्रश्नोत्तरी शुरू करने के लिए व्याख्याता मोड में सामग्री अपलोड करें।' },
    'Buka Mode Dosen': { en: 'Open Lecturer Mode', hi: 'व्याख्याता मोड खोलें' },
    '2. Format Soal yang Diujikan (Track D Requirement):': { en: '2. Question Formats (Track D Requirement):', hi: '2. परीक्षा प्रश्न प्रारूप (ट्रैक डी आवश्यकता):' },
    'Pilihan Ganda (MCQ)': { en: 'Multiple Choice (MCQ)', hi: 'बहुविकल्पीय (MCQ)' },
    'Soal Numerik (Hitungan ATP)': { en: 'Numerical Problems (ATP Calculations)', hi: 'संख्यात्मक प्रश्न (एटीपी गणना)' },
    'Isian Singkat (Short Answer)': { en: 'Short Answer Concept', hi: 'लघु उत्तर अवधारणा' },
    'Tingkat Kesulitan:': { en: 'Difficulty Level:', hi: 'कठिनाई स्तर:' },
    'Adaptif Otomatis (Mengikuti Model BKT)': { en: 'Auto-Adaptive (Follows BKT Model)', hi: 'स्वतः-अनुकूली (बीकेटी मॉडल)' },
    'Dasar / Pemula (Easy)': { en: 'Fundamental / Beginner (Easy)', hi: 'बुनियादी / शुरुआत (आसान)' },
    'Menengah (Medium)': { en: 'Intermediate (Medium)', hi: 'मध्यवर्ती (मध्यम)' },
    'Mahir / Analitis (Hard)': { en: 'Advanced / Analytical (Hard)', hi: 'उन्नत / विश्लेषणात्मक (कठिन)' },
    'Jumlah Soal:': { en: 'Question Count:', hi: 'प्रश्नों की संख्या:' },
    '3 Soal (Sprint Kilat)': { en: '3 Questions (Quick Sprint)', hi: '3 प्रश्न (त्वरित स्प्रिंट)' },
    '5 Soal (Asesmen Standar Lengkap)': { en: '5 Questions (Standard Assessment)', hi: '5 प्रश्न (मानक मूल्यांकन)' },
    '8 Soal (Latihan Mendalam)': { en: '8 Questions (In-Depth Practice)', hi: '8 प्रश्न (गहन अभ्यास)' },
    '10 Soal (Simulasi Ujian / Mock Exam)': { en: '10 Questions (Mock Exam Simulation)', hi: '10 प्रश्न (मॉक परीक्षा सिमुलेशन)' },
    '15 Soal (Tryout Komprehensif)': { en: '15 Questions (Comprehensive Tryout)', hi: '15 प्रश्न (व्यापक ट्रायल)' },
    'Mulai Asesmen Adaptif Sekarang 🚀': { en: 'Start Adaptive Assessment Now 🚀', hi: 'अब अनुकूली मूल्यांकन शुरू करें 🚀' },
    'Mulai Asesmen Adaptif Sekarang': { en: 'Start Adaptive Assessment Now', hi: 'अब अनुकूली मूल्यांकन शुरू करें' },
    'Soal 1 dari 5': { en: 'Question 1 of 5', hi: 'प्रश्न 1 का 5' },
    'Kesulitan: Medium': { en: 'Difficulty: Medium', hi: 'कठिनाई: मध्यम' },
    'Pertanyaan akan dimuat di sini...': { en: 'Question will load here...', hi: 'प्रश्न यहां लोड होगा...' },
    'Masukkan Hasil Perhitungan Numerik:': { en: 'Enter Numerical Calculation Result:', hi: 'संख्यात्मक गणना परिणाम दर्ज करें:' },
    'Ketik angka hasil akhir...': { en: 'Type final calculation number...', hi: 'अंतिम गणना संख्या टाइप करें...' },
    'Tuliskan Konsep Kunci / Nama Istilah:': { en: 'Write Key Concept / Term Name:', hi: 'मुख्य अवधारणा / शब्द का नाम लिखें:' },
    'Ketik istilah biologi...': { en: 'Type scientific term...', hi: 'वैज्ञानिक शब्द टाइप करें...' },
    'Keluar Kuis': { en: 'Exit Quiz', hi: 'प्रश्नोत्तरी छोड़ें' },
    'Periksa Jawaban 🔍': { en: 'Check Answer 🔍', hi: 'उत्तर जांचें 🔍' },
    'Periksa Jawaban': { en: 'Check Answer', hi: 'उत्तर जांचें' },
    'Soal Berikutnya ➔': { en: 'Next Question ➔', hi: 'अगला प्रश्न ➔' },
    'Soal Berikutnya': { en: 'Next Question', hi: 'अगला प्रश्न' },
    'Asesmen Adaptif Selesai! Skor: 80%': { en: 'Adaptive Assessment Complete! Score: 80%', hi: 'अनुकूली मूल्यांकन पूर्ण! स्कोर: 80%' },
    'Luar biasa, Rekan Mahasiswa! Model kognitif BKT telah memperbarui estimasi pemahaman topikmu secara instan.': {
      en: 'Outstanding work, Fellow Learner! The BKT cognitive model has updated your topic mastery estimates in real-time.',
      hi: 'शानदार काम, साथी छात्र! बीकेटी संज्ञानात्मक मॉडल ने वास्तविक समय में आपके विषय की महारत के अनुमान को अपडेट कर दिया है।'
    },
    'Pembaruan Learner Model (Bayesian Knowledge Tracing - BKT):': {
      en: 'Learner Model Progression (Bayesian Knowledge Tracing - BKT):',
      hi: 'शिक्षार्थी मॉडल प्रगति (बायेसियन ज्ञान अनुरेखण - बीकेटी):'
    },
    'Diagnosis Kognitif & Analisis Miskonsepsi Terdeteksi:': {
      en: 'Cognitive Diagnosis & Detected Misconceptions Analysis:',
      hi: 'संज्ञानात्मक निदान और पहचानी गई भ्रांतियों का विश्लेषण:'
    },
    'Faithfulness (Kebenaran Sumber)': { en: 'Faithfulness (Source Grounding)', hi: 'सत्यता (स्रोत आधार)' },
    '0 Repetisi (100% Unik)': { en: '0 Repetitions (100% Unique)', hi: '0 दोहराव (100% अद्वितीय)' },
    'Bahas Bersama AI Tutor 💬': { en: 'Discuss with AI Tutor 💬', hi: 'एआई ट्यूटर से चर्चा करें 💬' },
    'Bahas Bersama AI Tutor': { en: 'Discuss with AI Tutor', hi: 'एआई ट्यूटर से चर्चा करें' },
    'Buat Kuis Baru': { en: 'Create New Quiz', hi: 'नई प्रश्नोत्तरी बनाएं' },

    // Progress
    'Analytics, Knowledge Graph & System Evaluation': { en: 'Analytics, Knowledge Graph & System Evaluation', hi: 'एनालिटिक्स, नॉलेज ग्राफ और सिस्टम मूल्यांकन' },
    'Analitik, Graf Pengetahuan & Evaluasi Sistem': { en: 'Analytics, Knowledge Graph & System Evaluation', hi: 'एनालिटिक्स, नॉलेज ग्राफ और सिस्टम मूल्यांकन' },
    '✓ Bayesian Knowledge Tracing (BKT) · Concept Prerequisite DAG · RAGAS Pipeline Benchmark': {
      en: '✓ Bayesian Knowledge Tracing (BKT) · Concept Prerequisite DAG · RAGAS Pipeline Benchmark',
      hi: '✓ बायेसियन नॉलेज ट्रेसिंग (BKT) · अवधारणा पूर्वापेक्षा DAG · रागस पाइपलाइन बेंचमार्क'
    },
    'Bayesian Knowledge Tracing (BKT) · Concept Prerequisite DAG · RAGAS Pipeline Benchmark': {
      en: 'Bayesian Knowledge Tracing (BKT) · Concept Prerequisite DAG · RAGAS Pipeline Benchmark',
      hi: 'बायेसियन नॉलेज ट्रेसिंग (BKT) · अवधारणा पूर्वापेक्षा DAG · रागस पाइपलाइन बेंचमार्क'
    },
    '1. Model Pelacakan Kognitif & BKT': { en: '1. Cognitive Tracing & BKT Model', hi: '1. संज्ञानात्मक अनुरेखण और बीकेटी मॉडल' },
    '1. Pelacakan Kognitif & Model BKT': { en: '1. Cognitive Tracing & BKT Model', hi: '1. संज्ञानात्मक अनुरेखण और बीकेटी मॉडल' },
    '1. Cognitive Tracing & BKT Model': { en: '1. Cognitive Tracing & BKT Model', hi: '1. संज्ञानात्मक अनुरेखण और बीकेटी मॉडल' },
    '2. Graf Pengetahuan Multimodal (DAG)': { en: '2. Multimodal Knowledge Graph (DAG)', hi: '2. मल्टीमॉडल नॉलेज ग्राफ (DAG)' },
    '2. Multimodal Knowledge Graph (DAG)': { en: '2. Multimodal Knowledge Graph (DAG)', hi: '2. मल्टीमॉडल नॉलेज ग्राफ (DAG)' },
    '3. Benchmark RAGAS & DeepEval': { en: '3. RAGAS & DeepEval Benchmark', hi: '3. रागस और डीपइवैल बेंचमार्क' },
    '3. RAGAS & DeepEval Benchmark': { en: '3. RAGAS & DeepEval Benchmark', hi: '3. रागस और डीपइवैल बेंचमार्क' },
    'Status: Menunggu Unggahan Materi': { en: 'Status: Waiting for Materials', hi: 'स्थिति: सामग्री की प्रतीक्षा' },
    'Belum Ada Materi Pembelajaran Terunggah': { en: 'No Learning Materials Uploaded Yet', hi: 'अभी तक कोई शिक्षण सामग्री अपलोड नहीं की गई' },
    'Dashboard Progress & Learner Model memetakan graf prasyarat materi (DAG), melacak estimasi penguasaan kognitif mahasiswa (BKT), serta mengukur metrik RAGAS secara otomatis berdasarkan materi perkuliahan resmi yang diunggah oleh Dosen.': {
      en: 'The Progress & Learner Model dashboard maps course prerequisite graphs (DAG), tracks student cognitive mastery estimates (BKT), and automatically benchmarks RAGAS metrics based on official lecture materials uploaded by the Lecturer.',
      hi: 'प्रोग्रेस और शिक्षार्थी मॉडल डैशबोर्ड पाठ्यक्रम पूर्वापेक्षा ग्राफ (DAG) मैप करता है, छात्र संज्ञानात्मक महारत अनुमान (BKT) ट्रैक करता है, और शिक्षक द्वारा अपलोड की गई आधिकारिक व्याख्यान सामग्री के आधार पर स्वचालित रूप से रागस मीट्रिक को बेंचमार्क करता है।'
    },
    'memetakan graf prasyarat materi (DAG), melacak estimasi penguasaan kognitif mahasiswa (BKT), serta mengukur metrik RAGAS secara otomatis berdasarkan materi perkuliahan resmi yang diunggah oleh Dosen.': {
      en: 'maps course prerequisite graphs (DAG), tracks student cognitive mastery estimates (BKT), and automatically benchmarks RAGAS metrics based on official lecture materials uploaded by the Lecturer.',
      hi: 'पाठ्यक्रम पूर्वापेक्षा ग्राफ (DAG) मैप करता है, छात्र संज्ञानात्मक महारत अनुमान (BKT) ट्रैक करता है, और शिक्षक द्वारा अपलोड की गई व्याख्यान सामग्री के आधार पर स्वचालित रूप से रागस मीट्रिक को बेंचमार्क करता है।'
    },
    'Jalankan Kuis Diagnostik Cold-Start (Req 4.b)': { en: 'Run Cold-Start Diagnostic Quiz (Req 4.b)', hi: 'कोल्ड-स्टार्ट नैदानिक प्रश्नोत्तरी चलाएं (आवश्यकता 4.b)' },
    'Spesifikasi Arsitektur Track D': { en: 'Track D Architecture Specifications', hi: 'ट्रैक डी वास्तुकला विनिर्देश' },
    'Spesifikasi Arsitektur Track D 📐': { en: 'Track D Architecture Specifications 📐', hi: 'ट्रैक डी वास्तुकला विनिर्देश 📐' },
    'Bagaimana Sistem Progress Bekerja Setelah Materi Diunggah?': {
      en: 'How the Progress System Works After Materials are Uploaded?',
      hi: 'सामग्री अपलोड होने के बाद प्रोग्रेस सिस्टम कैसे काम करता है?'
    },
    'DAG Otomatis:': { en: 'Automatic DAG:', hi: 'स्वचालित DAG:' },
    'Mengekstrak topik, subtopik, dan relasi prasyarat antarmateri berakar dari video/buku/slide (Req 1.b & 1.c).': {
      en: 'Extracts topics, subtopics, and prerequisite relations rooted in video/books/slides (Req 1.b & 1.c).',
      hi: 'वीडियो/पुस्तकों/स्लाइड्स पर आधारित विषयों, उप-विषयों और पूर्वापेक्षा संबंधों को निकालता है (Req 1.b और 1.c)।'
    },
    'Model Kognitif BKT:': { en: 'BKT Cognitive Model:', hi: 'BKT संज्ञानात्मक मॉडल:' },
    'Melacak probabilitas penguasaan mahasiswa per-topik P(Lₜ) secara probabilistik (Req 4.a).': {
      en: 'Probabilistically tracks student topic mastery probability P(Lₜ) (Req 4.a).',
      hi: 'संभाव्य रूप से छात्र विषय महारत प्रायिकता P(Lₜ) को ट्रैक करता है (Req 4.a)।'
    },
    'Evaluasi RAGAS:': { en: 'RAGAS Evaluation:', hi: 'रागस मूल्यांकन:' },
    'Mengukur faithfulness, answer relevancy, dan guardrail penolakan kueri di luar silabus (Req 5.a).': {
      en: 'Measures faithfulness, answer relevancy, and out-of-syllabus query rejection guardrails (Req 5.a).',
      hi: 'सत्यता, उत्तर प्रासंगिकता और पाठ्यक्रम-बाह्य प्रश्न अस्वीकृति सुरक्षा उपायों को मापता है (Req 5.a)।'
    },
    '1. DAG Otomatis: Mengekstrak topik, subtopik, dan relasi prasyarat antarmateri berakar dari video/buku/slide (Req 1.b & 1.c).': {
      en: '1. Automatic DAG: Extracts topics, subtopics, and prerequisite relations rooted in video/books/slides (Req 1.b & 1.c).',
      hi: '1. स्वचालित DAG: वीडियो/पुस्तकों/स्लाइड्स पर आधारित विषयों, उप-विषयों और पूर्वापेक्षा संबंधों को निकालता है (Req 1.b और 1.c)।'
    },
    '2. Model Kognitif BKT: Melacak probabilitas penguasaan mahasiswa per-topik P(Lₜ) secara probabilistik (Req 4.a).': {
      en: '2. BKT Cognitive Model: Probabilistically tracks student topic mastery probability P(Lₜ) (Req 4.a).',
      hi: '2. BKT संज्ञानात्मक मॉडल: संभाव्य रूप से छात्र विषय महारत प्रायिकता P(Lₜ) को ट्रैक करता है (Req 4.a)।'
    },
    '3. Evaluasi RAGAS: Mengukur faithfulness, answer relevancy, dan guardrail penolakan kueri di luar silabus (Req 5.a).': {
      en: '3. RAGAS Evaluation: Measures faithfulness, answer relevancy, and out-of-syllabus query rejection guardrails (Req 5.a).',
      hi: '3. रागस मूल्यांकन: सत्यता, उत्तर प्रासंगिकता और पाठ्यक्रम-बाह्य प्रश्न अस्वीकृति सुरक्षा उपायों को मापता है (Req 5.a)।'
    },
    '✓ Kursus Aktif:': { en: '✓ Active Course:', hi: '✓ सक्रिय पाठ्यक्रम:' },
    'Kursus Aktif:': { en: 'Active Course:', hi: 'सक्रिय पाठ्यक्रम:' },
    'Mata Kuliah Terpadu': { en: 'Integrated Course', hi: 'एकीकृत पाठ्यक्रम' },
    'Mata Kuliah': { en: 'Course', hi: 'पाठ्यक्रम' },
    'Status Mahasiswa: Cold-Start Prior P(L₀) = 30% (Mahasiswa Baru Tanpa Riwayat)': {
      en: 'Student Status: Cold-Start Prior P(L₀) = 30% (New Student Without History)',
      hi: 'छात्र स्थिति: कोल्ड-स्टार्ट प्रायर P(L₀) = 30% (इतिहास के बिना नया छात्र)'
    },
    'Status Mahasiswa: Profil Kognitif Terkalibrasi (BKT Live)': {
      en: 'Student Status: Calibrated Cognitive Profile (BKT Live)',
      hi: 'छात्र स्थिति: कैलिब्रेटेड संज्ञानात्मक प्रोफ़ाइल (BKT लाइव)'
    },
    'Mulai Kuis Diagnostik (Req 4.b)': { en: 'Start Diagnostic Quiz (Req 4.b)', hi: 'नैदानिक प्रश्नोत्तरी शुरू करें (आवश्यकता 4.b)' },
    'Ulangi Kuis Diagnostik': { en: 'Retake Diagnostic Quiz', hi: 'नैदानिक प्रश्नोत्तरी पुनः लें' },
    'Reset Cold-Start': { en: 'Reset Cold-Start', hi: 'कोल्ड-स्टार्ट रीसेट करें' },
    'Simulasi Benar (+12%)': { en: 'Simulate Correct (+12%)', hi: 'सही अनुकरण (+12%)' },
    'Simulasi Salah (-10%)': { en: 'Simulate Wrong (-10%)', hi: 'गलत अनुकरण (-10%)' },
    'Detektor Miskonsepsi Kognitif & Topik Lemah (Req 3.c & 6.b)': {
      en: 'Cognitive Misconception & Weak Topics Detector (Req 3.c & 6.b)',
      hi: 'संज्ञानात्मक भ्रांति और कमजोर विषय डिटेक्टर (आवश्यकता 3.c और 6.b)'
    },
    'Detektor Miskonsepsi & Topik Lemah (Track D Req 3.c & 6.b)': {
      en: 'Misconception & Weak Topics Detector (Track D Req 3.c & 6.b)',
      hi: 'भ्रांति और कमजोर विषय डिटेक्टर (Track D Req 3.c & 6.b)'
    },
    'Remedial 3 Soal': { en: 'Remedial 3 Questions', hi: 'उपचारात्मक 3 प्रश्न' },
    'Buat Flashcard (Req 6.b)': { en: 'Create Flashcards (Req 6.b)', hi: 'फ्लैशकार्ड बनाएं (आवश्यकता 6.b)' },
    'Bahas Topik di Tutor': { en: 'Discuss Topic in Tutor', hi: 'ट्यूटर में विषय पर चर्चा करें' },
    'Bahas di Tutor': { en: 'Discuss in Tutor', hi: 'ट्यूटर में चर्चा करें' },
    'Bahas di AI Tutor': { en: 'Discuss in AI Tutor', hi: 'एआई ट्यूटर में चर्चा करें' },
    'Latihan di Practice': { en: 'Practice in Exam Center', hi: 'अभ्यास केंद्र में अभ्यास करें' },
    'Kurva Lupa Ebbinghaus & Jadwal Review Terjadwal': {
      en: 'Ebbinghaus Forgetting Curve & Spaced Repetition Schedule',
      hi: 'एबिंगहॉस विस्मृति वक्र और समीक्षा अनुसूची'
    },
    'Kurva Lupa Ebbinghaus & Jadwal Review': {
      en: 'Ebbinghaus Forgetting Curve & Review Schedule',
      hi: 'एबिंगहॉस विस्मृति वक्र और समीक्षा कार्यक्रम'
    },
    'Buat Jadwal Belajar Pra-Ujian': { en: 'Create Pre-Exam Study Schedule', hi: 'परीक्षा पूर्व अध्ययन कार्यक्रम बनाएं' },
    'Buat Jadwal Belajar Menjelang Ujian': { en: 'Create Pre-Exam Study Schedule', hi: 'परीक्षा पूर्व अध्ययन कार्यक्रम बनाएं' },
    'Evaluasi Personalisasi: Simulasi Siswa 5-Sesi': {
      en: 'Personalization Evaluation: 5-Session Student Simulation',
      hi: 'वैयक्तिकरण मूल्यांकन: 5-सत्र छात्र सिमुलेशन'
    },
    'Evaluasi Personalisasi: Simulasi 5 Sesi Siswa': {
      en: 'Personalization Evaluation: 5-Session Student Simulation',
      hi: 'वैयक्तिकरण मूल्यांकन: 5-सत्र छात्र सिमुलेशन'
    },
    'Jalankan Simulasi Siswa 5-Sesi': { en: 'Run 5-Session Student Simulation', hi: '5-सत्र छात्र सिमुलेशन चलाएं' },
    'Jalankan Uji Simulasi Multi-Sesi': { en: 'Run Multi-Session Simulation', hi: 'बहु-सत्र सिमुलेशन चलाएं' },
    'Peta Alur Materi & Sitasi Sumber (DAG)': {
      en: 'Prerequisite Course Flow Map & Source Citations (DAG)',
      hi: 'आवश्यकता प्रवाह मानचित्र और स्रोत उद्धरण (DAG)'
    },
    'Peta Prasyarat Materi & Unit Sumber Belajar (DAG Course Flow)': {
      en: 'Prerequisite Course Flow Map & Multimodal Units (DAG)',
      hi: 'पूर्वापेक्षा पाठ्यक्रम प्रवाह मानचित्र और मल्टीमॉडल इकाइयाँ (DAG)'
    },
    'Hasil Evaluasi RAGAS (Retrieval-Augmented Generation)': {
      en: 'RAGAS (Retrieval-Augmented Generation) Benchmark Results',
      hi: 'रागस (रिट्रीवल-ऑगमेंटेड जनरेशन) बेंचमार्क परिणाम'
    },
    'Jalankan Uji Ulang Benchmark RAGAS': { en: 'Re-run RAGAS Benchmark Test', hi: 'रागस बेंचमार्क परीक्षण पुनः चलाएं' },
    'Bayesian Knowledge Tracing (BKT) & Item Response Theory Model': {
      en: 'Bayesian Knowledge Tracing (BKT) & Item Response Theory Model',
      hi: 'बायेसियन नॉलेज ट्रेसिंग (BKT) और आइटम रिस्पॉन्स थ्योरी मॉडल'
    },
    'Prior Knowledge P(L₀)': { en: 'Prior Knowledge P(L₀)', hi: 'पूर्व ज्ञान P(L₀)' },
    'Transition Rate P(T)': { en: 'Transition Rate P(T)', hi: 'संक्रमण दर P(T)' },
    'Guess Rate P(G)': { en: 'Guess Rate P(G)', hi: 'अनुमान दर P(G)' },
    'Slip Rate P(S)': { en: 'Slip Rate P(S)', hi: 'चूक दर P(S)' },
    'Penguasaan Awal': { en: 'Prior Knowledge', hi: 'पूर्व ज्ञान' },
    'Laju Belajar': { en: 'Learning Rate', hi: 'सीखने की दर' },
    'Peluang Tebakan': { en: 'Guess Chance', hi: 'अनुमान संभावना' },
    'Peluang Khilaf': { en: 'Slip Chance', hi: 'चूक संभावना' },
    'Probabilitas Kognitif:': { en: 'Cognitive Probability:', hi: 'संज्ञानात्मक संभावना:' },
    'Fondasi Utama': { en: 'Primary Foundation', hi: 'मुख्य आधार' },
    'FONDASI UTAMA': { en: 'MAIN FOUNDATION', hi: 'मुख्य आधार' },
    'Fondasi Awal': { en: 'Initial Foundation', hi: 'प्रारंभिक आधार' },
    'Tidak ada (Fondasi Awal)': { en: 'None (Initial Foundation)', hi: 'कोई नहीं (प्रारंभिक आधार)' },
    'Topik Fondasi': { en: 'Foundational Topic', hi: 'आधारभूत विषय' },
    'Topik Lanjut': { en: 'Advanced Topic', hi: 'उन्नत विषय' },
    'Ujian Akhir': { en: 'Final Exam', hi: 'अंतिम परीक्षा' },
    'Ujian Akhir Komprehensif': { en: 'Comprehensive Final Exam', hi: 'व्यापक अंतिम परीक्षा' },
    'Membuka Materi:': { en: 'Unlocks Material:', hi: 'सामग्री अनलॉक करता है:' },
    'Status BKT Siswa:': { en: 'Student BKT Status:', hi: 'छात्र BKT स्थिति:' },
    'Menguasai Sempurna 🌟': { en: 'Mastered Perfectly 🌟', hi: 'पूर्ण महारत 🌟' },
    'Perlu Penguatan ⚠️': { en: 'Needs Reinforcement ⚠️', hi: 'सुदृढ़ीकरण आवश्यक ⚠️' },
    'Menguasai Sempurna': { en: 'Mastered', hi: 'पूर्ण महारत' },
    'Perlu Penguatan': { en: 'Needs Reinforcement', hi: 'सुदृढ़ीकरण की आवश्यकता' },
    'Berkembang 👍': { en: 'Developing 👍', hi: 'प्रगति पर 👍' },
    'Berkembang': { en: 'Developing', hi: 'विकासशील' },
    'Remedial ⚠️': { en: 'Remedial ⚠️', hi: 'उपचारात्मक ⚠️' },
    'Mastered 🌟': { en: 'Mastered 🌟', hi: 'महारत हासिल 🌟' },
    'Mastered': { en: 'Mastered', hi: 'महारत हासिल' },
    'Semua Topik Terkuasai 🎉': { en: 'All Topics Mastered 🎉', hi: 'सभी विषयों में महारत हासिल 🎉' },
    'Semua Topik Terkuasai': { en: 'All Topics Mastered', hi: 'सभी विषयों में महारत' },
    'Topik Perlu Penguatan': { en: 'Topics Need Reinforcement', hi: 'विषयों में सुदृढ़ीकरण की आवश्यकता' },
    'Hari Ini (Segera)': { en: 'Today (Urgent)', hi: 'आज (अति आवश्यक)' },
    'Dalam 3 Hari': { en: 'In 3 Days', hi: '3 दिनों में' },
    'Dalam 7 Hari': { en: 'In 7 Days', hi: '7 दिनों में' },
    'Belum ada data topik.': { en: 'No topic data yet.', hi: 'अभी तक कोई विषय डेटा नहीं है।' },
    'Pilih topik pada graf di atas.': { en: 'Select a topic on the graph above.', hi: 'ऊपर दिए गए ग्राफ में एक विषय चुनें।' },
    'Retensi tersisa:': { en: 'Retention remaining:', hi: 'शेष प्रतिधारण:' },
    'Risiko lupa tinggi! Prioritas penguatan.': { en: 'High forgetting risk! Priority review.', hi: 'भूलने का उच्च जोखिम! समीक्षा प्राथमिकता।' },
    'Kurva retensi stabil.': { en: 'Retention curve stable.', hi: 'प्रतिधारण वक्र स्थिर है।' },
    'Memori jangka panjang aktif.': { en: 'Long-term memory active.', hi: 'दीर्घकालिक स्मृति सक्रिय है।' },
    'Klik kartu topik untuk menginspeksi sumber & prasyarat': {
      en: 'Click a topic card to inspect sources & prerequisites',
      hi: 'स्रोतों और पूर्वापेक्षाओं का निरीक्षण करने के लिए किसी विषय कार्ड पर क्लिक करें'
    },
    'Sumber Terverifikasi (Multimodal Units):': {
      en: 'Verified Source Grounding (Multimodal Units):',
      hi: 'सत्यापित स्रोत आधार (मल्टीमॉडल इकाइयाँ):'
    },
    'Hubungan Prasyarat & Kesiapan:': {
      en: 'Prerequisites & Readiness:',
      hi: 'पूर्वापेक्षाएँ और तत्परता:'
    },
    'Prasyarat Diperlukan:': {
      en: 'Required Prerequisite:',
      hi: 'आवश्यक पूर्वापेक्षा:'
    },
    'Buku Teks:': { en: 'Textbook:', hi: 'पाठ्यपुस्तक:' },
    'Video Kuliah:': { en: 'Lecture Video:', hi: 'व्याख्यान वीडियो:' },
    'Slide PPTX:': { en: 'PPTX Slides:', hi: 'पीपीटीएक्स स्लाइड:' },
    'Visual / Diagram:': { en: 'Visual / Diagram:', hi: 'दृश्य / आरेख:' },
    'Representasi visual terstruktur diekstrak ke knowledge base': {
      en: 'Structured visual representation extracted to knowledge base',
      hi: 'ज्ञानकोष में निकाली गई संरचित दृश्य प्रस्तुति'
    },
    'Dokumen Resmi Dosen': { en: 'Official Lecturer Document', hi: 'आधिकारिक शिक्षक दस्तावेज़' },
    'Buku Teks Resmi': { en: 'Official Textbook', hi: 'आधिकारिक पाठ्यपुस्तक' },
    'Rekaman Kuliah Dosen': { en: 'Lecturer Video Recording', hi: 'शिक्षक वीडियो रिकॉर्डिंग' },
    'Slide PPTX Kuliah': { en: 'Lecture PPTX Slides', hi: 'व्याख्यान पीपीटीएक्स स्लाइड' },
    'Materi Terindeks': { en: 'Indexed Material', hi: 'अनुक्रमित सामग्री' },
    'Materi Terverifikasi': { en: 'Verified Material', hi: 'सत्यापित सामग्री' },
    'Rujukan Grounding': { en: 'Grounding Reference', hi: 'आधार संदर्भ' },
    'Materi Kuliah & Problem Key': { en: 'Lecture Material & Problem Key', hi: 'व्याख्यान सामग्री और समाधान कुंजी' },
    'Multimodal Chunks & OCR Engine': { en: 'Multimodal Chunks & OCR Engine', hi: 'मल्टीमॉडल चंक्स और ओसीआर इंजन' },
    'Cross-Topic DAG': { en: 'Cross-Topic DAG', hi: 'क्रॉस-टॉपिक DAG' },
    'Grounded Citations': { en: 'Grounded Citations', hi: 'सत्यापित उद्धरण' },
    'Guardrail Refusal': { en: 'Guardrail Refusal', hi: 'सुरक्षा गार्ड अस्वीकृति' },
    'Formula Verified': { en: 'Formula Verified', hi: 'सत्यापित सूत्र' },
    'Diagram Extracted': { en: 'Diagram Extracted', hi: 'निकाला गया आरेख' },
    'PASS ✅': { en: 'PASS ✅', hi: 'उत्तीर्ण ✅' },
    'PASS ✅ (Guardrail)': { en: 'PASS ✅ (Guardrail)', hi: 'उत्तीर्ण ✅ (सुरक्षा गार्ड)' },
    'Framework Evaluasi:': { en: 'Evaluation Framework:', hi: 'मूल्यांकन ढांचा:' },
    'Dataset:': { en: 'Dataset:', hi: 'डेटासेट:' },
    'In-Domain (Fakta)': { en: 'In-Domain (Fact)', hi: 'इन-डोमेन (तथ्य)' },
    'Multi-Hop Reasoning': { en: 'Multi-Hop Reasoning', hi: 'मल्टी-हॉप रीजनिंग' },
    'Off-Material Query': { en: 'Off-Material Query', hi: 'पाठ्यक्रम-बाह्य प्रश्न' },
    'Numerical / Problem': { en: 'Numerical / Problem', hi: 'संख्यात्मक / समस्या' },
    'Multimodal Diagram': { en: 'Multimodal Diagram', hi: 'मल्टीमॉडल आरेख' },
    'Mengevaluasi 5 Test Cases Live...': { en: 'Evaluating 5 Test Cases Live...', hi: '5 टेस्ट मामलों का लाइव मूल्यांकन हो रहा है...' },
    'Menjalankan Simulasi 5 Sesi...': { en: 'Running 5-Session Simulation...', hi: '5-सत्र सिमुलेशन चल रहा है...' },
    'Simulasi Sukses (Gains: +60%, Repetisi: 0.0%)': { en: 'Simulation Success (Gains: +60%, Repetition: 0.0%)', hi: 'सिमुलेशन सफल (वृद्धि: +60%, दोहराव: 0.0%)' },
    'Evaluasi Selesai (Faithfulness 95.4%, Relevancy 93.8%)': { en: 'Evaluation Complete (Faithfulness 95.4%, Relevancy 93.8%)', hi: 'मूल्यांकन पूर्ण (सत्यता 95.4%, प्रासंगिकता 93.8%)' },
    'RAGAS Metric 1': { en: 'RAGAS Metric 1', hi: 'रागस मीट्रिक 1' },
    'RAGAS Metric 2': { en: 'RAGAS Metric 2', hi: 'रागस मीट्रिक 2' },
    'RAGAS Metric 3': { en: 'RAGAS Metric 3', hi: 'रागस मीट्रिक 3' },
    'RAGAS Metric 4': { en: 'RAGAS Metric 4', hi: 'रागस मीट्रिक 4' },
    'Guardrail Metric': { en: 'Guardrail Metric', hi: 'गार्डरेल मीट्रिक' },
    'Assessment Metric': { en: 'Assessment Metric', hi: 'मूल्यांकन मीट्रिक' },
    'Repetition Rate': { en: 'Repetition Rate', hi: 'दोहराव दर' },
    'Off-Material Rejection': { en: 'Off-Material Rejection', hi: 'असंगत सामग्री अस्वीकृति' },
    'Faithfulness': { en: 'Faithfulness', hi: 'सत्यता' },
    'Answer Relevancy': { en: 'Answer Relevancy', hi: 'उत्तर प्रासंगिकता' },
    'Context Precision': { en: 'Context Precision', hi: 'संदर्भ परिशुद्धता' },
    'Context Recall': { en: 'Context Recall', hi: 'संदर्भ स्मरण' },
    'Kesesuaian faktual dengan materi kuliah terunggah': {
      en: 'Factual consistency with uploaded lecture materials',
      hi: 'अपलोड की गई व्याख्यान सामग्री के साथ तथ्यात्मक संगति'
    },
    'Relevansi jawaban terhadap kueri mahasiswa': {
      en: 'Relevancy of answer to student queries',
      hi: 'छात्र प्रश्नों के उत्तर की प्रासंगिकता'
    },
    'Presisi chunk sumber terverifikasi': {
      en: 'Precision of verified source chunks',
      hi: 'सत्यापित स्रोत विखंडन की सटीकता'
    },
    'Cakupan penarikan konsep multimodal': {
      en: 'Coverage of multimodal concept retrieval',
      hi: 'मल्टीमॉडल अवधारणा पुनर्प्राप्ति का दायरा'
    },
    'Penolakan kueri di luar silabus (<0.70) (Req 2.b)': {
      en: 'Rejection of out-of-syllabus queries (<0.70) (Req 2.b)',
      hi: 'पाठ्यक्रम से बाहर के प्रश्नों की अस्वीकृति (<0.70) (Req 2.b)'
    },
    '100% soal unik tanpa repetisi (Req 3.b)': {
      en: '100% unique questions without repetition (Req 3.b)',
      hi: 'बिना दोहराव के 100% अद्वितीय प्रश्न (Req 3.b)'
    },
    '100% Unik': { en: '100% Unique', hi: '100% अद्वितीय' },
    'Evaluasi Pipeline RAGAS pada 5 Test Cases Nyata': {
      en: 'RAGAS Pipeline Evaluation on 5 Real Test Cases',
      hi: '5 वास्तविक टेस्ट मामलों पर RAGAS पाइपलाइन मूल्यांकन'
    },
    'Test ID & Kategori': { en: 'Test ID & Category', hi: 'टेस्ट आईडी और श्रेणी' },
    'Query Masukan Siswa': { en: 'Student Input Query', hi: 'छात्र इनपुट प्रश्न' },
    'Sumber Acuan Ground Truth': { en: 'Ground Truth Source Reference', hi: 'ग्राउंड ट्रुथ स्रोत संदर्भ' },
    'Status Pipeline': { en: 'Pipeline Status', hi: 'पाइपलाइन स्थिति' },
    'Hasil Verdict': { en: 'Verdict', hi: 'निर्णय' },
    'Verdict': { en: 'Verdict', hi: 'निर्णय' },
    '🎉 Selamat! Seluruh topik aktif telah mencapai ambang kelulusan (≥70%). Anda siap mengikuti Comprehensive Mock Exam!': {
      en: '🎉 Congratulations! All active topics have reached the passing threshold (≥70%). You are ready for the Comprehensive Mock Exam!',
      hi: '🎉 बधाई! सभी सक्रिय विषय उत्तीर्ण सीमा (≥70%) तक पहुँच चुके हैं। आप व्यापक मॉक परीक्षा के लिए तैयार हैं!'
    },
    'Selamat! Seluruh topik aktif telah mencapai ambang kelulusan (≥70%). Anda siap mengikuti Comprehensive Mock Exam!': {
      en: 'Congratulations! All active topics have reached the passing threshold (≥70%). You are ready for the Comprehensive Mock Exam!',
      hi: 'बधाई! सभी सक्रिय विषय उत्तीर्ण सीमा (≥70%) तक पहुँच चुके हैं। आप व्यापक मॉक परीक्षा के लिए तैयार हैं!'
    },
    'Estimasi penguasaan kognitif per topik diperbarui secara probabilistik setelah setiap jawaban kuis dan interaksi tutor menggunakan rumus posterior:': {
      en: 'Cognitive mastery estimation per topic is probabilistically updated after every quiz answer and tutor interaction using posterior formula:',
      hi: 'प्रत्येक प्रश्नोत्तरी उत्तर और ट्यूटर बातचीत के बाद पोस्टीरियर सूत्र का उपयोग करके प्रति विषय संज्ञानात्मक महारत अनुमान को संभाव्य रूप से अपडेट किया जाता है:'
    },
    'Lakukan kuis diagnostik untuk mengukur pemahaman awal dan menentukan titik awal personalisasi.': {
      en: 'Take a diagnostic quiz to measure initial understanding and establish personalized starting point.',
      hi: 'प्रारंभिक समझ को मापने और वैयक्तिकृत प्रारंभिक बिंदु स्थापित करने के लिए एक नैदानिक प्रश्नोत्तरी लें।'
    },
    'Nilai otomatis tersinkronisasi probabilistik dari jawaban kuis di Practice dan percakapan di AI Tutor.': {
      en: 'Values automatically synchronized probabilistically from quiz answers in Practice and AI Tutor dialogues.',
      hi: 'प्रैक्टिस में क्विज़ उत्तरों और एआई ट्यूटर संवादों से मान स्वतः संभाव्य रूप से सिंक हो जाते हैं।'
    },
    'Sistem mendeteksi topik dengan penguasaan rendah (<70%) atau kesalahan konsep yang tercatat dari asesmen adaptif.': {
      en: 'The system detects topics with low mastery (<70%) or conceptual errors recorded from adaptive assessments.',
      hi: 'प्रणाली कम महारत (<70%) वाले विषयों या अनुकूली आकलनों से दर्ज की गई वैचारिक त्रुटियों का पता लगाती है।'
    },
    'Perlu remedial konsep dasar & penguatan materi sebelum ujian akhir.': {
      en: 'Requires fundamental concept remedial & material reinforcement before final exam.',
      hi: 'अंतिम परीक्षा से पहले मूलभूत अवधारणा उपचारात्मक और सामग्री सुदृढ़ीकरण की आवश्यकता है।'
    },
    'Algoritma Spaced Repetition menghitung peluruhan memori berdasarkan waktu retensi (R = e⁻ᵗ/ˢ) untuk menjadwalkan repetisi adaptif sebelum materi terlupakan.': {
      en: 'Spaced Repetition algorithm computes memory decay based on retention time (R = e⁻ᵗ/ˢ) to schedule adaptive reviews before materials are forgotten.',
      hi: 'सामग्री भूलने से पहले अनुकूली समीक्षाओं को शेड्यूल करने के लिए स्पेस्ड रिपीटिशन एल्गोरिदम मेमोरी क्षय की गणना करता है।'
    },
    'Menguji peningkatan penguasaan (*mastery gains*) dan tingkat repetisi soal (*question repetition rate*) pada profil mahasiswa baru simulatif across 5 sesi belajar adaptif pada materi': {
      en: 'Testing mastery gains and question repetition rate on a simulated new student profile across 5 adaptive study sessions for material',
      hi: 'सामग्री के लिए 5 अनुकूली अध्ययन सत्रों में सिम्युलेटेड नए छात्र प्रोफ़ाइल पर महारत लाभ और प्रश्न दोहराव दर का परीक्षण'
    },
    'Track D: Requirement 1.b, 1.c, & 6.a — Hubungan prasyarat (*prerequisites*) dan keterikatan setiap topik ke kutipan spesifik (buku, slide, timestamp video).': {
      en: 'Track D: Requirement 1.b, 1.c, & 6.a — Prerequisite relationships and linkage of each topic to specific citations (book, slide, video timestamp).',
      hi: 'ट्रैक डी: आवश्यकता 1.b, 1.c, और 6.a — पूर्वापेक्षा संबंध और विशिष्ट उद्धरणों (पुस्तक, स्लाइड, वीडियो टाइमस्टैम्प) से प्रत्येक विषय का जुड़ाव।'
    },
    'Track D Requirement 5.a & 5.b: Evaluasi pipeline retrieval & generation menggunakan team-built benchmark set pada kursus': {
      en: 'Track D Requirement 5.a & 5.b: Retrieval & generation pipeline evaluation using team-built benchmark set on course',
      hi: 'ट्रैक डी आवश्यकता 5.a और 5.b: पाठ्यक्रम पर टीम-निर्मित बेंचमार्क सेट का उपयोग करके पुनर्प्राप्ति और उत्पादन पाइपलाइन मूल्यांकन'
    },
    'Unit materi terindeks dalam knowledge base.': {
      en: 'Material unit indexed in knowledge base.',
      hi: 'ज्ञानकोष में अनुक्रमित सामग्री इकाई।'
    },
    'Bagaimana langkah-langkah membuat resep rendang daging sapi Padang?': {
      en: 'What are the steps to make Padang beef rendang recipe?',
      hi: 'पडांग बीफ रेंडांग रेसिपी बनाने के चरण क्या हैं?'
    },

    // Lecturer Mode
    'Lecturer Ingestion Hub & Course Knowledge Base': {
      en: 'Lecturer Ingestion Hub & Course Knowledge Base',
      hi: 'व्याख्याता अंतर्ग्रहण केंद्र और पाठ्यक्रम ज्ञानकोष'
    },
    'Lihat Tampilan Mahasiswa': { en: 'View Student Interface', hi: 'छात्र दृश्य देखें' },
    'Kosongkan Seluruh Basis Data': { en: 'Clear Entire Database', hi: 'पूरा डेटाबेस साफ़ करें' },
    'Siap Diisi Materi Kuliah': { en: 'Ready for Course Materials', hi: 'पाठ्यक्रम सामग्री के लिए तैयार' },
    'Total Modul:': { en: 'Total Modules:', hi: 'कुल मॉड्यूल:' },
    'Total Multimodal Chunks:': { en: 'Total Multimodal Chunks:', hi: 'कुल मल्टीमॉडल चंक्स:' },
    'Diagram Visual:': { en: 'Visual Diagrams:', hi: 'दृश्य आरेख:' },
    'Menunggu Berkas': { en: 'Waiting for Files', hi: 'फाइलों की प्रतीक्षा' },
    'Video Kuliah': { en: 'Lecture Video', hi: 'व्याख्यान वीडियो' },
    '0 Sesi Terunggah': { en: '0 Sessions Uploaded', hi: '0 सत्र अपलोड किए गए' },
    'Buku Teks (PDF)': { en: 'Textbooks (PDF)', hi: 'पाठ्यपुस्तक (पीडीएफ)' },
    '0 Dokumen (0 Hal)': { en: '0 Documents (0 Pages)', hi: '0 दस्तावेज (0 पृष्ठ)' },
    'Slide Presentasi': { en: 'Presentation Slides', hi: 'प्रस्तुति स्लाइड' },
    '0 Berkas (0 Slide)': { en: '0 Files (0 Slides)', hi: '0 फाइलें (0 स्लाइड)' },
    'Knowledge Graph': { en: 'Knowledge Graph', hi: 'नॉलेज ग्राफ' },
    '0 Simpul Konsep': { en: '0 Concept Nodes', hi: '0 अवधारणा नोड्स' },
    'Formulir Ingestion Materi Kuliah': { en: 'Course Material Ingestion Form', hi: 'पाठ्यक्रम सामग्री अंतर्ग्रहण प्रपत्र' },
    'Tarik & Lepaskan Berkas ke Sini': { en: 'Drag & Drop Files Here', hi: 'यहाँ फ़ाइलें खींचें और छोड़ें' },
    'Antrian Berkas Materi': { en: 'Material Files Queue', hi: 'सामग्री फ़ाइल कतार' },
    'Kosongkan Antrian': { en: 'Clear Queue', hi: 'कतार खाली करें' },
    'Nama Berkas': { en: 'File Name', hi: 'फ़ाइल का नाम' },
    'Tipe': { en: 'Type', hi: 'प्रकार' },
    'Ukuran': { en: 'Size', hi: 'आकार' },
    'Status': { en: 'Status', hi: 'स्थिति' },
    'Aksi': { en: 'Action', hi: 'कार्रवाई' },
    'Jalankan Ingestion & Indexing Materi': { en: 'Run Material Ingestion & Indexing', hi: 'सामग्री अंतर्ग्रहण और अनुक्रमण चलाएं' },
    'Katalog Materi & Tagging Otomatis': { en: 'Material Catalog & Auto-Tagging', hi: 'सामग्री कैटलॉग और स्वचालित टैगिंग' },
    'Export Manifest': { en: 'Export Manifest', hi: 'मैनिफ़ेस्ट निर्यात करें' },
    'Kosongkan': { en: 'Clear', hi: 'साफ़ करें' },

    // Modals
    'Akses Mode Dosen': { en: 'Lecturer Mode Access', hi: 'व्याख्याता मोड पहुंच' },
    'Ketik PIN...': { en: 'Enter PIN...', hi: 'पिन दर्ज करें...' },
    'Password salah!': { en: 'Incorrect password!', hi: 'गलत पासवर्ड!' },
    'Batal': { en: 'Cancel', hi: 'रद्द करें' },
    'Masuk 🔓': { en: 'Sign In 🔓', hi: 'प्रवेश करें 🔓' },
    'Masuk': { en: 'Sign In', hi: 'प्रवेश करें' },
    'Tutup': { en: 'Close', hi: 'बंद करें' },
    'Ayo Main! 🚀': { en: 'Let\'s Go! 🚀', hi: 'शुरू करें! 🚀' }
  };

  const EMOJI_PREFIX_REGEX = /^([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{1F1E0}-\u{1F1FF}⚡⭐🔥💖🤖📝📊📂👨‍🏫🎒🛡️🔬🎛️🎯🔘🔢✏️🟢🟡🔴🏆📈💡🔍🎙️📄🎥🖥️📖✨📋💾🗑️🔒🔓🎉⚠️▶️◀️←➔→✓📈📉📅🗂️👑🔗📐⏳⏱️🧪🕸️🛑✅•·+\-]\s*)+/u;
  const EMOJI_SUFFIX_REGEX = /(\s*[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{1F1E0}-\u{1F1FF}⚡⭐🔥💖🤖📝📊📂👨‍🏫🎒🛡️🔬🎛️🎯🔘🔢✏️🟢🟡🔴🏆📈💡🔍🎙️📄🎥🖥️📖✨📋💾🗑️🔒🔓🎉⚠️▶️◀️←➔→✓📈📉📅🗂️👑🔗📐⏳⏱️🧪🕸️🛑✅•·+\-]+)+$/u;

  // Sorted list of dictionary keys by length descending
  const SORTED_KEYS = Object.keys(DICTIONARY).sort((a, b) => b.length - a.length);

  // Common word mappings (safe compounds first)
  const VOCAB_MAP = [
    { id: 'Hari Ini', en: 'Today', hi: 'आज' },
    { id: 'Kemarin', en: 'Yesterday', hi: 'कल' },
    { id: 'Mata Kuliah', en: 'Course', hi: 'पाठ्यक्रम' },
    { id: 'Mode Dosen', en: 'Lecturer Mode', hi: 'शिक्षक मोड' },
    { id: 'Mode Mahasiswa', en: 'Student Mode', hi: 'छात्र मोड' },
    { id: 'Siklus Krebs', en: 'Krebs Cycle', hi: 'क्रेब्स चक्र' },
    { id: 'Respirasi Sel', en: 'Cellular Respiration', hi: 'कोशिकीय श्वसन' },
    { id: 'Respirasi Seluler', en: 'Cellular Respiration', hi: 'कोशिकीय श्वसन' },
    { id: 'Fotosintesis', en: 'Photosynthesis', hi: 'प्रकाश संश्लेषण' },
    { id: 'Siklus Calvin', en: 'Calvin Cycle', hi: 'केल्विन चक्र' },
    { id: 'Rekan Mahasiswa', en: 'Fellow Learner', hi: 'साथी छात्र' },
    { id: 'Mahasiswa Baru', en: 'New Student', hi: 'नया छात्र' },
    { id: 'Mahasiswa', en: 'Student', hi: 'छात्र' },
    { id: 'Siswa', en: 'Student', hi: 'छात्र' },
    { id: 'Dosen', en: 'Lecturer', hi: 'व्याख्याता' },
    { id: 'Topik', en: 'Topic', hi: 'विषय' },
    { id: 'Materi', en: 'Material', hi: 'सामग्री' },
    { id: 'Kuliah', en: 'Lecture', hi: 'व्याख्यान' },
    { id: 'Pertanyaan', en: 'Question', hi: 'प्रश्न' },
    { id: 'Jawaban', en: 'Answer', hi: 'उत्तर' },
    { id: 'Soal', en: 'Question', hi: 'प्रश्न' },
    { id: 'Ujian', en: 'Exam', hi: 'परीक्षा' },
    { id: 'Kuis', en: 'Quiz', hi: 'प्रश्नोत्तरी' },
    { id: 'Asesmen', en: 'Assessment', hi: 'मूल्यांकन' },
    { id: 'Remedial', en: 'Remedial', hi: 'उपचारात्मक' },
    { id: 'Miskonsepsi', en: 'Misconception', hi: 'भ्रांति' },
    { id: 'Penguasaan', en: 'Mastery', hi: 'महारत' },
    { id: 'Terkunci', en: 'Locked', hi: 'लॉक' },
    { id: 'Selesai', en: 'Completed', hi: 'पूर्ण' },
    { id: 'Prasyarat', en: 'Prerequisite', hi: 'पूर्वापेक्षा' },
    { id: 'Rujukan', en: 'Reference', hi: 'संदर्भ' },
    { id: 'Sumber', en: 'Source', hi: 'स्रोत' },
    { id: 'Kutipan', en: 'Citation', hi: 'उद्धरण' },
    { id: 'Unggah', en: 'Upload', hi: 'अपलोड' },
    { id: 'Berkas', en: 'File', hi: 'फ़ाइल' },
    { id: 'Dokumen', en: 'Document', hi: 'दस्तावेज़' },
    { id: 'Buku', en: 'Book', hi: 'पुस्तक' },
    { id: 'Halaman', en: 'Page', hi: 'पृष्ठ' },
    { id: 'Hal.', en: 'Page', hi: 'पृष्ठ' },
    { id: 'Bab', en: 'Chapter', hi: 'अध्याय' },
    { id: 'Unit', en: 'Unit', hi: 'इकाई' },
    { id: 'Hari', en: 'Days', hi: 'दिन' },
    { id: 'Menit', en: 'Min', hi: 'मिनट' },
    { id: 'Detik', en: 'Sec', hi: 'सेकंड' },
    { id: 'Bintang', en: 'Stars', hi: 'सितारे' },
    { id: 'Penuh', en: 'Full', hi: 'पूर्ण' },
    { id: 'Benar', en: 'Correct', hi: 'सही' },
    { id: 'Salah', en: 'Wrong', hi: 'गलत' },
    { id: 'Tingkat', en: 'Level', hi: 'स्तर' },
    { id: 'Kesulitan', en: 'Difficulty', hi: 'कठिनाई' },
    { id: 'Dasar', en: 'Fundamental', hi: 'बुनियादी' },
    { id: 'Menengah', en: 'Intermediate', hi: 'मध्यवर्ती' },
    { id: 'Mahir', en: 'Advanced', hi: 'उन्नत' },
    { id: 'Periksa', en: 'Check', hi: 'जांचें' },
    { id: 'Keluar', en: 'Exit', hi: 'बाहर निकलें' },
    { id: 'Tutup', en: 'Close', hi: 'बंद करें' },
    { id: 'Batal', en: 'Cancel', hi: 'रद्द करें' },
    { id: 'Simpan', en: 'Save', hi: 'सहेजें' },
    { id: 'Hapus', en: 'Delete', hi: 'हटाएं' },
    { id: 'Buka', en: 'Open', hi: 'खोलें' },
    { id: 'Lihat', en: 'View', hi: 'देखें' },
    { id: 'Antrian', en: 'Queue', hi: 'कतार' },
    { id: 'Katalog', en: 'Catalog', hi: 'कैटलॉग' },
    { id: 'Sesi', en: 'Session', hi: 'सत्र' },
    { id: 'Mata Kuliah', en: 'Course', hi: 'पाठ्यक्रम' },
    { id: 'Topik', en: 'Topic', hi: 'विषय' }
  ];

  // Regex rules for numeric and dynamic text
  const REGEX_RULES = [
    {
      pattern: /(\d+)\s*Hari\s*Berturut-turut!?/gi,
      en: '$1-Day Streak Active!',
      hi: '$1-दिवसीय लकीर सक्रिय!'
    },
    {
      pattern: /(\d+)\s*Hari/gi,
      en: '$1 Days',
      hi: '$1 दिन'
    },
    {
      pattern: /(\d+)\s*Menit/gi,
      en: '$1 Min',
      hi: '$1 मिनट'
    },
    {
      pattern: /(\d+)\s*Penuh/gi,
      en: '$1 Full',
      hi: '$1 पूर्ण'
    },
    {
      pattern: /Soal\s*(\d+)\s*dari\s*(\d+)/gi,
      en: 'Question $1 of $2',
      hi: 'प्रश्न $1 का $2'
    },
    {
      pattern: /(\d+)\s*Soal/gi,
      en: '$1 Questions',
      hi: '$1 प्रश्न'
    },
    {
      pattern: /Hal(?:aman)?\.\s*(\d+)/gi,
      en: 'Page $1',
      hi: 'पृष्ठ $1'
    },
    {
      pattern: /Menit\s*(\d+:\d+)/gi,
      en: 'Minute $1',
      hi: 'मिनट $1'
    },
    {
      pattern: /Unit\s*(\d+)\s*·\s*Selesai/gi,
      en: 'Unit $1 · Completed',
      hi: 'इकाई $1 · पूर्ण'
    },
    {
      pattern: /Unit\s*(\d+)\s*·\s*Sedang Dipelajari/gi,
      en: 'Unit $1 · In Progress',
      hi: 'इकाई $1 · प्रगति पर'
    },
    {
      pattern: /(\d+)%\s*Mastery\s*·\s*Mahir/gi,
      en: '$1% Mastery · Mastered ⭐',
      hi: '$1% महारत · माहिर ⭐'
    },
    {
      pattern: /(\d+)%\s*Mastery\s*·\s*Butuh Remedial/gi,
      en: '$1% Mastery · Needs Remedial ⚠️',
      hi: '$1% महारत · सुधार आवश्यक ⚠️'
    },
    {
      pattern: /(\d+)\s*Topik Terindeks/gi,
      en: '$1 Indexed Topics',
      hi: '$1 अनुक्रमित विषय'
    },
    {
      pattern: /(\d+)\s*Sesi Terunggah/gi,
      en: '$1 Sessions Uploaded',
      hi: '$1 सत्र अपलोड किए गए'
    },
    {
      pattern: /(\d+)\s*Dokumen/gi,
      en: '$1 Documents',
      hi: '$1 दस्तावेज'
    },
    {
      pattern: /(\d+)\s*Slide/gi,
      en: '$1 Slides',
      hi: '$1 स्लाइड'
    },
    {
      pattern: /(\d+)\s*Simpul Konsep/gi,
      en: '$1 Concept Nodes',
      hi: '$1 अवधारणा नोड्स'
    },
    {
      pattern: /(\d+)\s*Berkas Siap Di-ingest/gi,
      en: '$1 Files Ready to Ingest',
      hi: '$1 फाइलें अंतर्ग्रहण के लिए तैयार'
    },
    {
      pattern: /(\d+)\s*Ekstraksi Gambar/gi,
      en: '$1 Image Extractions',
      hi: '$1 छवि निष्कर्षण'
    },
    {
      pattern: /BKT Tracer:\s*Online\s*\(Avg:\s*(\d+)%\)/gi,
      en: 'BKT Tracer: Online (Avg: $1%)',
      hi: 'BKT अनुरेखक: ऑनलाइन (औसत: $1%)'
    },
    {
      pattern: /DAG:\s*(\d+)\s*Topik\s*\/\s*(\d+)\s*Edges/gi,
      en: 'DAG: $1 Topics / $2 Edges',
      hi: 'DAG: $1 विषय / $2 संबंध'
    },
    {
      pattern: /(\d+)\s*Berkas\s*\((\d+)\s*Unit\)/gi,
      en: '$1 Files ($2 Units)',
      hi: '$1 फ़ाइलें ($2 इकाइयाँ)'
    },
    {
      pattern: /(\d+)\s*Topik\s*Perlu\s*Penguatan/gi,
      en: '$1 Topics Need Reinforcement',
      hi: '$1 विषयों में सुदृढ़ीकरण की आवश्यकता'
    },
    {
      pattern: /Retensi\s*tersisa:\s*(\d+)%/gi,
      en: 'Retention remaining: $1%',
      hi: 'शेष प्रतिधारण: $1%'
    },
    {
      pattern: /Penguasaan:\s*(\d+)%/gi,
      en: 'Mastery: $1%',
      hi: 'महारत: $1%'
    },
    {
      pattern: /Repetisi:\s*([\d.]+)%/gi,
      en: 'Repetition: $1%',
      hi: 'दोहराव: $1%'
    },
    {
      pattern: /Sesi\s*(\d+)\s*\(([^)]+)\)/gi,
      en: 'Session $1 ($2)',
      hi: 'सत्र $1 ($2)'
    },
    {
      pattern: /Sesi\s*(\d+)/gi,
      en: 'Session $1',
      hi: 'सत्र $1'
    },
    {
      pattern: /TOPIC\s*#0*1\s*·\s*FONDASI/gi,
      en: 'TOPIC #01 · FOUNDATION',
      hi: 'विषय #01 · आधार'
    },
    {
      pattern: /TOPIC\s*#(\d+)\s*·\s*FONDASI/gi,
      en: 'TOPIC #$1 · FOUNDATION',
      hi: 'विषय #$1 · आधार'
    },
    {
      pattern: /TOPIC\s*#(\d+)\s*·\s*PRASYARAT/gi,
      en: 'TOPIC #$1 · PREREQUISITE',
      hi: 'विषय #$1 · पूर्वापेक्षा'
    },
    {
      pattern: /TOPIC\s*#(\d+)\s*·\s*REMEDIAL/gi,
      en: 'TOPIC #$1 · REMEDIAL',
      hi: 'विषय #$1 · उपचारात्मक'
    },
    {
      pattern: /UNIT\s*PRASYARAT\s*\(TOPIK\s*#(\d+)\)/gi,
      en: 'PREREQUISITE UNIT (TOPIC #$1)',
      hi: 'पूर्वापेक्षा इकाई (विषय #$1)'
    },
    {
      pattern: /Estimasi\s*Penguasaan\s*Siswa\s*Saat\s*Ini\s*\((\d+)\s*Topik\s*Resmi\)/gi,
      en: 'Current Student Mastery Estimates ($1 Official Topics)',
      hi: 'वर्तमान छात्र महारत अनुमान ($1 आधिकारिक विषय)'
    },
    {
      pattern: /Rata-rata\s*penguasaan\s*kognitif:\s*(\d+)%\s*across\s*(\d+)\s*topik\./gi,
      en: 'Average cognitive mastery: $1% across $2 topics.',
      hi: 'औसत संज्ञानात्मक महारत: $2 विषयों में $1%।'
    },
    {
      pattern: /🔗\s*Fondasi\s*Utama\s*·\s*Membuka:\s*(.+)/gi,
      en: '🔗 Main Foundation · Unlocks: $1',
      hi: '🔗 मुख्य आधार · अनलॉक करता है: $1'
    },
    {
      pattern: /🔗\s*Prasyarat:\s*(.+?)\s*·\s*Membuka:\s*(.+)/gi,
      en: '🔗 Prerequisite: $1 · Unlocks: $2',
      hi: '🔗 पूर्वापेक्षा: $1 · अनलॉक करता है: $2'
    },
    {
      pattern: /Prasyarat:\s*(.+)/gi,
      en: 'Prerequisite: $1',
      hi: 'पूर्वापेक्षा: $1'
    },
    {
      pattern: /Buku\s*Teks\s*Hal\.\s*(\d+)/gi,
      en: 'Textbook Page $1',
      hi: 'पाठ्यपुस्तक पृष्ठ $1'
    },
    {
      pattern: /Slide\s*Presentasi\s*#(\d+)/gi,
      en: 'Presentation Slide #$1',
      hi: 'प्रस्तुति स्लाइड #$1'
    },
    {
      pattern: /Video\s*Kuliah\s*Sesi\s*\(Menit\s*([\d:.]+)\)/gi,
      en: 'Lecture Video Session (Min $1)',
      hi: 'व्याख्यान वीडियो सत्र (मिनट $1)'
    },
    {
      pattern: /Buku\s*Hal\.\s*(\d+)/gi,
      en: 'Book Page $1',
      hi: 'पुस्तक पृष्ठ $1'
    },
    {
      pattern: /Video\s*Menit\s*([\d:.]+)/gi,
      en: 'Video Min $1',
      hi: 'वीडियो मिनट $1'
    },
    {
      pattern: /Slide\s*#(\d+)/gi,
      en: 'Slide #$1',
      hi: 'स्लाइड #$1'
    }
  ];

  // =========================================================================
  // CORE TRANSLATE STRING
  // =========================================================================
  function translateString(text, targetLang) {
    if (!text || typeof text !== 'string') return text;
    const trimmed = text.trim();
    if (!trimmed) return text;

    // 1. Exact match on raw trimmed
    if (DICTIONARY[trimmed]) {
      if (targetLang === 'id' && DICTIONARY[trimmed].id) {
        const lead = text.match(/^\s*/)[0];
        const trail = text.match(/\s*$/)[0];
        return lead + DICTIONARY[trimmed].id + trail;
      }
      if (DICTIONARY[trimmed][targetLang]) {
        const lead = text.match(/^\s*/)[0];
        const trail = text.match(/\s*$/)[0];
        return lead + DICTIONARY[trimmed][targetLang] + trail;
      }
    }

    if (targetLang === 'id') return text; // Indonesian is pristine base

    // 2. Extract quotes & emojis
    let working = trimmed;
    let leadQuote = '', trailQuote = '';
    if (/^["'“”«»]/.test(working)) {
      leadQuote = working[0];
      working = working.slice(1);
    }
    if (/["'“”«»]$/.test(working)) {
      trailQuote = working.slice(-1);
      working = working.slice(0, -1);
    }

    let prefix = '';
    const preMatch = working.match(EMOJI_PREFIX_REGEX);
    if (preMatch) {
      prefix = preMatch[0];
      working = working.slice(prefix.length).trim();
    }

    let suffix = '';
    const sufMatch = working.match(EMOJI_SUFFIX_REGEX);
    if (sufMatch) {
      suffix = sufMatch[0];
      working = working.slice(0, working.length - suffix.length).trim();
    }

    // Check dictionary on cleaned core text
    if (DICTIONARY[working] && DICTIONARY[working][targetLang]) {
      const lead = text.match(/^\s*/)[0];
      const trail = text.match(/\s*$/)[0];
      return lead + leadQuote + prefix + DICTIONARY[working][targetLang] + suffix + trailQuote + trail;
    }

    // 3. Multi-word phrase replacements
    let result = working;
    for (const key of SORTED_KEYS) {
      if (result.includes(key)) {
        result = result.split(key).join(DICTIONARY[key][targetLang]);
      }
    }

    // 4. Regex rules (safely resetting lastIndex for global patterns)
    for (const rule of REGEX_RULES) {
      rule.pattern.lastIndex = 0;
      result = result.replace(rule.pattern, rule[targetLang]);
      rule.pattern.lastIndex = 0;
    }

    // 5. Vocabulary substitutions
    for (const word of VOCAB_MAP) {
      if (result.toLowerCase().includes(word.id.toLowerCase())) {
        const regex = new RegExp(`\\b${word.id}\\b`, 'gi');
        result = result.replace(regex, word[targetLang]);
      }
    }

    const lead = text.match(/^\s*/)[0];
    const trail = text.match(/\s*$/)[0];
    return lead + leadQuote + prefix + result + suffix + trailQuote + trail;
  }

  // =========================================================================
  // UNIVERSAL DOM TREE WALKER
  // Caches pristine original Indonesian text on node._omniOrigText
  // =========================================================================
  function walkAndTranslate(rootNode, targetLang) {
    if (!rootNode) return;

    // 1. Walk all TextNodes
    const walker = document.createTreeWalker(
      rootNode,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node || !node.parentElement) return NodeFilter.FILTER_REJECT;
          const tag = node.parentElement.tagName;
          if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'CODE') {
            return NodeFilter.FILTER_REJECT;
          }
          if (node.parentElement.classList && node.parentElement.classList.contains('no-translate')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let textNode;
    while ((textNode = walker.nextNode())) {
      if (textNode._omniOrigText === undefined) {
        textNode._omniOrigText = textNode.nodeValue;
      }
      const orig = textNode._omniOrigText;
      if (!orig || !orig.trim()) continue;

      if (targetLang === 'id') {
        textNode.nodeValue = orig;
      } else {
        textNode.nodeValue = translateString(orig, targetLang);
      }
    }

    // 2. Translate element attributes: placeholder, title, option values
    const queryRoot = rootNode.querySelectorAll ? rootNode : document;
    const elements = queryRoot.querySelectorAll ? queryRoot.querySelectorAll('*') : [];

    elements.forEach((el) => {
      // Placeholders
      if (el.hasAttribute('placeholder')) {
        if (el._omniOrigPlace === undefined) {
          el._omniOrigPlace = el.getAttribute('placeholder');
        }
        if (targetLang === 'id') {
          el.setAttribute('placeholder', el._omniOrigPlace);
        } else {
          el.setAttribute('placeholder', translateString(el._omniOrigPlace, targetLang));
        }
      }

      // Titles / Tooltips
      if (el.hasAttribute('title')) {
        if (el._omniOrigTitle === undefined) {
          el._omniOrigTitle = el.getAttribute('title');
        }
        if (targetLang === 'id') {
          el.setAttribute('title', el._omniOrigTitle);
        } else {
          el.setAttribute('title', translateString(el._omniOrigTitle, targetLang));
        }
      }

      // Select Options text
      if (el.tagName === 'OPTION') {
        if (el._omniOrigText === undefined) {
          el._omniOrigText = el.textContent;
        }
        if (targetLang === 'id') {
          el.textContent = el._omniOrigText;
        } else {
          el.textContent = translateString(el._omniOrigText, targetLang);
        }
      }
    });
  }

  // =========================================================================
  // GOOGLE TRANSLATE ENGINE TRIGGER
  // =========================================================================
  function triggerGoogleTranslate(lang) {
    try {
      const target = lang === 'id' ? '/id/id' : `/id/${lang}`;
      document.cookie = `googtrans=${target}; path=/;`;
      if (window.location.hostname) {
        document.cookie = `googtrans=${target}; path=/; domain=.${window.location.hostname};`;
        document.cookie = `googtrans=${target}; path=/; domain=${window.location.hostname};`;
      }
      const select = document.querySelector('.goog-te-combo');
      if (select) {
        select.value = lang;
        select.dispatchEvent(new Event('change'));
      }
    } catch (e) {}
  }

  // =========================================================================
  // MUTATION OBSERVER
  // Automatically catches and translates any newly injected dynamic HTML
  // =========================================================================
  let isTranslating = false;
  let domObserver = null;

  function initMutationObserver() {
    if (domObserver || !window.MutationObserver) return;
    domObserver = new MutationObserver((mutations) => {
      if (isTranslating || currentLang === 'id') return;
      isTranslating = true;
      try {
        mutations.forEach((m) => {
          if (m.type === 'childList') {
            m.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // Do not translate the flag button itself
                if (node.id === 'sidebarLangToggleBtn' || (node.closest && node.closest('#sidebarLangToggleBtn'))) {
                  return;
                }
                walkAndTranslate(node, currentLang);
              }
            });
          }
        });
      } catch (e) {
        console.warn('i18n observer error:', e);
      } finally {
        isTranslating = false;
      }
    });

    if (document.body) {
      domObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

  // =========================================================================
  // PUBLIC CONTROLLER METHODS
  // =========================================================================
  function getCurrentLanguage() {
    return currentLang;
  }

  function getLanguageConfig() {
    return LANG_CONFIG[currentLang] || LANG_CONFIG.en;
  }

  function applyLanguageToDOM() {
    const config = getLanguageConfig();
    document.documentElement.lang = currentLang;

    // 1. Update Language Switcher Button in Sidebar
    const flagEl = document.getElementById('langFlagIcon');
    const textEl = document.getElementById('langSwitchText');
    const subEl = document.getElementById('langSwitchSub');
    const badgeEl = document.getElementById('langBadgeCode');
    const btnEl = document.getElementById('sidebarLangToggleBtn');

    if (flagEl) flagEl.textContent = config.flag;
    if (textEl) textEl.textContent = config.name;
    if (subEl) subEl.textContent = config.sub;
    if (badgeEl) badgeEl.textContent = config.badge;
    if (btnEl) {
      btnEl.title = `Switch Language (Current: ${config.name} ${config.flag})`;
    }

    // 2. Update role switch text in sidebar
    const roleTextEl = document.getElementById('roleSwitchText');
    const roleIconEl = document.getElementById('roleSwitchIcon');
    if (roleTextEl) {
      const isLecturer = (document.body && document.body.classList && document.body.classList.contains('role-lecturer')) || (window.currentAppRole === 'lecturer');
      const textId = isLecturer ? 'Mode Mahasiswa' : 'Mode Dosen';
      roleTextEl._omniOrigText = textId;
      roleTextEl.textContent = currentLang === 'id' ? textId : (currentLang === 'hi' ? (isLecturer ? 'छात्र मोड' : 'शिक्षक मोड') : (isLecturer ? 'Student Mode' : 'Lecturer Mode'));
      if (roleIconEl) {
        roleIconEl.textContent = isLecturer ? '🎓' : '👨‍🏫';
      }
    }

    // 3. Perform universal DOM walk over body
    isTranslating = true;
    try {
      walkAndTranslate(document.body, currentLang);
    } catch (e) {
      console.warn('walkAndTranslate error:', e);
    } finally {
      isTranslating = false;
    }

    // 4. Trigger Google Translate Element engine
    triggerGoogleTranslate(currentLang);
  }

  function setLanguage(lang) {
    if (!LANGUAGES.includes(lang)) return;
    currentLang = lang;
    try {
      localStorage.setItem('omnitutor_lang', lang);
    } catch (e) {}

    // Apply translation to entire DOM
    applyLanguageToDOM();

    // Broadcast event for dynamic app logic in app.js
    if (typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('omnitutor:languageChanged', { detail: { lang: currentLang } }));
    }
  }

  function toggleLanguage() {
    const currentIdx = LANGUAGES.indexOf(currentLang);
    const nextIdx = (currentIdx + 1) % LANGUAGES.length;
    const nextLang = LANGUAGES[nextIdx];
    setLanguage(nextLang);
  }

  function t(keyOrSentence, fallback) {
    if (!keyOrSentence) return fallback || '';
    if (DICTIONARY[keyOrSentence]) {
      if (currentLang === 'id') {
        return DICTIONARY[keyOrSentence].id || fallback || keyOrSentence;
      }
      if (DICTIONARY[keyOrSentence][currentLang]) {
        return DICTIONARY[keyOrSentence][currentLang];
      }
    }
    if (currentLang === 'id') return fallback || keyOrSentence;
    return translateString(keyOrSentence, currentLang) || fallback || keyOrSentence;
  }

  window.I18N = {
    LANGUAGES,
    LANG_CONFIG,
    DICTIONARY,
    t,
    getCurrentLanguage,
    getLanguageConfig,
    setLanguage,
    toggleLanguage,
    applyLanguageToDOM,
    walkAndTranslate,
    triggerGoogleTranslate
  };

  // Global shorthands
  window.toggleLanguage = toggleLanguage;
  window.setLanguage = setLanguage;
  window.t = t;

  document.addEventListener('DOMContentLoaded', () => {
    initMutationObserver();
    setTimeout(() => {
      applyLanguageToDOM();
    }, 20);
  });
})(window);
