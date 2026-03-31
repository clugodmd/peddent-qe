/**
 * sessionService.js
 * Spotify-style concurrent session management (max 3 active sessions).
 *
 * Flow:
 *  - On login: generate a session UUID, write to users/{uid}/sessions/{sessionId}
 *  - Store the sessionId in localStorage (persists across tabs/closes)
 *  - If user already has 3 sessions, delete the oldest (by lastSeen)
 *  - On every page load: update lastSeen timestamp (refreshSession)
 *  - Real-time listener detects if current session is deleted (bumped or admin kick)
 *  - Admin can revoke all sessions for a user or invalidate a specific one
 */

import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';

const SESSION_KEY = 'peddent_session_id';
const MAX_SESSIONS = 3;

// ─── helpers ─────────────────────────────────────────────────────────────────

function generateSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getDeviceInfo() {
  const ua = navigator.userAgent || '';
  // Extract browser + OS in a human-readable string
  let browser = 'Unknown';
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';

  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';

  return `${browser} on ${os}`;
}

export function getLocalSessionId() {
  return localStorage.getItem(SESSION_KEY);
}

function setLocalSessionId(sessionId) {
  localStorage.setItem(SESSION_KEY, sessionId);
}

function clearLocalSessionId() {
  localStorage.removeItem(SESSION_KEY);
}

// ─── IP detection (best-effort) ──────────────────────────────────────────────

async function getClientIP() {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    return data.ip || 'unknown';
  } catch {
    return 'unknown';
  }
}

// ─── core functions ──────────────────────────────────────────────────────────

/**
 * Create a new session for the user. Enforces max 3 sessions.
 * Returns the new sessionId.
 */
export async function createSession(uid) {
  const sessionId = generateSessionId();
  const ip = await getClientIP();

  // Save locally BEFORE Firestore write to avoid race with listener
  setLocalSessionId(sessionId);

  const sessionData = {
    sessionId,
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
    deviceInfo: getDeviceInfo(),
    deviceRaw: navigator.userAgent.slice(0, 200),
    ip,
    active: true
  };

  // Write the new session document
  await setDoc(doc(db, `users/${uid}/sessions/${sessionId}`), sessionData);

  // Enforce max sessions — delete oldest if over limit
  await enforceMaxSessions(uid, sessionId);

  // Mirror into userDirectory for admin visibility
  await setDoc(
    doc(db, `userDirectory/${uid}`),
    { lastLogin: serverTimestamp(), activeSessionId: sessionId },
    { merge: true }
  );

  return sessionId;
}

/**
 * Enforce max 3 sessions. If over limit, delete the oldest by lastSeen.
 */
async function enforceMaxSessions(uid, keepSessionId) {
  const sessionsRef = collection(db, `users/${uid}/sessions`);
  const snap = await getDocs(sessionsRef);

  if (snap.size <= MAX_SESSIONS) return;

  // Sort sessions by lastSeen (oldest first)
  const sessions = [];
  snap.forEach((d) => {
    const data = d.data();
    sessions.push({
      id: d.id,
      lastSeen: data.lastSeen?.toMillis?.() ?? data.createdAt?.toMillis?.() ?? 0
    });
  });

  sessions.sort((a, b) => a.lastSeen - b.lastSeen);

  // Delete oldest sessions until we're at MAX_SESSIONS
  const toDelete = sessions.slice(0, sessions.length - MAX_SESSIONS);
  for (const s of toDelete) {
    if (s.id !== keepSessionId) {
      await deleteDoc(doc(db, `users/${uid}/sessions/${s.id}`));
    }
  }
}

/**
 * Refresh the current session's lastSeen timestamp.
 * Called on every page load.
 */
export async function refreshSession(uid) {
  const sessionId = getLocalSessionId();
  if (!sessionId || !uid) return;

  try {
    const ref = doc(db, `users/${uid}/sessions/${sessionId}`);
    await updateDoc(ref, { lastSeen: serverTimestamp() });
  } catch (err) {
    // Session may have been deleted — will be caught by verifySession
    console.warn('refreshSession failed:', err.message);
  }
}

