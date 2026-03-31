/**
 * Tutor Bot Usage Tracking
 * Free tier: 20 AI explanations per month
 * Unlimited tier: $49/month (Stripe)
 */
import { doc, getDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const FREE_LIMIT = 50;
export const UNLIMITED_STRIPE_URL = 'https://buy.stripe.com/3cI7sL7Ec8JUbqx8iagjC02'; // $49/month unlimited

function getMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get current month's usage for a user
 * Returns { count, isUnlimited }
 */
export async function getTutorUsage(userId) {
  if (!userId) return { count: 0, isUnlimited: false };
  try {
    const monthKey = getMonthKey();
    const ref = doc(db, `users/${userId}/tutorUsage/${monthKey}`);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { count: 0, isUnlimited: false };
    const data = snap.data();
    return {
      count: data.count || 0,
      isUnlimited: data.isUnlimited || false,
    };
  } catch (e) {
    console.error('getTutorUsage error:', e);
    return { count: 0, isUnlimited: false };
  }
}

/**
 * Increment usage count for this month
 */
export async function incrementTutorUsage(userId) {
  if (!userId) return;
  try {
    const monthKey = getMonthKey();
    const ref = doc(db, `users/${userId}/tutorUsage/${monthKey}`);
    await setDoc(ref, {
      count: increment(1),
      lastUsed: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.error('incrementTutorUsage error:', e);
  }
}

/**
 * Check if user can use the tutor bot
 */
export async function canUseTutor(userId) {
  const { count, isUnlimited } = await getTutorUsage(userId);
  if (isUnlimited) return { allowed: true, remaining: Infinity, isUnlimited: true };
  const remaining = Math.max(0, FREE_LIMIT - count);
  return { allowed: remaining > 0, remaining, isUnlimited: false };
}
