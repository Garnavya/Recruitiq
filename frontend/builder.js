/* ============================================================
   builder.js — AI Profile Builder Logic
   This file powers the question-by-question profile builder.
   It handles:
   - The list of all questions (which ones are skippable)
   - Moving forward/backward through questions
   - Collecting answers into a profileData object
   - Calling the Gemini API to refine/summarize answers
   - Auto-saving progress to localStorage
   - Passing finished data to preview.html
   ============================================================ */

// ── GEMINI API KEY ───────────────────────────────────────
const GEMINI_API_KEY = 'AIzaSyAUTrmsiE8yBmnmfBwDqSgOUGkDM_DD9zY';

// Gemini API endpoint — using gemini-1.5-flash (fast & free tier)
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// ── QUESTIONS DEFINITION ──────────────────────────────────────
// Each question has:
//   id      — unique key, stored in profileData
//   q       — the question text shown to the user
//   hint    — placeholder/hint text inside the textarea
//   type    — 'text' (textarea) or 'select' (dropdown) or 'tags' (comma-separated)
//   skippable — if true, a "Skip" button appears
//   skipLabel — custom skip button label
//   options — only for type:'select', the dropdown choices
//   aiRefine — if true, we send the answer to Gemini to polish it

const QUESTIONS = [
  {
    id: 'full_name',
    q: "What's your full name?",
    hint: 'e.g. Rahul Sharma',
    type: 'text',
    skippable: false,   // can't skip — required
    aiRefine: false
  },

  {
    id: 'target_role',
    q: "What kind of role are you looking for?",
    hint: 'e.g. Frontend Developer, Data Analyst, UI/UX Designer...',
    type: 'text',
    skippable: false,
    aiRefine: false
  },

  {
    id: 'education',
    q: "Tell me about your education.",
    hint: 'e.g. B.Tech CSE, 2nd year, XYZ University. CGPA: 8.2',
    type: 'text',
    skippable: false,
    aiRefine: true    // Gemini will clean this up into professional language
  },

  {
    id: 'skills',
    q: "What are your top technical skills?",
    hint: 'e.g. HTML, CSS, JavaScript, Python, React, Figma — list as many as you like',
    type: 'tags',     // user types comma-separated tags
    skippable: false,
    aiRefine: false
  },

  {
    id: 'soft_skills',
    q: "What soft skills would you say you have?",
    hint: 'e.g. teamwork, communication, problem solving, time management...',
    type: 'text',
    skippable: true,
    skipLabel: "Skip soft skills",
    aiRefine: false
  },

  {
    id: 'experience',
    q: "Have you done any internships or jobs? Tell me about them.",
    hint: 'e.g. Frontend intern at XYZ for 2 months — worked on React dashboards. Or type "None yet"',
    type: 'text',
    skippable: true,   // fresher? skip!
    skipLabel: "No experience yet — skip",
    aiRefine: true    // Gemini rewrites this as clean bullet points
  },
   
  {
    id: 'projects',
    q: "Describe your best project or personal work.",
    hint: 'e.g. Built a weather app using React + OpenWeather API. Hosted on Vercel. What did it do? What did you learn?',
    type: 'text',
    skippable: true,
    skipLabel: "Skip projects for now",
    aiRefine: true   // Gemini structures this into a proper project description
  },

  {
    id: 'github_link',
    q: "Drop your GitHub or portfolio link (if you have one).",
    hint: 'e.g. github.com/yourusername or yourportfolio.vercel.app',
    type: 'text',
    skippable: true,
    skipLabel: "I don't have one yet"
  },

  {
    id: 'achievements',
    q: "Any achievements, certifications, or hackathons worth mentioning?",
    hint: 'e.g. Won college hackathon 2024 · Google UX Design Certificate · LeetCode 150+ problems solved',
    type: 'text',
    skippable: true,
    skipLabel: "Nothing to add yet",
    aiRefine: true
  },

  {
    id: 'languages',
    q: "Which languages do you speak?",
    hint: 'e.g. English (fluent), Hindi (native)',
    type: 'text',
    skippable: true,
    skipLabel: "Skip languages"
  },

  {
    id: 'availability',
    q: "When are you available to start, and what are you open to?",
    hint: '',
    type: 'select',
    skippable: false,
    options: [
      'Immediately available',
      'Available in 1 month',
      'Available in 2–3 months',
      'Looking for part-time / remote only',
      'Open to internships only'
    ]
  },

  {
    id: 'location',
    q: "Where are you based? (City, State)",
    hint: 'e.g. Lucknow, Uttar Pradesh',
    type: 'text',
    skippable: true,
    skipLabel: "Prefer not to say"
  },

  {
    id: 'about_yourself',
    q: "In 2–3 sentences, how would you describe yourself professionally?",
    hint: 'e.g. I\'m a passionate frontend developer who loves turning ideas into clean web experiences. I\'m actively learning React and building side projects.',
    type: 'text',
    skippable: false,
    aiRefine: true   // This becomes the profile summary — Gemini makes it shine
  }
];

