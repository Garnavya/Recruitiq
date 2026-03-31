# RecruitIQ — AI-Powered Recruitment Platform

> Replace resume uploads with a smart, AI-assisted profile builder.

---

## 🚀 Live Demo

Open `frontend/index.html` in your browser. No server needed.

---

## 🔑 Demo Login

| Field    | Value                  |
|----------|------------------------|
| Email    | `hire-me@anshumat.org` |
| Password | `HireMe@2025!`         |

Click **"Log In"** on the onboarding page, then select **"Use demo account"**.

---

## 📁 Project Structure

```
recruitiq/
├── frontend/
│   ├── index.html       ← Landing page (hero, how it works, features)
│   ├── onboarding.html  ← Sign up / Log in page
│   ├── builder.html     ← AI question flow (10–15 questions)
│   ├── preview.html     ← Profile preview + PDF download
│   ├── recruiter.html   ← Recruiter dashboard
│   ├── style.css        ← All shared styles (gradient bg, components)
│   ├── app.js           ← Auth utilities, localStorage helpers, toast
│   └── builder.js       ← Question logic + Gemini API integration
├── backend/             ← Not required (all logic is client-side)
│   └── README.md        ← Explains why no backend is needed
└── README.md            ← This file
```

---

## ⚙️ Setup Instructions

### Step 1 — Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/recruitiq.git
cd recruitiq
```

### Step 2 — Add your Gemini API key

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Open `frontend/builder.js`
3. Replace line 13:
   ```js
   const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
   ```
   with your actual key:
   ```js
   const GEMINI_API_KEY = 'AIzaSy...yourkey...';
   ```

> **Note:** The app works without an API key — AI refinement features are skipped, and a basic summary is generated locally. All other features (questions, PDF export, recruiter dashboard) work fully.

### Step 3 — Open in browser

Simply open `frontend/index.html` in any modern browser. No npm, no build step, no server required.

```bash
# Optional: use VS Code Live Server extension for hot reload
# Or open directly:
open frontend/index.html
```

---

## 🧠 Approach & Design Decisions

### Problem with Traditional Resumes
- PDF parsing is unreliable and loses formatting
- Candidates spend hours formatting instead of showcasing skills
- Recruiters can't compare candidates fairly from inconsistent PDFs
- Freshers and students are disadvantaged without work experience

### How RecruitIQ Solves This
1. **Guided question flow** — 13 questions, each focused on one thing at a time
2. **Skip logic** — experience, projects, GitHub, etc. can be skipped for freshers
3. **Gemini AI refinement** — raw answers polished into professional language
4. **Structured storage** — all data in a consistent JSON format
5. **Instant PDF** — `html2pdf.js` generates a clean resume from the profile card
6. **Recruiter dashboard** — search, shortlist, compare, take notes

---

## 🛠 Tech Stack & Justification

| Technology | Why |
|------------|-----|
| **Vanilla HTML/CSS/JS** | Zero build complexity; easy to read and understand; no npm required |
| **GSAP 3** | Professional animations (fade-in, slide, stagger) via CDN — no install |
| **Gemini API (gemini-1.5-flash)** | Free tier, fast, great at text refinement and summarization |
| **html2pdf.js** | Client-side PDF generation — no server needed, works in browser |
| **localStorage** | Simple auth + data persistence without a backend |
| **Google Fonts (Syne + DM Sans)** | Distinctive, modern — avoids generic look |

No React, no Node, no database. Intentionally beginner-friendly.

---

## 📋 Features Checklist

### Candidate Side
- [x] Landing page with hero + how it works
- [x] Sign up / Log in with role selection
- [x] 13-question AI profile builder
- [x] Skip button on optional questions (experience, projects, GitHub, etc.)
- [x] Gemini AI refines individual answers
- [x] Auto-save progress to localStorage
- [x] Progress bar showing completion %
- [x] AI compiles full profile + generates summary
- [x] Profile preview page
- [x] One-click PDF resume download
- [x] Shareable profile link

### Recruiter Side
- [x] Recruiter dashboard with candidate list
- [x] Search/filter candidates by name, skill, or role
- [x] Full candidate profile view
- [x] Shortlist / un-shortlist candidates
- [x] Side-by-side compare shortlisted candidates
- [x] Recruiter notes (auto-saved)
- [x] Stats bar (total, shortlisted, complete profiles)

---