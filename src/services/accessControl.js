/**
 * accessControl.js
 * Role-based access control for PedBoards QE.
 *
 * Roles:
 *  - free    — default for UTH domain users
 *  - paid    — Stripe subscriber
 *  - blocked — admin-suspended
 *  - gifted  — admin manually granted access
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const ROLES = ['free', 'paid', 'blocked', 'gifted'];

/**
 * Get the user's current role from userDirectory.
 * Returns 'free' if no role is set.
 */
export async function getUserRole(uid) {
  try {
    const snap = await getDoc(doc(db, `userDirectory/${uid}`));
    if (!snap.exists()) return 'free';
    return snap.data().role || 'free';
  } catch (err) {
    console.error('getUserRole error:', err);
    return 'free';
  }
}

/**
 * Set a user's role in userDirectory. Admin only.
 */
export async function setUserRole(uid, role) {
  if (!ROLES.includes(role)) {
    throw new Error(`Invalid role: ${role}. Must be one of: ${ROLES.join(', ')}`);
  }
  await setDoc(
    doc(db, `userDirectory/${uid}`),
    { role, roleUpdatedAt: serverTimestamp() },
    { merge: true }
  );
}

/**
 * Check if a user is allowed to access the app.
 * Returns false if the user is blocked.
 */
export async function isAccessAllowed(uid) {
  const role = await getUserRole(uid);
  return role !== 'blocked';
}

/**
 * Set requiresVerification flag for a user. Admin only.
 */
export async function setRequiresVerification(uid, requires) {
  await setDoc(
    doc(db, `userDirectory/${uid}`),
    { requiresVerification: !!requires },
    { merge: true }
  );
}

/**
 * Check if user requires verification on login.
 */
export async function checkRequiresVerification(uid) {
  try {
    const snap = await getDoc(doc(db, `userDirectory/${uid}`));
    if (!snap.exists()) return false;
    return snap.data().requiresVerification === true;
  } catch {
    return false;
  }
}
