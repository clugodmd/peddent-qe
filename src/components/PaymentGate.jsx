/**
 * PaymentGate.jsx
 *
 * Guards the "Create Account" flow with a Stripe paywall.
 *
 * Rules:
 *  - Emails ending in @uth.tmc.edu → free, skip payment
 *  - Everyone else → must pay $99 via Stripe before account creation
 *  - Existing accounts (already in Firebase) → login always works, no gate
 *
 * Flow:
 *  1. User enters email in signup form
 *  2. If UTH → onPaymentVerified() called immediately
 *  3. If non-UTH → check localStorage for prior payment approval
 *  4. If no approval → show payment screen, store email, redirect to Stripe
 *  5. On return with ?payment_success=true → mark approved in localStorage → onPaymentVerified()
 */

import { useEffect, useState } from 'react';
import { CreditCard, CheckCircle, Stethoscope, ExternalLink } from 'lucide-react';

// Stripe Payment Link (created via API)
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/7sY00j8Ig4tEfGNdCugjC01';

// localStorage keys
const LS_PENDING_EMAIL = 'peddent_payment_pending_email';
const LS_PAID_EMAILS   = 'peddent_paid_emails'; // JSON array of approved emails

/** Returns true if the email is the UTH domain (free tier). */
export function isUTHEmail(email) {
  return (email || '').trim().toLowerCase().endsWith('@uth.tmc.edu');
}

/** Returns true if this email already has a recorded payment approval locally. */
export function hasLocalPaymentApproval(email) {
  try {
    const paid = JSON.parse(localStorage.getItem(LS_PAID_EMAILS) || '[]');
    return paid.includes(email.trim().toLowerCase());
  } catch {
    return false;
  }
}

/** Persist a payment approval to localStorage. */
function savePaymentApproval(email) {
  try {
    const paid = JSON.parse(localStorage.getItem(LS_PAID_EMAILS) || '[]');
    const normalized = email.trim().toLowerCase();
    if (!paid.includes(normalized)) {
      paid.push(normalized);
      localStorage.setItem(LS_PAID_EMAILS, JSON.stringify(paid));
    }
  } catch {}
}

/**
 * Check the URL for ?payment_success=true (set by Stripe redirect).
 * If present + there's a pending email stored → approve that email.
 * Returns the approved email or null.
 */
export function checkAndApplyStripeReturn() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  if (!params.get('payment_success')) return null;

  // Clean the param from the URL without reloading
  const cleanUrl = window.location.pathname + window.location.hash;
  window.history.replaceState({}, '', cleanUrl);

  const pendingEmail = localStorage.getItem(LS_PENDING_EMAIL);
  if (pendingEmail) {
    savePaymentApproval(pendingEmail);
    localStorage.removeItem(LS_PENDING_EMAIL);
    return pendingEmail;
  }
  return null; // Payment happened but no pending email (edge case)
}

/**
 * PaymentGate component.
 *
 * Props:
 *  - email: string — the email the user typed
 *  - onPaymentVerified: () => void — called when payment (or UTH bypass) is confirmed
 *  - onCancel: () => void — user wants to go back
 */
export function PaymentGate({ email, onPaymentVerified, onCancel }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'redirecting' | 'success'

  const normalizedEmail = (email || '').trim().toLowerCase();

  // Check immediately on mount
  useEffect(() => {
    if (!normalizedEmail) return;

    // UTH users always bypass
    if (isUTHEmail(normalizedEmail)) {
      onPaymentVerified();
      return;
    }

    // Already paid on this device?
    if (hasLocalPaymentApproval(normalizedEmail)) {
      setStatus('success');
      setTimeout(() => onPaymentVerified(), 800);
    }
  }, [normalizedEmail]);

  const handlePayNow = () => {
    if (!normalizedEmail) return;
    setStatus('redirecting');

    // Store email so we can recognize it on return
    localStorage.setItem(LS_PENDING_EMAIL, normalizedEmail);

    // Redirect to Stripe Payment Link with email prefilled
    const stripeUrl = `${STRIPE_PAYMENT_LINK}?prefilled_email=${encodeURIComponent(normalizedEmail)}`;
    window.location.href = stripeUrl;
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle size={40} className="text-green-400" />
        <p className="text-green-300 font-semibold">Payment verified!</p>
        <p className="text-gray-400 text-sm">Setting up your account…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-700/30 border border-green-600 mb-3">
          <CreditCard size={22} className="text-green-400" />
        </div>
        <h2 className="text-white font-semibold text-base">Access PedBoards QE</h2>
        <p className="text-gray-400 text-sm mt-1">
          A monthly subscription is required to create your account.
        </p>
      </div>

      {/* Email display */}
      <div className="bg-navy-900 border border-navy-600 rounded-xl px-4 py-3 text-sm">
        <span className="text-gray-500">Signing up as: </span>
        <span className="text-gray-200 font-medium">{normalizedEmail}</span>
      </div>

      {/* Pricing */}
      <div className="bg-green-900/20 border border-green-700/40 rounded-xl px-4 py-4 text-center">
        <div className="text-3xl font-bold text-white mb-0.5">$35</div>
        <div className="text-green-400 text-sm">Monthly Access</div>
        <ul className="mt-3 text-gray-400 text-xs space-y-1">
          <li>✓ Full question bank access</li>
          <li>✓ Flashcards &amp; exam mode</li>
          <li>✓ Progress tracking</li>
          <li>✓ Cancel anytime</li>
        </ul>
      </div>

      {/* CTA */}
      <button
        onClick={handlePayNow}
        disabled={status === 'redirecting'}
        className="w-full py-3 rounded-xl bg-green-700 hover:bg-green-600 active:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {status === 'redirecting' ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Redirecting to Stripe…</span>
          </>
        ) : (
          <>
            <ExternalLink size={16} />
            <span>Pay $35/month &amp; Create Account</span>
          </>
        )}
      </button>

      {/* Back */}
      <button
        type="button"
        onClick={onCancel}
        className="w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        ← Use a different email
      </button>

      <p className="text-center text-gray-600 text-xs">
        Secure payment via Stripe · UTH residents use your <span className="text-gray-500">@uth.tmc.edu</span> email for free access
      </p>
    </div>
  );
}
