import { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase';
import {
  createSession,
  subscribeToSession,
  clearSession,
  checkSession,
  refreshSession,
  deactivateSession,
  getLocalSessionId
} from '../services/sessionService';
import { isAccessAllowed, getUserRole, checkRequiresVerification } from '../services/accessControl';
import { scheduleUserEmails } from '../services/emailScheduler';
import { syncProgressOnLogin } from '../services/progressMigration';
import { useProgressStore } from '../store/progressStore';
import { useDemo } from './DemoContext';

const AuthContext = createContext(null);

/** Fake user object returned in demo mode (no Firebase needed). */
const DEMO_USER = {
  uid: 'demo-user',
  email: 'demo@pedsdentqe.com',
  displayName: 'Demo User',
  isAnonymous: true
};

export const ADMIN_EMAIL = 'drlugo@thedentrepreneur.com';

/**
 * Kick reasons → human-readable messages shown on the login screen.
 */
export const KICK_MESSAGES = {
  'other-device':
    'You were signed in on another device. Please sign in again.',
  'invalidated':
    'Your session was ended by an administrator. Please sign in again.',
  'no-session':
    'Your session expired. Please sign in again.',
  'blocked':
    'Your account access has been suspended. Contact support@pedsdentqe.com'
};

export function AuthProvider({ children }) {
  const { isDemoMode } = useDemo();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kickMessage, setKickMessage] = useState('');
  const [userRole, setUserRole] = useState('free');
  const [needsVerification, setNeedsVerification] = useState(false);

  // ── Demo mode: skip Firebase entirely ────────────────────────────────────
  if (isDemoMode) {
    const noop = async () => {};
    return (
      <AuthContext.Provider
        value={{
          user: DEMO_USER,
          loading: false,
          kickMessage: '',
          signUp: noop,
          logIn: noop,
          logOut: noop,
          resetPassword: noop,
          isAdmin: false,
          userRole: 'free',
          currentSessionId: null,
          needsVerification: false,
          setNeedsVerification: noop
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  // Keep ref to unsubscribe from session listener
  const sessionUnsubRef = useRef(null);

  // Flag: logIn() / signUp() set this to true before they call createSession.
  // onAuthStateChanged checks this flag to skip calling createSession again —
  // prevents the double-write race condition that falsely kicks a single user.
  const sessionCreatedByLoginRef = useRef(false);

  // ── helpers ────────────────────────────────────────────────────────────────

  /** Tear down session listener and sign out of Firebase. */
  const forceLogout = async (reason) => {
    if (sessionUnsubRef.current) {
      sessionUnsubRef.current();
      sessionUnsubRef.current = null;
    }
    clearSession();
    setKickMessage(KICK_MESSAGES[reason] || KICK_MESSAGES['no-session']);
    setUserRole('free');
    setNeedsVerification(false);
    await signOut(auth);
  };

  /** Wire up the real-time session listener for a logged-in user. */
  const startSessionWatch = (uid) => {
    // Cancel any previous listener first
    if (sessionUnsubRef.current) {
      sessionUnsubRef.current();
    }
    sessionUnsubRef.current = subscribeToSession(uid, (reason) => {
      forceLogout(reason);
    });
  };

  /** Check access role and verification requirements after auth. */
  const checkAccessAndRole = async (uid) => {
    // Check if blocked
    const allowed = await isAccessAllowed(uid);
    if (!allowed) {
      await forceLogout('blocked');
      return false;
    }

    // Fetch and store role
    const role = await getUserRole(uid);
    setUserRole(role);

    // Check if verification is required
    const needsVerify = await checkRequiresVerification(uid);
    setNeedsVerification(needsVerify);

    return true;
  };

  // ── auth state listener ────────────────────────────────────────────────────

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check access control first
        const accessOk = await checkAccessAndRole(firebaseUser.uid);
        if (!accessOk) {
          setLoading(false);
          return;
        }

        // Verify session is still valid before trusting the cached auth state
        const status = await checkSession(firebaseUser.uid);
        if (status === 'kicked') {
          await forceLogout('other-device');
        } else if (status === 'no-session') {
          if (!sessionCreatedByLoginRef.current) {
            await createSession(firebaseUser.uid);
          }
          sessionCreatedByLoginRef.current = false;
          setUser(firebaseUser);
          startSessionWatch(firebaseUser.uid);
          refreshSession(firebaseUser.uid);
          // Sync + migrate progress from Firestore → localStorage silently
          syncProgressOnLogin(firebaseUser.uid).then((merged) => {
            useProgressStore.getState().hydrateProgress(merged);
          }).catch(() => {});
        } else {
          // 'valid' — all good
          sessionCreatedByLoginRef.current = false;
          setUser(firebaseUser);
          startSessionWatch(firebaseUser.uid);
          refreshSession(firebaseUser.uid);
          // Sync + migrate progress from Firestore → localStorage silently
          syncProgressOnLogin(firebaseUser.uid).then((merged) => {
            useProgressStore.getState().hydrateProgress(merged);
          }).catch(() => {});
        }
      } else {
        // Logged out — clean up listener
        if (sessionUnsubRef.current) {
          sessionUnsubRef.current();
          sessionUnsubRef.current = null;
        }
        setUser(null);
        setUserRole('free');
        setNeedsVerification(false);
      }
      setLoading(false);
    });

    return () => {
      unsubAuth();
      if (sessionUnsubRef.current) {
        sessionUnsubRef.current();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── public methods ─────────────────────────────────────────────────────────

  const signUp = async (email, password, displayName) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(result.user, { displayName });
    }
    sessionCreatedByLoginRef.current = true;
    await createSession(result.user.uid);

    // Schedule automated email sequence for new user
    try {
      await scheduleUserEmails(result.user.uid, email, new Date(), 'free');
    } catch (e) {
      console.error('Failed to schedule emails:', e);
    }

    return result;
  };

  const logIn = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    sessionCreatedByLoginRef.current = true;
    await createSession(result.user.uid);
    setKickMessage('');
    return result;
  };

  const logOut = async () => {
    const uid = user?.uid;
    if (sessionUnsubRef.current) {
      sessionUnsubRef.current();
      sessionUnsubRef.current = null;
    }
    // Mark session inactive instead of just clearing local storage
    if (uid) {
      await deactivateSession(uid);
    } else {
      clearSession();
    }
    setUserRole('free');
    setNeedsVerification(false);
    await signOut(auth);
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        kickMessage,
        signUp,
        logIn,
        logOut,
        resetPassword,
        isAdmin,
        userRole,
        currentSessionId: getLocalSessionId(),
        needsVerification,
        setNeedsVerification
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
