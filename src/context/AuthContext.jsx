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
  checkSession
} from '../services/sessionService';
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
    'Your account is being used on another device. You have been signed out.',
  'invalidated':
    'Your session was ended by an administrator. Please sign in again.',
  'no-session':
    'Your session expired. Please sign in again.'
};

export function AuthProvider({ children }) {
  const { isDemoMode } = useDemo();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kickMessage, setKickMessage] = useState('');

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
          isAdmin: false
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

  // ── auth state listener ────────────────────────────────────────────────────

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Verify session is still valid before trusting the cached auth state
        const status = await checkSession(firebaseUser.uid);
        if (status === 'kicked') {
          // Someone else logged in while we were offline/backgrounded
          await forceLogout('other-device');
        } else if (status === 'no-session') {
          // Auth state persisted from a previous browser session but
          // sessionStorage was wiped → treat as a fresh login, create session.
          // But skip if logIn()/signUp() already handled this to avoid the
          // double-write race condition.
          if (!sessionCreatedByLoginRef.current) {
            await createSession(firebaseUser.uid);
          }
          sessionCreatedByLoginRef.current = false;
          setUser(firebaseUser);
          startSessionWatch(firebaseUser.uid);
        } else {
          // 'valid' — all good
          sessionCreatedByLoginRef.current = false;
          setUser(firebaseUser);
          startSessionWatch(firebaseUser.uid);
        }
      } else {
        // Logged out — clean up listener
        if (sessionUnsubRef.current) {
          sessionUnsubRef.current();
          sessionUnsubRef.current = null;
        }
        setUser(null);
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
    // Signal that we're handling session creation here so onAuthStateChanged
    // doesn't write a second token (which would cause a false kick).
    sessionCreatedByLoginRef.current = true;
    await createSession(result.user.uid);
    return result;
  };

  const logIn = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    // Signal that we're handling session creation here so onAuthStateChanged
    // doesn't write a second token (which would cause a false kick).
    sessionCreatedByLoginRef.current = true;
    // Overwrite any existing session — this kicks the other device
    await createSession(result.user.uid);
    setKickMessage(''); // clear any stale kick message
    return result;
  };

  const logOut = async () => {
    if (sessionUnsubRef.current) {
      sessionUnsubRef.current();
      sessionUnsubRef.current = null;
    }
    clearSession();
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
        isAdmin
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
