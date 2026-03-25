import { ShieldCheck } from 'lucide-react';

const DISCLAIMER_KEY = 'pedboards_disclaimer_agreed';

export function hasAgreedToDisclaimer() {
  return localStorage.getItem(DISCLAIMER_KEY) === 'true';
}

export function DisclaimerScreen({ onAgree }) {
  const handleAgree = () => {
    localStorage.setItem(DISCLAIMER_KEY, 'true');
    onAgree();
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Icon + Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-700 mb-4 shadow-lg">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Important Disclaimer</h1>
        </div>

        {/* Disclaimer card */}
        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6 shadow-xl space-y-4 text-sm text-gray-300 leading-relaxed">

          <p>
            PedBoards QE is an independent study tool created for educational purposes only.
          </p>

          <ul className="space-y-3">
            <li className="flex gap-2">
              <span className="text-green-400 mt-0.5 flex-shrink-0">•</span>
              <span>
                This application is <strong className="text-white">not affiliated with, endorsed by, or sponsored by</strong> the
                American Academy of Pediatric Dentistry (AAPD) or any other professional organization.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-400 mt-0.5 flex-shrink-0">•</span>
              <span>
                Questions are original content inspired by publicly available clinical guidelines and are{' '}
                <strong className="text-white">NOT actual board exam questions</strong>.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-400 mt-0.5 flex-shrink-0">•</span>
              <span>
                This tool is intended to supplement your board preparation —{' '}
                <strong className="text-white">not replace</strong> official study materials or programs.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-400 mt-0.5 flex-shrink-0">•</span>
              <span>
                Content is based on current guidelines but may not reflect the most recent updates.
                Always verify clinical information with current AAPD guidelines.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-400 mt-0.5 flex-shrink-0">•</span>
              <span>
                Use of this application <strong className="text-white">does not guarantee success</strong> on any examination.
              </span>
            </li>
          </ul>

          <p className="text-gray-400 text-xs border-t border-navy-600 pt-4">
            By clicking <em>"I Agree"</em>, you acknowledge you have read and understand this disclaimer.
          </p>
        </div>

        {/* Agree button */}
        <button
          onClick={handleAgree}
          className="mt-6 w-full py-4 rounded-xl bg-green-700 hover:bg-green-600 active:bg-green-800 text-white font-semibold text-base transition-colors shadow-lg"
        >
          I Agree — Start Studying
        </button>

        <p className="text-center text-gray-600 text-xs mt-4">
          © 2026 PedBoards QE · For program use only
        </p>
      </div>
    </div>
  );
}
