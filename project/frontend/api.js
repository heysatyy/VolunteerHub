// api.js — Shared API utility for VolunteerHub Frontend
// All pages include this script to talk to the backend

// Use the deployed backend URL if available, otherwise fallback to localhost
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://volunteerhub-9crd.onrender.com/api'; // Replace this after hosting on Render


// ── Token helpers ─────────────────────────────────────────
function getToken()        { return localStorage.getItem('vh_token'); }
function getUser()         { return JSON.parse(localStorage.getItem('vh_user') || 'null'); }
function setAuth(token, user) {
  localStorage.setItem('vh_token', token);
  localStorage.setItem('vh_user', JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem('vh_token');
  localStorage.removeItem('vh_user');
}
function isLoggedIn()      { return !!getToken(); }
function redirectIfGuest() {
  if (!isLoggedIn()) { window.location.href = 'index.html'; }
}
function logout() {
  clearAuth();
  window.location.href = 'index.html';
}

// ── Core fetch wrapper ────────────────────────────────────
// FIX: Only auto-logout on 401 (token expired/invalid).
// 403 means "insufficient role" — return the response so the UI can show an error.
async function api(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  // Only logout on 401 (token invalid/expired), NOT on 403 (role-based access denied)
  if (res.status === 401) {
    clearAuth();
    window.location.href = 'index.html';
    return;
  }
  return { ok: res.ok, status: res.status, data };
}

// ── Auth ──────────────────────────────────────────────────
async function apiLogin(email, password, role) {
  return api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, role })
  });
}
async function apiRegister(payload) {
  return api('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
}

// ── Dashboard ─────────────────────────────────────────────
async function apiDashboard()    { return api('/dashboard/summary'); }

// ── Volunteers ────────────────────────────────────────────
async function apiGetVolunteers(params = {}) {
  const q = new URLSearchParams(params).toString();
  return api('/volunteers' + (q ? '?' + q : ''));
}
async function apiAddVolunteer(payload) {
  // Register user first, then volunteer profile is auto-created
  return api('/auth/register', { method: 'POST', body: JSON.stringify({ ...payload, role: 'volunteer' }) });
}
async function apiUpdateVolunteer(id, payload) {
  return api('/volunteers/' + id, { method: 'PUT', body: JSON.stringify(payload) });
}
async function apiDeleteVolunteer(id) {
  return api('/volunteers/' + id, { method: 'DELETE' });
}

// ── Donations ─────────────────────────────────────────────
async function apiGetDonations(params = {}) {
  const q = new URLSearchParams(params).toString();
  return api('/donations' + (q ? '?' + q : ''));
}
async function apiGetDonationStats() { return api('/donations/stats'); }
async function apiAddDonation(payload) {
  return api('/donations', { method: 'POST', body: JSON.stringify(payload) });
}
async function apiUpdateDonation(id, payload) {
  return api('/donations/' + id, { method: 'PUT', body: JSON.stringify(payload) });
}

// ── Events ────────────────────────────────────────────────
async function apiGetEvents()  { return api('/events'); }
async function apiAddEvent(payload) {
  return api('/events', { method: 'POST', body: JSON.stringify(payload) });
}

// ── Fund Allocations ──────────────────────────────────────
async function apiGetAllocations() { return api('/allocations'); }
async function apiGetAllocationSummary() { return api('/allocations/summary'); }
async function apiAddAllocation(payload) {
  return api('/allocations', { method: 'POST', body: JSON.stringify(payload) });
}
