# OmniTutor AI

OmniTutor AI is a multimodal study companion that unifies lecture videos, textbooks, and presentation slides into a source-cited knowledge base with personalized tutoring and adaptive assessments.

---

## 1. Project Description

### What We Built
OmniTutor AI is an interactive learning companion designed to help students study from fragmented educational resources (PDF documents, video lectures, and slide decks) within a single unified workspace.

### The Problem It Solves
Students often study from multiple disconnected materials: long lecture recordings, dense PDF textbooks, and summary slides. Generic AI chatbots frequently provide answers that are not grounded in the actual course curriculum or do not match what the student already understands.

### How It Works
1. **Multimodal Ingestion:** Ingests PDFs, videos, and presentation slides without manual preprocessing, mapping content to exact pages, timestamps, and slide numbers.
2. **Source-Grounded Socratic Tutor:** Answers student questions using verified citations and strictly flags or declines out-of-scope topics.
3. **Adaptive Assessments:** Generates dynamic quizzes that adjust difficulty using Bayesian Knowledge Tracing (BKT) based on student performance.
4. **Localization:** Provides instant tri-lingual support (English, Hindi, and Indonesian) to assist diverse learners.

---

## 2. Prerequisites & Dependencies

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Groq API Key**: At least one key from [Groq Console](https://console.groq.com/)

### Dependencies
- `vite` (^8.3.0) — Frontend bundler and dev server
- Mozilla `PDF.js` — Client-side PDF text extraction and rendering
- Node.js `http` & `fs` — Built-in server modules for API handling

---

## 3. Setup Instructions

1. **Clone the repository:**
   ```bash
git clone https://github.com/Vallenlaban/omnitutorai.git
cd omnitutorai

   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

   Fill in your Groq API key(s) in `.env`:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_API_KEY_2=your_backup_groq_api_key_here
   ```

---

## 4. Instructions for Running the Project

### Development Mode (Local)
To start the local development server:
```bash
npm run dev
```
Open your browser and visit: `http://localhost:3000`

### Production Mode (Server / Railway / Render)
To build and start the standalone production server:
```bash
npm run build
npm start
```

### Health Check Endpoint
To verify server and AI key connectivity:
```bash
curl http://localhost:3000/api/health
```

---

## 5. AI Tools Disclosure

As required by the submission guidelines, the following AI tools were used during development:

- **Google AI Studio / Build Assistant:** Used for project scaffolding, directory structuring, CSS design assistance, and API proxy routing configuration.
- **Groq Cloud API:** Integrated at runtime to power multimodal document analysis, Socratic tutor responses, and adaptive quiz generation.

All system architecture, prompt engineering, integration logic, and testing were directed and verified by the team.

---

## 6. Demo Video

- **YouTube Demo Link:** [https://youtu.be/kgkXxBvNKas?si=ldIoqOYRsA9WuY4V]  

---

## 7. Team Information

- **Name:** Vallen Salovadore Silaban
- **Devpost Username:** @vallenlabansilaban
- **Role:** Developer (Solo Participation)
