import { createContext, useContext, useState, useEffect } from 'react';

const DemoContext = createContext(null);

const DEMO_QUESTION_LIMIT = 15;

/**
 * Checks URL for ?demo=true and manages demo state in sessionStorage.
 * Also tracks whether the demo email has been verified (demoVerified).
 */
export function DemoProvider({ children }) {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    // Check sessionStorage first (persists across hash navigations)
    if (sessionStorage.getItem('peddent_demo') === 'true') return true;
    // Check URL param — works with both ?demo=true and #/?demo=true (hash router)
    const search = window.location.search || window.location.hash.split('?')[1] || '';
    const params = new URLSearchParams(search);
    return params.get('demo') === 'true';
  });

  const [demoVerified, setDemoVerified] = useState(() => {
    return sessionStorage.getItem('peddent_demo_verified') === 'true';
  });

  useEffect(() => {
    if (isDemoMode) {
      sessionStorage.setItem('peddent_demo', 'true');
    }
  }, [isDemoMode]);

  const markDemoVerified = () => {
    sessionStorage.setItem('peddent_demo_verified', 'true');
    setDemoVerified(true);
  };

  const exitDemo = () => {
    sessionStorage.removeItem('peddent_demo');
    sessionStorage.removeItem('peddent_demo_verified');
    setIsDemoMode(false);
    setDemoVerified(false);
    // Remove ?demo=true from URL without reload
    const url = new URL(window.location);
    url.searchParams.delete('demo');
    window.history.replaceState({}, '', url);
  };

  return (
    <DemoContext.Provider value={{ isDemoMode, demoVerified, markDemoVerified, exitDemo, DEMO_QUESTION_LIMIT }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used within DemoProvider');
  return ctx;
}
