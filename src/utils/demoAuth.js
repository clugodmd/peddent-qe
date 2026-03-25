import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
  'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
  'spam4.me', 'trashmail.com'
];

export function isDisposableEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.includes(domain);
}

export async function checkDemoAlreadyUsed(email) {
  const docRef = doc(db, 'demo_leads', email.toLowerCase());
  const snap = await getDoc(docRef);
  return snap.exists();
}

export async function sendDemoMagicLink(email) {
  const actionCodeSettings = {
    url: 'https://pedsdentqe.com?demo=true&verified=true',
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  localStorage.setItem('demoEmailForSignIn', email);
}

export async function saveDemoLead(email) {
  const docRef = doc(db, 'demo_leads', email.toLowerCase());
  await setDoc(docRef, {
    email: email.toLowerCase(),
    timestamp: serverTimestamp(),
  });
}

export function isDemoEmailLink() {
  return isSignInWithEmailLink(auth, window.location.href);
}

/**
 * Handle the magic link return: verify the link, save the lead,
 * set sessionStorage flags, then sign out of Firebase (demo uses fake user).
 * Returns the verified email or null.
 */
export async function handleDemoEmailReturn() {
  if (!isSignInWithEmailLink(auth, window.location.href)) return null;

  let email = localStorage.getItem('demoEmailForSignIn');
  if (!email) {
    email = window.prompt('Please enter your email for confirmation');
  }
  if (!email) return null;

  // Verify the magic link (signs in temporarily)
  await signInWithEmailLink(auth, email, window.location.href);

  // Save lead to Firestore
  await saveDemoLead(email);

  // Clean up — sign out so AuthProvider doesn't pick up this Firebase user
  await signOut(auth);
  localStorage.removeItem('demoEmailForSignIn');

  // Set demo flags
  sessionStorage.setItem('peddent_demo', 'true');
  sessionStorage.setItem('peddent_demo_verified', 'true');

  // Clean magic link params from URL
  const cleanUrl = window.location.origin + window.location.pathname + '?demo=true';
  window.history.replaceState({}, '', cleanUrl);

  return email;
}
