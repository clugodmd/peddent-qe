import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDwdTECSDnwLvlIyjBQsxCFv-Jns9UO10g",
  authDomain: "peddent-qe.firebaseapp.com",
  projectId: "peddent-qe",
  storageBucket: "peddent-qe.firebasestorage.app",
  messagingSenderId: "225241166645",
  appId: "1:225241166645:web:d5dd669f7919390a2c127c",
  measurementId: "G-5ZZJW41YYD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics only in browser (not SSR)
let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (e) {
    // analytics optional
  }
}
export { analytics };

export default app;
