import { useState, useEffect } from 'react';
import { Stethoscope, Mail, AlertCircle, CheckCircle, Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import {
  isDisposableEmail,
  checkDemoAlreadyUsed,
  sendDemoMagicLink,
  isDemoEmailLink,
  handleDemoEmailReturn
} from '../utils/demoAuth';
import { useDemo } from '../context/DemoContext';

const STRIPE_LINK = 'https://buy.stripe.com/7sY00j8Ig4tEfGNdCugjC01';

export function DemoGate() {
  const { markDemoVerified } = useDemo();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | sent | verifying | error | already-used
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  // On mount: check if returning from a magic link
  useEffect(() => {
    if (isDemoEmailLink()) {
      setStatus('verifying');
      handleDemoEmailReturn()
        .then((verifiedEmail) => {
          if (verifiedEmail) {
            markDemoVerified();
          } else {
            setStatus('error');
            setError('Could not verify your email. Please try again.');
          }
        })
        .catch(() => {
          setStatus('error');
          setError('Verification failed. The link may have expired — please request a new one.');
        });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim().toLowerCase();

    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (isDisposableEmail(trimmed)) {
      setError('Disposable email addresses are not allowed. Please use your real email.');
      return;
    }

    setStatus('loading');

    try {
      const alreadyUsed = await checkDemoAlreadyUsed(trimmed);
      if (alreadyUsed) {
        setStatus('already-used');
        return;
      }

      await sendDemoMagicLink(trimmed);
      setSentTo(trimmed);
      setStatus('sent');
    } catch (err) {
      console.error('Demo gate error:', err);
      setStatus('error');
      setError('Something went wrong. Please try again.');
    }
  };

  // Verifying magic link return
  if (status === 'verifying') {
    return (
      <Shell>
        <div className="text-center py-8">
          <Loader2 size={40} className="text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-300 text-lg font-medium">Verifying your email…</p>
          <p className="text-gray-500 text-sm mt-2">Just a moment</p>
        </div>
      </Shell>
    );
  }

  // Success — email sent
  if (status === 'sent') {
    return (
      <Shell>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-700/30 mb-4">
            <CheckCircle size={28} className="text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Check your inbox!</h2>
          <p className="text-gray-400 text-sm mb-1">
            We sent a demo link to
          </p>
          <p className="text-green-400 font-medium text-sm mb-6">{sentTo}</p>
          <p className="text-gray-500 text-xs">
            Click the link in the email to start your 15-question demo.
            <br />
            Don't see it? Check your spam folder.
          </p>
        </div>
      </Shell>
    );
  }

  // Already used demo
  if (status === 'already-used') {
    return (
      <Shell>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-700/30 mb-4">
            <AlertCircle size={28} className="text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Demo already used</h2>
          <p className="text-gray-400 text-sm mb-6">
            This email has already been used for a free demo.
            <br />
            Ready to get full access?
          </p>
          <a
            href={STRIPE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-700 hover:bg-green-600 text-white font-semibold transition-colors"
          >
            Subscribe — $35/month
            <ExternalLink size={16} />
          </a>
          <button
            onClick={() => { setStatus('idle'); setError(''); }}
            className="block mx-auto mt-4 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Try a different email
          </button>
        </div>
      </Shell>
    );
  }

  // Default: email entry form
  return (
    <Shell>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white mb-1">Start Your Free Demo</h2>
        <p className="text-gray-500 text-sm">
          15 questions · No credit card · AI explanations locked (subscription only)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <Mail size={16} />
          </span>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            required
            autoComplete="email"
            autoFocus
            className="w-full pl-9 pr-4 py-3 rounded-xl bg-navy-900 border border-navy-600 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 text-red-400 text-sm">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full py-3 rounded-xl bg-green-700 hover:bg-green-600 active:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Checking…</span>
            </>
          ) : (
            <>
              Send Demo Link
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-gray-600 text-xs mt-4">
        We'll send a one-time link to verify your email.
      </p>
    </Shell>
  );
}

/** Wrapper shell matching the LoginScreen layout */
function Shell({ children }) {
  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
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
          {children}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          © 2026 PedBoards QE · For program use only
        </p>
      </div>
    </div>
  );
}
