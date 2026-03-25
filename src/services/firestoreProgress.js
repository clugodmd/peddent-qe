import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Record a single question attempt in Firestore.
 * Also updates the overall stats document.
 */
export async function recordProgressToFirestore(userId, questionId, { correct, answer, topic }) {
  try {
    // Write per-question progress
    const progressRef = doc(db, `users/${userId}/progress/${questionId}`);
    await setDoc(
      progressRef,
      {
        answered: true,
        correct,
        answer,
        topic: topic || '',
        timestamp: serverTimestamp()
      },
      { merge: true }
    );

    // Update stats document
    const statsRef = doc(db, `users/${userId}/stats/summary`);
    const statsSnap = await getDoc(statsRef);

    if (!statsSnap.exists()) {
      // Create fresh stats
      const topicBreakdown = {};
      if (topic) {
        topicBreakdown[topic] = { answered: 1, correct: correct ? 1 : 0 };
      }
      await setDoc(statsRef, {
        totalAnswered: 1,
        totalCorrect: correct ? 1 : 0,
        lastStudied: serverTimestamp(),
        topicBreakdown
      });
    } else {
      const existing = statsSnap.data();
      const topicBreakdown = existing.topicBreakdown || {};
      if (topic) {
        if (!topicBreakdown[topic]) {
          topicBreakdown[topic] = { answered: 0, correct: 0 };
        }
        topicBreakdown[topic].answered += 1;
        if (correct) topicBreakdown[topic].correct += 1;
      }
      await updateDoc(statsRef, {
        totalAnswered: increment(1),
        totalCorrect: correct ? increment(1) : increment(0),
        lastStudied: serverTimestamp(),
        topicBreakdown
      });
    }
  } catch (err) {
    console.error('Firestore write error:', err);
  }
}

/**
 * Load all progress for a user from Firestore.
 * Returns an object keyed by questionId.
 */
export async function loadUserProgress(userId) {
  try {
    const progressRef = collection(db, `users/${userId}/progress`);
    const snapshot = await getDocs(progressRef);
    const progress = {};
    snapshot.forEach((docSnap) => {
      progress[docSnap.id] = docSnap.data();
    });
    return progress;
  } catch (err) {
    console.error('Firestore read error:', err);
    return {};
  }
}

/**
 * Load the stats summary for a user.
 */
export async function loadUserStats(userId) {
  try {
    const statsRef = doc(db, `users/${userId}/stats/summary`);
    const snap = await getDoc(statsRef);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error('Firestore stats read error:', err);
    return null;
  }
}

/**
 * Admin: load all users' stats.
 * Requires Firestore rules that allow admin read (handle via custom claims or trust email check on client).
 * For now, we use a separate top-level /adminStats collection updated server-side,
 * OR we list users from a /userDirectory collection that each user writes to on login.
 */
export async function loadAllUsersStats() {
  try {
    const usersRef = collection(db, 'userDirectory');
    const snapshot = await getDocs(usersRef);
    const users = [];
    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();
      const statsRef = doc(db, `users/${userDoc.id}/stats/summary`);
      const statsSnap = await getDoc(statsRef);
      users.push({
        uid: userDoc.id,
        displayName: userData.displayName || userDoc.id,
        email: userData.email || '',
        ...(statsSnap.exists() ? statsSnap.data() : {
          totalAnswered: 0,
          totalCorrect: 0,
          lastStudied: null
        })
      });
    }
    return users;
  } catch (err) {
    console.error('Admin stats read error:', err);
    return [];
  }
}

/**
 * Register a user in the userDirectory so admin can list them.
 */
export async function registerUserDirectory(userId, displayName, email) {
  try {
    await setDoc(
      doc(db, `userDirectory/${userId}`),
      { displayName, email, createdAt: serverTimestamp() },
      { merge: true }
    );
  } catch (err) {
    console.error('userDirectory write error:', err);
  }
}
