import { useState, useEffect } from 'react';
import { Stethoscope, Lock, AlertCircle } from 'lucide-react';

const VALID_CODES = ['PSPD-2026', 'LUGO-ADMIN', 'UTHSC-2026', 'UTPEDS-2026'];
const STORAGE_KEY = 'peddent_access_code';

export function AccessCodeGate({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if already authorized
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && VALID_CODES.includes(saved)) {
      setIsAuthorized(true);
    }
    setLoading(false);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (VALID_CODES.includes(trimmed)) {
      localStorage.setItem(STORAGE_KEY, trimmed);
      setIsAuthorized(true);
      setError('');
    } else {
      setError('Invalid access code. Please check with your program coordinator.');
      setCode('');
    }
  };

  if (loading) return null;

  if (isAuthorized) return children;

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 mb-4">
            <Stethoscope size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">PedBoards QE</h1>
          <p className="text-gray-400 mt-1 text-sm">Pediatric Dentistry Board Exam Prep</p>
        </div>

        {/* Access Code Card */}
        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={18} className="text-blue-400" />
            <h2 className="text-gray-200 font-semibold">Access Required</h2>
          </div>
          <p className="text-gray-400 text-sm mb-5">
            Contact your program coordinator or email support@pedsdentqe.com for your access code.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError('');
              }}
              placeholder="e.g. UTHSC-2026"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className="w-full px-4 py-3 rounded-xl bg-navy-900 border border-navy-600 text-white placeholder-gray-600 text-center text-lg tracking-widest font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />

            {error && (
              <div className="flex items-start gap-2 text-red-400 text-sm">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold transition-colors"
            >
              Enter
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          © 2026 PedBoards QE · For program use only
        </p>
      </div>
    </div>
  );
}