/**
 * Verify the current session still exists in Firestore.
 * Returns 'valid' | 'kicked' | 'no-session'
 */
export async function verifySession(uid) {
  const sessionId = getLocalSessionId();
  if (!sessionId) return 'no-session';

  const snap = await getDoc(doc(db, `users/${uid}/sessions/${sessionId}`));
  if (!snap.exists()) return 'kicked';

  const data = snap.data();
  if (data.active === false) return 'kicked';

  return 'valid';
}

// Backwards-compatible alias used by AuthContext
export const checkSession = verifySession;

/**
 * Subscribe to real-time changes on the current session document.
 * Calls onKicked(reason) if the session is deleted or deactivated.
 * Returns an unsubscribe function.
 */
export function subscribeToSession(uid, onKicked) {
  const sessionId = getLocalSessionId();
  if (!sessionId) {
    onKicked('no-session');
    return () => {};
  }

  const ref = doc(db, `users/${uid}/sessions/${sessionId}`);

  // Grace period to avoid false-positive kicks from Firestore's initial snapshot
  const GRACE_MS = 5000;
  const startTime = Date.now();

  return onSnapshot(ref, (snap) => {
    if (Date.now() - startTime < GRACE_MS) return;

    if (!snap.exists()) {
      // Session was deleted (bumped by another device or admin revoke)
      onKicked('other-device');
      return;
    }

    const data = snap.data();
    if (data.active === false) {
      onKicked('invalidated');
    }
  });
}

/**
 * Mark current session as inactive on intentional logout.
 */
export async function deactivateSession(uid) {
  const sessionId = getLocalSessionId();
  if (sessionId && uid) {
    try {
      const ref = doc(db, `users/${uid}/sessions/${sessionId}`);
      await updateDoc(ref, { active: false });
    } catch {
      // Session may already be gone
    }
  }
  clearLocalSessionId();
}

/**
 * Clean up local session ID (no Firestore write).
 */
export function clearSession() {
  clearLocalSessionId();
}

// ─── admin functions ─────────────────────────────────────────────────────────

/**
 * Admin: invalidate a specific session for a user.
 */
export async function invalidateSession(uid, sessionId) {
  if (sessionId) {
    await deleteDoc(doc(db, `users/${uid}/sessions/${sessionId}`));
  }
}

/**
 * Admin: revoke ALL sessions for a user (force full logout).
 */
export async function revokeAllSessions(uid) {
  const sessionsRef = collection(db, `users/${uid}/sessions`);
  const snap = await getDocs(sessionsRef);
  const deletes = snap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletes);

  // Clear from userDirectory
  await setDoc(
    doc(db, `userDirectory/${uid}`),
    { activeSessionId: null },
    { merge: true }
  );
}

/**
 * Admin: get all sessions for a specific user.
 */
export async function getUserSessions(uid) {
  const sessionsRef = collection(db, `users/${uid}/sessions`);
  const snap = await getDocs(sessionsRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Admin: get all active sessions across all users.
 * Returns array of { uid, email, displayName, sessions[] }
 */
export async function getAllActiveSessions() {
  const snap = await getDocs(collection(db, 'userDirectory'));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

/**
 * Admin: get session counts for all users (for dashboard).
 * Returns a map of uid → session count.
 */
export async function getAllSessionCounts() {
  const usersSnap = await getDocs(collection(db, 'userDirectory'));
  const counts = {};

  await Promise.all(
    usersSnap.docs.map(async (userDoc) => {
      const uid = userDoc.id;
      const sessionsSnap = await getDocs(collection(db, `users/${uid}/sessions`));
      const activeSessions = sessionsSnap.docs.filter((d) => {
        const data = d.data();
        return data.active !== false;
      });
      counts[uid] = activeSessions.length;
    })
  );

  return counts;
}
