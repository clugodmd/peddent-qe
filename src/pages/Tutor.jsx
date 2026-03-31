import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Sparkles, ArrowRight } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { canUseTutor, FREE_LIMIT, UNLIMITED_STRIPE_URL } from '../services/tutorUsage';

export const Tutor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [usageInfo, setUsageInfo] = useState(null);

  useEffect(() => {
    if (user) {
      canUseTutor(user.uid).then(setUsageInfo);
    }
  }, [user]);

  const used = usageInfo ? FREE_LIMIT - (usageInfo.remaining === Infinity ? 0 : usageInfo.remaining) : 0;

  return (
    <div className="min-h-screen bg-navy-900 pb-32">
      <Header title="AI Tutor" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Hero */}
        <div className="bg-navy-800 rounded-xl p-6 mb-6 border border-navy-700 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
            <Bot size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-100 mb-3">AI Smart Tutor</h2>
          <p className="text-gray-300 leading-relaxed max-w-md mx-auto">
            Get instant, personalized explanations for every question you miss.
            Powered by Claude AI, your tutor adapts to your weak areas and
            helps you understand the clinical reasoning behind each answer.
          </p>
        </div>

        {/* Features */}
        <div className="bg-navy-800 rounded-xl p-6 mb-6 border border-navy-700">
          <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2">
            <Sparkles size={20} className="text-purple-400" />
            What the AI Tutor Does
          </h3>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-green-400 mt-0.5">✓</span>
              Explains why your answer was wrong and why the correct answer is right
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 mt-0.5">✓</span>
              Provides clinical reasoning grounded in AAPD guidelines
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 mt-0.5">✓</span>
              Adapts to your weak topics for targeted learning
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 mt-0.5">✓</span>
              Available on every question after you submit your answer
            </li>
          </ul>
        </div>

        {/* Usage */}
        <div className="bg-navy-800 rounded-xl p-6 mb-6 border border-navy-700">
          <h3 className="text-lg font-bold text-gray-100 mb-4">Your Usage This Month</h3>

          {usageInfo?.isUnlimited ? (
            <div className="flex items-center gap-3 bg-green-900/30 border border-green-500/30 rounded-lg px-4 py-3">
              <span className="text-lg">✅</span>
              <span className="text-green-300 font-semibold">Unlimited Access</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">{used} of {FREE_LIMIT} free explanations used</span>
                <span className="text-gray-400 text-sm">{usageInfo?.remaining ?? FREE_LIMIT} remaining</span>
              </div>
              <div className="w-full bg-navy-700 rounded-full h-3 mb-4">
                <div
                  className="h-3 rounded-full transition-all bg-gradient-to-r from-blue-500 to-purple-500"
                  style={{ width: `${Math.min(100, (used / FREE_LIMIT) * 100)}%` }}
                />
              </div>

              {used >= FREE_LIMIT * 0.8 && (
                <a
                  href={UNLIMITED_STRIPE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold transition-all mb-3"
                >
                  Upgrade for Unlimited — $49/month
                </a>
              )}
            </>
          )}
        </div>

        {/* CTA */}
        <Button
          onClick={() => navigate('/quiz')}
          variant="primary"
          size="lg"
          className="w-full flex items-center justify-center gap-2"
        >
          Start Practicing
          <ArrowRight size={20} />
        </Button>

        <p className="text-center text-gray-500 text-xs mt-4">
          The AI Tutor appears after you answer each quiz question — tap "💡 Why?" to get an explanation.
        </p>
      </div>
    </div>
  );
};
