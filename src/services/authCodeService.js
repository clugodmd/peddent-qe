/**
 * authCodeService.js
 * On-demand 6-digit verification code system.
 *
 * If a user has requiresVerification: true in their Firestore doc,
 * they must enter a verification code sent to their email before gaining access.
 */

import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const CODE_EXPIRY_MINUTES = 10;

/**
 * Generate a random 6-digit numeric code.
 */
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Create a verification code for a user and store it in Firestore.
 * Returns the generated code (to be sent via email).
 */
export async function createVerificationCode(uid) {
  const code = generateCode();
  const expiresAt = Timestamp.fromDate(
    new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000)
  );

  await setDoc(doc(db, `users/${uid}/verification/code`), {
    code,
    createdAt: serverTimestamp(),
    expiresAt,
    verified: false
  });

  return code;
}

/**
 * Verify a code entered by the user.
 * Returns { valid: true } or { valid: false, reason: string }
 */
export async function verifyCode(uid, enteredCode) {
  const snap = await getDoc(doc(db, `users/${uid}/verification/code`));
  if (!snap.exists()) {
    return { valid: false, reason: 'No verification code found. Please request a new one.' };
  }

  const data = snap.data();

  // Check expiry
  const expiresAt = data.expiresAt?.toDate?.() || new Date(0);
  if (new Date() > expiresAt) {
    return { valid: false, reason: 'Code expired. Please request a new one.' };
  }

  // Check code match
  if (data.code !== enteredCode.trim()) {
    return { valid: false, reason: 'Incorrect code. Please try again.' };
  }

  // Mark as verified for this session
  await setDoc(doc(db, `users/${uid}/verification/code`), {
    ...data,
    verified: true,
    verifiedAt: serverTimestamp()
  });

  return { valid: true };
}

/**
 * Send the verification code to the user's email via the Cloudflare Worker.
 * Falls back gracefully if the worker endpoint isn't configured.
 */
export async function sendVerificationEmail(email, code) {
  // Try sending via Cloudflare Worker endpoint
  try {
    const workerUrl = import.meta.env.VITE_WORKER_URL || 'https://peddent-worker.workers.dev';
    const res = await fetch(`${workerUrl}/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });

    if (!res.ok) {
      console.warn('Email send failed, status:', res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Could not send verification email:', err.message);
    return false;
  }
}

/**
 * Check if a user's current session is verified (code already entered).
 */
export async function isSessionVerified(uid) {
  try {
    const snap = await getDoc(doc(db, `users/${uid}/verification/code`));
    if (!snap.exists()) return false;
    return snap.data().verified === true;
  } catch {
    return false;
  }
}
