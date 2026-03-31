# Backend

This project is intentionally fully client-side for simplicity.

## Why no backend?

- All user data is stored in `localStorage` in the browser
- Gemini API is called directly from the frontend (client-side fetch)
- PDF generation happens in the browser via `html2pdf.js`
- No database or server is needed for the demo/assignment scope

## If I wanted to add a real backend later:

- I will Use **Node.js + Express** to serve the frontend files
- Then **MongoDB** or **PostgreSQL** to store users and profiles
- Would also move the Gemini API call to the backend (hides my API key from users)
- And add JWT-based authentication instead of localStorage

## Backend structure (for future):

```
backend/
├── server.js          ← Express server
├── routes/
│   ├── auth.js        ← /api/auth/register, /api/auth/login
│   ├── profile.js     ← /api/profile (GET, POST, PUT)
│   └── recruiter.js   ← /api/candidates (GET), /api/shortlist
├── models/
│   ├── User.js
│   └── Profile.js
└── package.json
```
