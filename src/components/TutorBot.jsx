import { useState, useEffect } from 'react';
import { generateExplanation, getWeakTopics } from '../utils/tutorBot';
import { useDemo } from '../context/DemoContext';
import { useAuth } from '../context/AuthContext';
import { canUseTutor, incrementTutorUsage, FREE_LIMIT, UNLIMITED_STRIPE_URL } from '../services/tutorUsage';
import { loadUserStats } from '../services/firestoreProgress';

export const TutorBot = ({ question, userAnswer, correctAnswer, showAnswer, isPaid = false }) => {
  const { isDemoMode } = useDemo();
  const { user } = useAuth();
  const [explanationVisible, setExplanationVisible] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [usageInfo, setUsageInfo] = useState(null); // { allowed, remaining, isUnlimited }
  const [weakTopics, setWeakTopics] = useState([]);

  // Load usage + weak topics on mount
  useEffect(() => {
    if (user && !isDemoMode) {
      canUseTutor(user.uid).then(setUsageInfo);
      loadUserStats(user.uid).then(stats => {
        if (stats?.topicBreakdown) {
          setWeakTopics(getWeakTopics(stats.topicBreakdown));
        }
      });
    }
  }, [user, isDemoMode]);

  const toggleExplanation = async () => {
    try {
      if (explanationVisible) {
        setExplanationVisible(false);
        return;
      }

      // Re-check usage before each call
      const usage = await canUseTutor(user?.uid);
      setUsageInfo(usage);

      if (!usage.allowed) return; // blocked — UI shows upgrade prompt

      setExplanationVisible(true);
      if (!explanation) {
        setLoading(true);
        try {
          const result = await generateExplanation(question, userAnswer, correctAnswer, isPaid, null, weakTopics);
          setExplanation(result || 'No explanation available');
          // Only increment after successful response
          await incrementTutorUsage(user?.uid);
          // Refresh usage count
          canUseTutor(user?.uid).then(setUsageInfo);
        } catch (err) {
          console.error('TutorBot generation error:', err);
          setExplanation('Explanation temporarily unavailable. Try again?');
        }
        setLoading(false);
      }
    } catch (err) {
      console.error('TutorBot error:', err);
      setLoading(false);
    }
  };

  if (!showAnswer) return null;

  // Demo mode — show locked upsell
  if (isDemoMode) {
    return (
      <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', background: 'rgba(102,126,234,0.12)', border: '1px solid rgba(102,126,234,0.25)', borderRadius: '8px' }}>
        <span style={{ color: '#4a5568', fontSize: '0.9rem' }}>
          🔒 <strong style={{ color: '#1a1a2e' }}>AI Smart Tutor</strong> is part of the subscription.{' '}
          <a href={UNLIMITED_STRIPE_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#2d7a1e', textDecoration: 'underline', fontWeight: '600' }}>Sign up today →</a>
        </span>
      </div>
    );
  }

  // Limit reached — show upgrade prompt
  if (usageInfo && !usageInfo.allowed) {
    return (
      <div style={{ marginTop: '1rem', padding: '1.25rem', background: 'rgba(118,75,162,0.12)', border: '1px solid rgba(118,75,162,0.35)', borderRadius: '8px' }}>
        <p style={{ color: '#1a1a2e', fontWeight: '600', marginBottom: '6px' }}>
          🎓 You've used all {FREE_LIMIT} free AI explanations this month
        </p>
        <p style={{ color: '#4a5568', fontSize: '0.88rem', marginBottom: '12px' }}>
          Upgrade to Unlimited for $49/month — unlimited AI explanations, no limits.
        </p>
        <a
          href={UNLIMITED_STRIPE_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '0.6rem 1.4rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '0.9rem',
            textDecoration: 'none',
          }}
        >
          Upgrade to Unlimited →
        </a>
      </div>
    );
  }

  return (
    <div className="tutor-bot">
      {/* Usage badge */}
      {usageInfo && !usageInfo.isUnlimited && (
        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', textAlign: 'right' }}>
          {usageInfo.remaining} of {FREE_LIMIT} free AI explanations left this month
        </div>
      )}

      <button
        onClick={toggleExplanation}
        className="why-button"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
          transition: 'all 0.3s',
          marginTop: '0.5rem',
        }}
        onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 4px 12px rgba(102,126,234,0.4)'; }}
        onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
      >
        {explanationVisible ? '✕ Hide' : '💡 Why?'}
      </button>

      {!explanationVisible && (
        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '6px' }}>
          ✨ AI Smart Tutor — powered by Claude
        </div>
      )}

      {explanationVisible && (
        <div style={{ marginTop: '1rem', padding: '1.5rem', background: 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)', borderLeft: '4px solid #667eea', borderRadius: '8px' }}>
          {loading && (
            <div style={{ textAlign: 'center', color: '#667eea', fontStyle: 'italic' }}>
              <p>Generating explanation...</p>
            </div>
          )}
          {!loading && explanation && (
            <div style={{ color: '#1a1a2e', lineHeight: '1.6' }}>
              <p style={{ fontSize: '0.95rem' }}>{explanation}</p>
              <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#4a5568', textAlign: 'right' }}>
                🤖 Powered by Claude AI
              </div>
            </div>
          )}
          {!loading && !explanation && (
            <div style={{ color: '#e74c3c', textAlign: 'center' }}>Unable to generate explanation. Try again?</div>
          )}
        </div>
      )}
    </div>
  );
};
