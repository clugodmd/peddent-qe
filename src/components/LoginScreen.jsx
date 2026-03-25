import { useState, useEffect } from 'react';
import { Stethoscope, Mail, Lock, AlertCircle, CheckCircle, Eye, EyeOff, MonitorSmartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PaymentGate, isUTHEmail, hasLocalPaymentApproval, checkAndApplyStripeReturn } from './PaymentGate';

export function LoginScreen() {
  const { logIn, signUp, resetPassword, kickMessage } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [signupStep, setSignupStep] = useState('email'); // 'email' | 'payment' | 'details'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const clearMessages = () => { setError(''); setSuccess(''); };

  // On mount: check if returning from Stripe payment redirect
  useEffect(() => {
    const approvedEmail = checkAndApplyStripeReturn();
    if (approvedEmail) {
      setMode('signup');
      setEmail(approvedEmail);
      setSignupStep('details');
      setSuccess('Payment confirmed! Complete your account setup below.');
    }
  }, []);

  const friendlyError = (code) => {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      case 'auth/email-already-in-use':
        return 'This email is already registered. Try logging in.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      await logIn(email.trim(), password);
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 1 of signup: validate email, check payment status,
   * then either show PaymentGate or proceed to details.
   */
  const handleEmailNext = (e) => {
    e.preventDefault();
    clearMessages();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) { setError('Please enter your email address.'); return; }

    const free = isUTHEmail(trimmedEmail);
    const alreadyPaid = hasLocalPaymentApproval(trimmedEmail);

    if (free || alreadyPaid) {
      // UTH residents or already-paid → skip payment gate
      setSignupStep('details');
    } else {
      // Everyone else → show paywall
      setSignupStep('payment');
    }
  };

  /**
   * Called by PaymentGate once payment is confirmed (or UTH bypass).
   */
  const handlePaymentVerified = () => {
    setSignupStep('details');
    setSuccess('');
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!displayName.trim()) { setError('Please enter your name.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await signUp(email.trim(), password, displayName.trim());
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!email.trim()) { setError('Enter your email address first.'); return; }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSuccess('Password reset email sent! Check your inbox.');
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setSignupStep('email');
    clearMessages();
    setPassword('');
    setConfirmPassword('');
    setEmail('');
    setDisplayName('');
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Kicked-out banner */}
        {kickMessage && (
          <div className="flex items-start gap-3 bg-amber-900/40 border border-amber-600 text-amber-300 rounded-xl px-4 py-3 mb-6 text-sm">
            <MonitorSmartphone size={18} className="mt-0.5 flex-shrink-0" />
            <span>{kickMessage}</span>
          </div>
        )}

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-700 mb-4 shadow-lg">
            <Stethoscope size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">PedBoards QE</h1>
          <p className="text-gray-400 mt-1 text-sm">Pediatric Dental Board Exam Preparation</p>
        </div>

        {/* Card */}
        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6 shadow-xl">

          {/* Mode Tabs (login / signup) — hide when in payment gate step */}
          {mode !== 'forgot' && signupStep !== 'payment' && (
            <div className="flex rounded-xl overflow-hidden border border-navy-600 mb-5">
              <button
                onClick={() => switchMode('login')}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                  mode === 'login'
                    ? 'bg-green-700 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => switchMode('signup')}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                  mode === 'signup'
                    ? 'bg-green-700 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* ---- LOGIN ---- */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <InputField
                icon={<Mail size={16} />}
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(v) => { setEmail(v); clearMessages(); }}
                autoComplete="email"
              />
              <PasswordField
                placeholder="Password"
                value={password}
                onChange={(v) => { setPassword(v); clearMessages(); }}
                show={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
                autoComplete="current-password"
              />
              <Feedback error={error} success={success} />
              <SubmitButton loading={loading} label="Sign In" />
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="w-full text-center text-xs text-green-400 hover:text-green-300 mt-1 transition-colors"
              >
                Forgot password?
              </button>
            </form>
          )}

          {/* ---- SIGN UP: STEP 1 - Email ---- */}
          {mode === 'signup' && signupStep === 'email' && (
            <form onSubmit={handleEmailNext} className="space-y-4">
              <InputField
                icon={<Mail size={16} />}
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(v) => { setEmail(v); clearMessages(); }}
                autoComplete="email"
              />
              <Feedback error={error} success={success} />
              <SubmitButton loading={false} label="Continue →" />
              <p className="text-center text-gray-600 text-xs">
                UTH residents (<span className="text-gray-500">@uth.tmc.edu</span>) get free access
              </p>
            </form>
          )}

          {/* ---- SIGN UP: STEP 2 - Payment Gate ---- */}
          {mode === 'signup' && signupStep === 'payment' && (
            <PaymentGate
              email={email}
              onPaymentVerified={handlePaymentVerified}
              onCancel={() => { setSignupStep('email'); clearMessages(); }}
            />
          )}

          {/* ---- SIGN UP: STEP 3 - Account Details ---- */}
          {mode === 'signup' && signupStep === 'details' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              {success && (
                <Feedback error="" success={success} />
              )}
              <div className="text-sm text-gray-400 bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5">
                <span className="text-gray-500">Email: </span>
                <span className="text-gray-200">{email}</span>
              </div>
              <InputField
                icon={<span className="text-gray-500">👤</span>}
                type="text"
                placeholder="Full name"
                value={displayName}
                onChange={(v) => { setDisplayName(v); clearMessages(); }}
                autoComplete="name"
              />
              <PasswordField
                placeholder="Password (min 6 chars)"
                value={password}
                onChange={(v) => { setPassword(v); clearMessages(); }}
                show={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
                autoComplete="new-password"
              />
              <PasswordField
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(v) => { setConfirmPassword(v); clearMessages(); }}
                show={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
                autoComplete="new-password"
              />
              {error && <Feedback error={error} success="" />}
              <SubmitButton loading={loading} label="Create Account" />
              <button
                type="button"
                onClick={() => { setSignupStep('email'); clearMessages(); }}
                className="w-full text-center text-xs text-gray-500 hover:text-gray-300 mt-1 transition-colors"
              >
                ← Use a different email
              </button>
            </form>
          )}

          {/* ---- FORGOT PASSWORD ---- */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-gray-200 font-semibold">Reset Password</h2>
                <p className="text-gray-400 text-xs mt-1">
                  Enter your email and we'll send a reset link.
                </p>
              </div>
              <InputField
                icon={<Mail size={16} />}
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(v) => { setEmail(v); clearMessages(); }}
                autoComplete="email"
              />
              <Feedback error={error} success={success} />
              <SubmitButton loading={loading} label="Send Reset Email" />
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full text-center text-xs text-gray-500 hover:text-gray-300 mt-1 transition-colors"
              >
                ← Back to Sign In
              </button>
            </form>
          )}
        </div>

        {/* Demo CTA */}
        <div className="text-center mt-6">
          <a
            href={`${window.location.origin}${window.location.pathname}?demo=true`}
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600/30 hover:text-blue-200 text-sm font-medium transition-colors"
          >
            🎯 Try Demo — 15 free questions →
          </a>
        </div>

        <p className="text-center text-gray-600 text-xs mt-4">
          © 2026 PedBoards QE · For program use only
        </p>
      </div>
    </div>
  );
}

// ---- Reusable sub-components ----

function InputField({ icon, type, placeholder, value, onChange, autoComplete }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
        {icon}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        className="w-full pl-9 pr-4 py-3 rounded-xl bg-navy-900 border border-navy-600 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors"
      />
    </div>
  );
}

function PasswordField({ placeholder, value, onChange, show, onToggle, autoComplete }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
        <Lock size={16} />
      </span>
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        className="w-full pl-9 pr-10 py-3 rounded-xl bg-navy-900 border border-navy-600 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function Feedback({ error, success }) {
  if (error) {
    return (
      <div className="flex items-start gap-2 text-red-400 text-sm">
        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }
  if (success) {
    return (
      <div className="flex items-start gap-2 text-green-400 text-sm">
        <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
        <span>{success}</span>
      </div>
    );
  }
  return null;
}

function SubmitButton({ loading, label }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3 rounded-xl bg-green-700 hover:bg-green-600 active:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Please wait…</span>
        </>
      ) : label}
    </button>
  );
}
