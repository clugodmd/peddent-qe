/**
 * progressMigration.js
 *
 * Handles:
 * 1. localStorage key versioning — old keys are migrated forward, never lost
 * 2. Firestore ↔ localStorage sync on login — cloud always wins for newer data
 * 3. Merge strategy: per-question, keep whichever has more attempts (or latest timestamp)
 *
 * Called once on login from AuthContext.
 */

import { loadUserProgress } from './firestoreProgress';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

// All known storage key versions — oldest to newest
const KEY_HISTORY = [
  'peddent_progress',      // v1 (original)
  'peddent_progress_v2',   // v2
  'peddent_progress_v3',   // v3 (current)
];
const CURRENT_KEY    = 'peddent_progress_v3';
const SETTINGS_KEY   = 'peddent_settings';
const SYNC_TS_KEY    = 'peddent_last_sync'; // timestamp of last Firestore sync

/**
 * Load local progress, migrating from any old key if needed.
 */
export function loadLocalProgress() {
  // Try current key first
  try {
    const stored = localStorage.getItem(CURRENT_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}

  // Try migrating from older keys
  for (let i = KEY_HISTORY.length - 2; i >= 0; i--) {
    try {
      const old = localStorage.getItem(KEY_HISTORY[i]);
      if (old) {
        const parsed = JSON.parse(old);
        // Migrate to current key
        localStorage.setItem(CURRENT_KEY, JSON.stringify(parsed));
        // Keep old key intact as backup for 30 days
        console.log(`[progress] Migrated from ${KEY_HISTORY[i]} → ${CURRENT_KEY}`);
        return parsed;
      }
    } catch {}
  }

  return {};
}

/**
 * Save local progress to current key.
 */
export function saveLocalProgress(data) {
  try {
    localStorage.setItem(CURRENT_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[progress] Failed to save locally:', e);
  }
}

/**
 * Merge two progress objects.
 * Per question: keep whichever has more attempts, or if equal, most recent lastSeen.
 */
export function mergeProgress(local = {}, remote = {}) {
  const merged = { ...local };

  for (const [qId, remoteQ] of Object.entries(remote)) {
    const localQ = local[qId];
    if (!localQ) {
      // Remote has data we don't — take it
      merged[qId] = remoteQ;
    } else {
      // Both have data — take whichever has more attempts, break ties by lastSeen
      const remoteAttempts = remoteQ.attempts || 0;
      const localAttempts  = localQ.attempts  || 0;
      const remoteTs = remoteQ.lastSeen || remoteQ.timestamp?.seconds * 1000 || 0;
      const localTs  = localQ.lastSeen  || 0;

      if (remoteAttempts > localAttempts || (remoteAttempts === localAttempts && remoteTs > localTs)) {
        merged[qId] = { ...localQ, ...remoteQ };
      }
      // else keep local — it's ahead
    }
  }

  return merged;
}

/**
 * syncProgressOnLogin — call this after user logs in.
 * 1. Load local progress (with migration)
 * 2. Load Firestore progress
 * 3. Merge (Firestore wins ties)
 * 4. Write merged back to localStorage
 * 5. Write any local-only items back up to Firestore (catch-up)
 *
 * Returns merged progress object.
 */
export async function syncProgressOnLogin(userId) {
  try {
    const local  = loadLocalProgress();
    const remote = await loadUserProgress(userId);

    // Normalize remote: Firestore stores {answered, correct, topic, timestamp}
    // but local stores {attempts, correct, lastSeen, flagged, notes, ...}
    // Map remote fields to local schema
    const normalizedRemote = {};
    for (const [qId, r] of Object.entries(remote)) {
      normalizedRemote[qId] = {
        attempts:  r.attempts  || (r.answered ? 1 : 0),
        correct:   typeof r.correct === 'boolean' ? (r.correct ? 1 : 0) : (r.correct || 0),
        lastSeen:  r.lastSeen  || (r.timestamp?.seconds ? r.timestamp.seconds * 1000 : null),
        flagged:   r.flagged   || false,
        notes:     r.notes     || '',
        nextReview: r.nextReview || null,
        easeFactor: r.easeFactor || 2.5,
        interval:   r.interval   || 1,
        topic:      r.topic      || '',
      };
    }

    const merged = mergeProgress(local, normalizedRemote);
    saveLocalProgress(merged);
    localStorage.setItem(SYNC_TS_KEY, Date.now().toString());

    // Write any local-only data back to Firestore (items in local but not remote)
    const missingInRemote = Object.entries(merged).filter(([qId]) => !remote[qId]);
    if (missingInRemote.length > 0) {
      try {
        const batch = writeBatch(db);
        for (const [qId, data] of missingInRemote.slice(0, 500)) { // Firestore batch limit
          const ref = doc(db, `users/${userId}/progress/${qId}`);
          batch.set(ref, {
            attempts: data.attempts || 0,
            correct: data.correct || 0,
            lastSeen: data.lastSeen || null,
            flagged: data.flagged || false,
            notes: data.notes || '',
            topic: data.topic || '',
            synced_at: Date.now(),
          }, { merge: true });
        }
        await batch.commit();
      } catch (e) {
        console.warn('[progress] Catch-up Firestore write failed (non-critical):', e.message);
      }
    }

    console.log(`[progress] Synced: ${Object.keys(merged).length} questions (local: ${Object.keys(local).length}, remote: ${Object.keys(remote).length})`);
    return merged;

  } catch (err) {
    console.error('[progress] Sync failed, falling back to local:', err);
    return loadLocalProgress();
  }
}

/**
 * getLastSyncAge — returns how many minutes ago we last synced.
 */
export function getLastSyncAge() {
  try {
    const ts = parseInt(localStorage.getItem(SYNC_TS_KEY) || '0');
    if (!ts) return null;
    return Math.floor((Date.now() - ts) / 60000);
  } catch { return null; }
}