// ── STATE VARIABLES ───────────────────────────────────────────
let currentQ = 0;                // index of which question we're on
let profileData = {};            // stores all answers as { question_id: answer }
let currentUser = null;          // logged-in user object

// INIT
// Run when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in — if not, send to login page
  currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = 'onboarding.html';
    return;
  }

  // If user already has partial/complete profile data, load it
  if (currentUser.profileData) {
    profileData = currentUser.profileData;
  }

  // Pre-fill name if we know it from signup
  if (currentUser.name && !profileData.full_name) {
    profileData.full_name = currentUser.name;
    // Skip Q0 (name) if name already known
    currentQ = 1;
  }

  renderQuestion();
  updateProgress();
});

// RENDER QUESTION
// Shows the current question on screen
function renderQuestion() {
  const q = QUESTIONS[currentQ];
  const container = document.getElementById('q-container');
  const existing = profileData[q.id]; // pre-fill if answer exists

  // Build the input HTML depending on question type
  let inputHTML = '';

  if (q.type === 'select') {
    // Dropdown select
    inputHTML = `<select class="input" id="q-input">
      <option value="" disabled ${!existing ? 'selected' : ''}>Choose one...</option>
      ${q.options.map(opt =>
        `<option value="${opt}" ${existing === opt ? 'selected' : ''}>${opt}</option>`
      ).join('')}
    </select>`;

  } else if (q.type === 'tags') {
    // Tags — just a text input, user separates with commas
    inputHTML = `
      <input type="text" class="input" id="q-input"
        placeholder="${q.hint}"
        value="${existing || ''}" />
      <p style="font-size:0.78rem; color:var(--text-muted); margin-top:6px;">
        Separate with commas — e.g. HTML, CSS, JS
      </p>`;
  } else {
    // Regular textarea
    inputHTML = `<textarea class="input" id="q-input" rows="4"
      placeholder="${q.hint}">${existing || ''}</textarea>`;
  }

  // Render the full question card
  container.innerHTML = `
    <div class="q-card" id="q-card">
      <!-- Question number badge -->
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
        <span class="badge">Question ${currentQ + 1} of ${QUESTIONS.length}</span>
        ${q.skippable ? '<span class="badge badge-purple">Optional</span>' : ''}
      </div>

      <!-- Question text -->
      <h2 class="q-text">${q.q}</h2>

      <!-- Input area -->
      <div class="form-group" style="margin-top:24px;">
        ${inputHTML}
      </div>

      <!-- AI suggestion area — shown after Gemini refines an answer -->
      <div class="ai-suggestion" id="ai-suggestion" style="display:none;"></div>

      <!-- Buttons row -->
      <div class="q-buttons">
        ${currentQ > 0
          ? '<button class="btn btn-ghost" onclick="goBack()">← Back</button>'
          : '<div></div>'
        }
        <div style="display:flex; gap:12px;">
          ${q.skippable
            ? `<button class="btn btn-ghost" onclick="skipQuestion()">
                 ${q.skipLabel || 'Skip'}
               </button>`
            : ''
          }
          <button class="btn btn-primary" onclick="nextQuestion()" id="btn-next">
            ${currentQ === QUESTIONS.length - 1 ? 'Build My Profile ✨' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  `;

  // GSAP: animate the card sliding in from the right
  if (typeof gsap !== 'undefined') {
    gsap.from('#q-card', {
      x: 40, opacity: 0, duration: 0.45, ease: 'power2.out'
    });
  }

  // Auto-focus the input for keyboard users
  setTimeout(() => {
    const inp = document.getElementById('q-input');
    if (inp && q.type !== 'select') inp.focus();
  }, 100);
}

