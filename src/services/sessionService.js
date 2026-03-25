/**
 * sessionService.js
 * Netflix-style concurrent session limiting.
 *
 * Flow:
 *  - On login: generate a UUID token, write to users/{uid}/session
 *  - Store the token in sessionStorage (tab-local, wiped on close)
 *  - On every app mount AND on a Firestore real-time listener:
 *      compare local token vs. Firestore token
 *      if mismatch → fire onKicked() callback
 *  - Admin can read /userDirectory docs (which include activeSession) and
 *    call invalidateSession(uid) to force-logout any resident
 */

import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  deleteField,
  serverTimestamp,
  collection,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';

const SESSION_KEY = 'peddent_session_token';

// ─── token helpers ───────────────────────────────────────────────────────────

function generateToken() {
  // crypto.randomUUID() is available in all modern browsers
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // fallback
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getLocalToken() {
  return sessionStorage.getItem(SESSION_KEY);
}

function setLocalToken(token) {
  sessionStorage.setItem(SESSION_KEY, token);
}

function clearLocalToken() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ─── IP detection (best-effort, free service) ─────────────────────────────────

async function getClientIP() {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    return data.ip || 'unknown';
  } catch {
    return 'unknown';
  }
}

// ─── core functions ───────────────────────────────────────────────────────────

/**
 * Called immediately after a successful Firebase Auth login.
 * Writes a new session token to Firestore and saves it locally.
 * This atomically kicks any existing session on another device.
 */
export async function createSession(uid) {
  const token = generateToken();
  const ip = await getClientIP();

  // ⚠️ Set local token BEFORE writing to Firestore.
  // The real-time listener can fire as soon as the Firestore write lands.
  // If localToken isn't set yet, the listener sees a mismatch and kicks
  // the user immediately (race condition on single device).
  setLocalToken(token);

  const sessionData = {
    token,
    loginTime: serverTimestamp(),
    device: navigator.userAgent.slice(0, 200), // trim to be safe
    ip
  };

  await setDoc(doc(db, `users/${uid}/session/active`), sessionData);

  // Also mirror token into userDirectory for admin visibility
  await setDoc(
    doc(db, `userDirectory/${uid}`),
    { activeSessionToken: token, lastLogin: serverTimestamp() },
    { merge: true }
  );

  return token;
}

/**
 * One-time check: fetch Firestore session and compare to local token.
 * Returns 'valid' | 'kicked' | 'no-session'
 */
export async function checkSession(uid) {
  const localToken = getLocalToken();
  if (!localToken) return 'no-session';

  const snap = await getDoc(doc(db, `users/${uid}/session/active`));
  if (!snap.exists()) return 'no-session';

  const { token } = snap.data();
  return token === localToken ? 'valid' : 'kicked';
}

/**
 * Subscribe to real-time session changes.
 * Calls onKicked() if the Firestore token stops matching the local token.
 * Returns an unsubscribe function.
 */
export function subscribeToSession(uid, onKicked) {
  const localToken = getLocalToken();
  if (!localToken) {
    onKicked('no-session');
    return () => {};
  }

  const ref = doc(db, `users/${uid}/session/active`);

  // Grace period: ignore listener events for the first few seconds after
  // login. Firestore's onSnapshot fires an immediate "current value" event
  // that can arrive before our own write has fully propagated or been
  // acknowledged locally, causing a false-positive kick on a single device.
  const GRACE_MS = 5000;
  const startTime = Date.now();

  return onSnapshot(ref, (snap) => {
    // Skip events that arrive within the grace window
    if (Date.now() - startTime < GRACE_MS) {
      return;
    }

    if (!snap.exists()) {
      // Session document deleted → admin force-logout
      onKicked('invalidated');
      return;
    }
    const { token } = snap.data();
    if (token !== localToken) {
      onKicked('other-device');
    }
  });
}

/**
 * Clean up local session token on intentional logout.
 */
export function clearSession() {
  clearLocalToken();
}

// ─── admin functions ──────────────────────────────────────────────────────────

/**
 * Admin: force-logout a specific user by deleting their session document.
 * The real-time listener on their device will catch the deletion and kick them.
 */
export async function invalidateSession(uid) {
  await setDoc(
    doc(db, `users/${uid}/session/active`),
    { token: '__invalidated__', invalidatedAt: serverTimestamp() }
  );
  // Also clear from userDirectory
  await setDoc(
    doc(db, `userDirectory/${uid}`),
    { activeSessionToken: null },
    { merge: true }
  );
}

/**
 * Admin: get all active sessions from userDirectory.
 * Returns array of { uid, displayName, email, activeSessionToken, lastLogin }
 */
export async function getAllActiveSessions() {
  const snap = await getDocs(collection(db, 'userDirectory'));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}
