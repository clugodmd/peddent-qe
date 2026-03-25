import { useState } from 'react';
import { generateExplanation } from '../utils/tutorBot';
import { useDemo } from '../context/DemoContext';

export const TutorBot = ({ question, userAnswer, correctAnswer, showAnswer, isPaid = false }) => {
  const { isDemoMode } = useDemo();
  const [explanationVisible, setExplanationVisible] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleExplanation = async () => {
    try {
      if (explanationVisible) {
        setExplanationVisible(false);
      } else {
        setExplanationVisible(true);
        if (!explanation) {
          setLoading(true);
          try {
            const result = await generateExplanation(
              question, 
              userAnswer, 
              correctAnswer, 
              isPaid,
              (chunk) => {
                // Stream callback - update explanation as chunks arrive
                setExplanation(chunk || '');
              }
            );
            setExplanation(result || 'No explanation available');
          } catch (err) {
            console.error('TutorBot generation error:', err);
            setExplanation('Explanation temporarily unavailable. Try again?');
          }
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('TutorBot error:', err);
      setLoading(false);
    }
  };

  if (!showAnswer) return null;

  // Demo mode — show locked upsell instead of AI tutor
  if (isDemoMode) {
    return (
      <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', background: 'rgba(102,126,234,0.08)', border: '1px solid rgba(102,126,234,0.25)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <span style={{ color: '#a8b5d1', fontSize: '0.9rem' }}>🔒 <strong style={{color:'#e8eef9'}}>AI Smart Tutor</strong> is part of the subscription. <a href="https://buy.stripe.com/7sY00j8Ig4tEfGNdCugjC01" target="_blank" rel="noopener noreferrer" style={{color:'#90c97a', textDecoration:'underline', fontWeight:'600'}}>Sign up today →</a></span>
      </div>
    );
  }

  return (
    <div className="tutor-bot">
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
          marginTop: '1rem'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
        }}
      >
        {explanationVisible ? '✕ Hide' : '💡 Why?'}
      </button>

      {explanationVisible && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            borderLeft: '4px solid #667eea',
            borderRadius: '8px'
          }}
        >
          {loading && (
            <div style={{ textAlign: 'center', color: '#667eea', fontStyle: 'italic' }}>
              <p>Generating explanation...</p>
            </div>
          )}
          {!loading && explanation && (
            <div style={{ color: '#e8eef9', lineHeight: '1.6' }}>
              <p style={{ fontSize: '0.95rem' }}>{explanation}</p>
              <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#a8b5d1', textAlign: 'right' }}>
                {isPaid ? '📚 Premium Explanation' : '💡 Free Explanation (Ollama)'}
              </div>
            </div>
          )}
          {!loading && !explanation && (
            <div style={{ color: '#e74c3c', textAlign: 'center' }}>
              Unable to generate explanation. Try again?
            </div>
          )}
        </div>
      )}
    </div>
  );
};