// NEXT QUESTION
async function nextQuestion() {
  const q = QUESTIONS[currentQ];
  const inputEl = document.getElementById('q-input');
  const answer = inputEl ? inputEl.value.trim() : '';

  // Validate — required questions can't be empty
  if (!q.skippable && !answer) {
    // Shake the input to signal error
    if (typeof gsap !== 'undefined') {
      gsap.to('#q-input', { x: [-8, 8, -6, 6, 0], duration: 0.3 });
    }
    showToast('⚠ This question is required');
    return;
  }

  // Save the answer
  profileData[q.id] = answer;

  // If this question has aiRefine: true, send to Gemini to polish
  // But only if the answer is non-empty (don't refine skipped answers)
  if (q.aiRefine && answer) {
    await refineWithGemini(q.id, q.q, answer);
  }

  // Auto-save to localStorage
  triggerAutoSave(profileData, currentUser.email);

  // If this was the last question, compile and go to preview
  if (currentQ === QUESTIONS.length - 1) {
    await compileFullProfile();
    return;
  }

  // Go to next question
  currentQ++;
  renderQuestion();
  updateProgress();
}

// SKIP QUESTION
function skipQuestion() {
  profileData[QUESTIONS[currentQ].id] = ''; // store empty string for skipped
  currentQ++;
  renderQuestion();
  updateProgress();
  showToast('Question skipped');
}

// GO BACK
function goBack() {
  if (currentQ > 0) {
    currentQ--;
    renderQuestion();
    updateProgress();
  }
}

// UPDATE PROGRESS BAR
function updateProgress() {
  const pct = Math.round((currentQ / QUESTIONS.length) * 100);
  const fill = document.getElementById('progress-fill');
  const label = document.getElementById('progress-label');
  if (fill)  fill.style.width = pct + '%';
  if (label) label.textContent = pct + '% complete';
}

// GEMINI: REFINE A SINGLE ANSWER
// Sends one answer to Gemini and gets a polished version back
async function refineWithGemini(fieldId, question, rawAnswer) {
  // Show AI thinking indicator
  const suggestEl = document.getElementById('ai-suggestion');
  if (!suggestEl) return;

  suggestEl.style.display = 'block';
  suggestEl.innerHTML = `
    <div class="ai-thinking">
      <span>✦ AI is refining your answer</span>
      <div class="dot"></div><div class="dot"></div><div class="dot"></div>
    </div>`;

  // If no API key is set, show a placeholder message and skip
  if (GEMINI_API_KEY === 'AIzaSyAUTrmsiE8yBmnmfBwDqSgOUGkDM_DD9zY') {
    setTimeout(() => {
      suggestEl.innerHTML = `<div class="ai-tip">
        🔑 Add your Gemini API key in builder.js to enable AI refinement.
      </div>`;
    }, 800);
    return;
  }

  try {
    // Build the prompt — we tell Gemini exactly what we want
    const prompt = `You are a professional resume writer helping a student / fresher.
The candidate answered this question: "${question}"
Their answer: "${rawAnswer}"

Rewrite their answer in 1-3 clean, professional bullet points suitable for a resume.
Be concise. Keep their intent. Don't invent facts. Output ONLY the bullet points, nothing else.`;

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    // Extract the text from Gemini's response structure
    const refined = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

    if (refined) {
      // Save the AI-refined version over the raw answer
      profileData[fieldId + '_refined'] = refined;

      // Show it as a suggestion card
      suggestEl.innerHTML = `
        <div class="ai-tip">
          <div style="color:var(--accent); font-size:0.8rem; margin-bottom:6px;">✦ AI improved this</div>
          <div style="font-size:0.88rem; white-space:pre-wrap; color:var(--text);">${refined}</div>
          <button class="btn btn-sm btn-ghost" style="margin-top:10px;" onclick="useRefined('${fieldId}')">
            Use this version
          </button>
        </div>`;
    }

  } catch (err) {
    console.error('Gemini API error:', err);
    suggestEl.innerHTML = `<div class="ai-tip" style="color:var(--text-muted); font-size:0.82rem;">
      Could not connect to AI — your original answer is saved.
    </div>`;
  }
}

