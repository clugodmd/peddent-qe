import { useState, useRef, useEffect } from 'react';
import { askSupportBot } from '../utils/supportBot';

const WELCOME_MESSAGE = {
  role: 'assistant',
  text: "Hi! I'm your PedBoards QE assistant. Ask me anything about the platform, your account, or board prep!",
};

export const SupportChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setLoading(true);

    const answer = await askSupportBot(question);

    setMessages((prev) => [...prev, { role: 'assistant', text: answer }]);
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Panel */}
      {open && (
        <div style={styles.panel}>
          {/* Header */}
          <div style={styles.header}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>PedBoards QE Support</span>
            <button onClick={() => setOpen(false)} style={styles.closeBtn}>✕</button>
          </div>

          {/* Messages */}
          <div style={styles.messages}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  ...styles.bubble,
                  ...(msg.role === 'user' ? styles.userBubble : styles.botBubble),
                }}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div style={{ ...styles.bubble, ...styles.botBubble }}>
                <span style={styles.dots}>
                  <span style={styles.dot}>●</span>
                  <span style={{ ...styles.dot, animationDelay: '0.2s' }}>●</span>
                  <span style={{ ...styles.dot, animationDelay: '0.4s' }}>●</span>
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={styles.inputRow}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              style={styles.input}
              disabled={loading}
            />
            <button onClick={handleSend} disabled={loading || !input.trim()} style={styles.sendBtn}>
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Floating Bubble */}
      <button onClick={() => setOpen((o) => !o)} style={styles.fab}>
        {open ? '✕' : '💬'}
      </button>

      {/* Keyframe animation for dots */}
      <style>{`
        @keyframes supportDotPulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </>
  );
};

const styles = {
  fab: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #1a2744 0%, #243b6a 100%)',
    color: '#fff',
    fontSize: '1.5rem',
    border: '2px solid #3a5a9a',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s',
  },
  panel: {
    position: 'fixed',
    bottom: '90px',
    right: '24px',
    width: '320px',
    height: '420px',
    background: '#0f1a2e',
    borderRadius: '12px',
    border: '1px solid #1e3054',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 9998,
    overflow: 'hidden',
  },
  header: {
    background: '#162240',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#e8eef9',
    borderBottom: '1px solid #1e3054',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#a8b5d1',
    fontSize: '1.1rem',
    cursor: 'pointer',
    padding: '2px 6px',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  bubble: {
    padding: '8px 12px',
    borderRadius: '12px',
    fontSize: '0.85rem',
    lineHeight: '1.4',
    maxWidth: '85%',
    wordWrap: 'break-word',
  },
  botBubble: {
    background: '#1a2744',
    color: '#e8eef9',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: '4px',
  },
  userBubble: {
    background: '#2d5a3d',
    color: '#e8eef9',
    alignSelf: 'flex-end',
    borderBottomRightRadius: '4px',
  },
  dots: {
    display: 'inline-flex',
    gap: '4px',
  },
  dot: {
    display: 'inline-block',
    fontSize: '0.7rem',
    color: '#667eea',
    animation: 'supportDotPulse 1s infinite',
  },
  inputRow: {
    display: 'flex',
    padding: '8px',
    gap: '6px',
    borderTop: '1px solid #1e3054',
    background: '#0f1a2e',
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #1e3054',
    background: '#162240',
    color: '#e8eef9',
    fontSize: '0.85rem',
    outline: 'none',
  },
  sendBtn: {
    background: '#2d7a4a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 14px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'background 0.2s',
  },
};
