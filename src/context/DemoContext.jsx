import { createContext, useContext, useState, useEffect } from 'react';

const DemoContext = createContext(null);

const DEMO_QUESTION_LIMIT = 15;

/**
 * Demo starts immediately from ?demo=true.
 * sessionStorage is cleared on exit so the login landing comes back.
 */
export function DemoProvider({ children }) {
  const readDemoFlag = () => {
    const search = window.location.search || window.location.hash.split('?')[1] || '';
    const params = new URLSearchParams(search);
    if (params.get('demo') === 'false') return false;
    if (params.get('demo') === 'true') return true;
    return sessionStorage.getItem('peddent_demo') === 'true';
  };

  const [isDemoMode, setIsDemoMode] = useState(readDemoFlag);
  const [demoVerified, setDemoVerified] = useState(() => readDemoFlag());

  useEffect(() => {
    const search = window.location.search || window.location.hash.split('?')[1] || '';
    const params = new URLSearchParams(search);
    if (params.get('demo') === 'false') {
      sessionStorage.removeItem('peddent_demo');
      sessionStorage.removeItem('peddent_demo_verified');
      setIsDemoMode(false);
      setDemoVerified(false);
      return;
    }
    if (isDemoMode) {
      sessionStorage.setItem('peddent_demo', 'true');
      sessionStorage.setItem('peddent_demo_verified', 'true');
      setDemoVerified(true);
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
    const url = new URL(window.location);
    url.searchParams.delete('demo');
    url.searchParams.delete('verified');
    window.history.replaceState({}, '', url.pathname + url.hash);
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