// USE REFINED ANSWER
// User clicks "Use this version" to apply Gemini's polished text
function useRefined(fieldId) {
  const refined = profileData[fieldId + '_refined'];
  if (refined) {
    profileData[fieldId] = refined;
    const inputEl = document.getElementById('q-input');
    if (inputEl) inputEl.value = refined;
    document.getElementById('ai-suggestion').innerHTML = `
      <div class="ai-tip" style="color:#34d399; font-size:0.82rem;">✓ AI version applied</div>`;
  }
}

// COMPILE FULL PROFILE
// After all questions answered, send everything to Gemini to generate a full professional summary + structured data
async function compileFullProfile() {
  const loadEl = document.getElementById('compile-overlay');
  if (loadEl) loadEl.style.display = 'flex';

  if (GEMINI_API_KEY !== 'AIzaSyAUTrmsiE8yBmnmfBwDqSgOUGkDM_DD9zY') {
    try {
      // Build a detailed prompt with ALL the collected data
      const prompt = `You are a professional resume writer.
Here is the raw profile data of a job candidate:

Name: ${profileData.full_name || 'N/A'}
Target Role: ${profileData.target_role || 'N/A'}
Education: ${profileData.education || 'N/A'}
Skills: ${profileData.skills || 'N/A'}
Soft Skills: ${profileData.soft_skills || 'N/A'}
Experience: ${profileData.experience || 'None mentioned'}
Projects: ${profileData.projects || 'None mentioned'}
Achievements: ${profileData.achievements || 'None mentioned'}
About Themselves: ${profileData.about_yourself || 'N/A'}

Generate a professional profile summary in 3-4 sentences. Then suggest 3 roles that suit this candidate.
Return your response in this exact JSON format (no markdown, no backticks):
{
  "summary": "...",
  "suggested_roles": ["Role 1", "Role 2", "Role 3"],
  "profile_score": 75
}
The profile_score is 0-100 based on completeness and quality.`;

      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

      // Strip any accidental markdown backticks before parsing
      const cleanText = rawText.replace(/```json|```/g, '').trim();

      try {
        const aiResult = JSON.parse(cleanText);
        profileData.ai_summary       = aiResult.summary;
        profileData.suggested_roles  = aiResult.suggested_roles;
        profileData.profile_score    = aiResult.profile_score;
      } catch (e) {
        // If JSON parse fails, just store the raw text as summary
        profileData.ai_summary = rawText;
      }

    } catch (err) {
      console.error('Compile error:', err);
      profileData.ai_summary = `${profileData.full_name} is a ${profileData.target_role} candidate with skills in ${profileData.skills}.`;
    }
  } else {
    // No API key — generate a basic summary locally
    profileData.ai_summary = `${profileData.full_name || 'Candidate'} is seeking a ${profileData.target_role || 'tech'} role. Skills: ${profileData.skills || 'various'}. ${profileData.about_yourself || ''}`;
    profileData.profile_score = 70;
  }

  // Save completed profile to localStorage
  updateUser(currentUser.email, { profileData, completedAt: new Date().toISOString() });

  // Redirect to preview page
  window.location.href = 'preview.html';
}
