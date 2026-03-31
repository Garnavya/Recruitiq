/* ============================================================
   app.js — RecruitIQ Shared Utilities
   This file is included on every page. It handles:
   - localStorage-based "authentication"
   - Demo user seeding
   - Toast notification helper
   - Shared data helpers
   ============================================================ */

// DEMO USER

function seedDemoUser() {
  const users = JSON.parse(localStorage.getItem('riq_users') || '[]');
  const alreadyExists = users.find(u => u.email === 'hire-me@anshumat.org');

  if (!alreadyExists) {
    users.push({
      email: 'hire-me@anshumat.org',
      password: 'HireMe@2025!',
      name: 'Demo Candidate',
      role: 'candidate',
      profileData: null,   // filled after builder
      shortlisted: false,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('riq_users', JSON.stringify(users));
    console.log('[RecruitIQ] Demo user seeded ✅');
  }
}

// AUTH HELPERS
// Save a new user to localStorage
function registerUser(name, email, password, role) {
  const users = JSON.parse(localStorage.getItem('riq_users') || '[]');

  // Check if email already exists
  if (users.find(u => u.email === email)) {
    return { ok: false, msg: 'Email already registered.' };
  }

  users.push({ name, email, password, role, profileData: null, shortlisted: false, createdAt: new Date().toISOString() });
  localStorage.setItem('riq_users', JSON.stringify(users));
  return { ok: true };
}

// Log in — just checks email+password against localStorage
function loginUser(email, password) {
  const users = JSON.parse(localStorage.getItem('riq_users') || '[]');
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return { ok: false, msg: 'Invalid email or password.' };

  // Store "session" — just save logged-in email
  localStorage.setItem('riq_session', email);
  return { ok: true, user };
}

// Get the currently logged-in user object
function getCurrentUser() {
  const email = localStorage.getItem('riq_session');
  if (!email) return null;
  const users = JSON.parse(localStorage.getItem('riq_users') || '[]');
  return users.find(u => u.email === email) || null;
}

// Log out
function logoutUser() {
  localStorage.removeItem('riq_session');
  window.location.href = 'index.html';
}

// Update a user's data (e.g. save their profile after builder)
function updateUser(email, updates) {
  const users = JSON.parse(localStorage.getItem('riq_users') || '[]');
  const idx = users.findIndex(u => u.email === email);
  if (idx === -1) return;
  users[idx] = { ...users[idx], ...updates };
  localStorage.setItem('riq_users', JSON.stringify(users));
}

// Get all candidate users (for recruiter view)
function getAllCandidates() {
  const users = JSON.parse(localStorage.getItem('riq_users') || '[]');
  return users.filter(u => u.role === 'candidate');
}

// TOAST NOTIFICATIONS
// Call showToast("Message") from anywhere to show a popup toast
function showToast(msg, duration = 3000) {
  // Create toast div if it doesn't exist yet
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// AUTO-SAVE INDICATOR
// Debounced auto-save — waits 1.5s after last input before saving
let autoSaveTimer = null;
function triggerAutoSave(dataObj, userEmail) {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    updateUser(userEmail, { profileData: dataObj, lastSaved: new Date().toISOString() });
    showToast('✓ Profile auto-saved');
  }, 1500);
}

// RUN ON EVERY PAGE LOAD
// Seed demo user as soon as any page loads
seedDemoUser();
