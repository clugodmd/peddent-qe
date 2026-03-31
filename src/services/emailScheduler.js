/**
 * emailScheduler.js
 * Schedules automated email milestones in Firestore for each user.
 *
 * Emails are NOT sent from the browser — they are stored as schedule documents
 * in `users/{uid}/emailSchedule` and processed by a cron job (Tommy).
 *
 * Each document: { emailId, sendAt (Timestamp), sent (bool), email, role }
 */

import {
  doc,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

const EXAM_DATE = new Date('2026-05-04T00:00:00');
const POST_EXAM_DATE = new Date('2026-05-05T09:00:00'); // send morning after

/**
 * Email milestones relative to join date.
 * Each entry: [emailId, daysAfterJoin, description]
 */
const RELATIVE_MILESTONES = [
  ['week1_checkin',   7,  'Weekly Check-in with Countdown'],
  ['week2_plan',      14, '2-Week Study Plan Push'],
  ['week3_final',     21, 'Final Push — Simulate the Real Thing'],
  ['part2_planning',  30, 'Part 2 Planning'],
];

/**
 * Add days to a Date, returning a new Date.
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  // Set to 9am for reasonable send time
  result.setHours(9, 0, 0, 0);
  return result;
}

/**
 * Schedule all email milestones for a newly created user.
 * Called once on account creation from AuthContext.
 *
 * @param {string} uid - Firebase user ID
 * @param {string} email - User's email address
 * @param {Date} joinDate - When the user signed up
 * @param {string} role - User's role (free, paid, etc.)
 */
export async function scheduleUserEmails(uid, email, joinDate, role) {
  const promises = [];

  // Schedule relative milestones (day 7, 14, 21, 30)
  for (const [emailId, daysAfter, description] of RELATIVE_MILESTONES) {
    const sendAt = addDays(joinDate, daysAfter);

    // Don't schedule emails past the exam date (except part2_planning)
    if (emailId !== 'part2_planning' && sendAt > EXAM_DATE) {
      continue;
    }

    const ref = doc(db, 'users', uid, 'emailSchedule', emailId);
    promises.push(
      setDoc(ref, {
        emailId,
        description,
        sendAt: Timestamp.fromDate(sendAt),
        sent: false,
        email,
        role,
        createdAt: Timestamp.now()
      })
    );
  }

  // Fixed-date email: post-exam (May 5, 2026)
  const postExamRef = doc(db, 'users', uid, 'emailSchedule', 'post_exam');
  promises.push(
    setDoc(postExamRef, {
      emailId: 'post_exam',
      description: 'Post Part 1 — How did it go?',
      sendAt: Timestamp.fromDate(POST_EXAM_DATE),
      sent: false,
      email,
      role,
      createdAt: Timestamp.now()
    })
  );

  await Promise.all(promises);
}
