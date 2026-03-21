import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useProgressStore } from './store/progressStore';
import { BottomNav } from './components/layout/BottomNav';
import { Header } from './components/layout/Header';
import { LoginScreen } from './components/LoginScreen';
import { DisclaimerScreen, hasAgreedToDisclaimer } from './components/DisclaimerScreen';
import { useAuth } from './context/AuthContext';
import { registerUserDirectory } from './services/firestoreProgress';

// Pages
import { Home } from './pages/Home';
import { Quiz } from './pages/Quiz';
import { Flashcards } from './pages/Flashcards';
import { Exam } from './pages/Exam';
import { Review } from './pages/Review';
import { Progress } from './pages/Progress';
import { Settings } from './pages/Settings';
import { MissedQuestions } from './pages/MissedQuestions';
import { AdminDashboard } from './pages/AdminDashboard';

// PWA Service Worker
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
    });
  }
};

// Install prompt
const handleInstallPrompt = () => {
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`User response to the install prompt: ${outcome}`);
          deferredPrompt = null;
          installButton.style.display = 'none';
        }
      });
    }
  });
};

export default function App() {
  const { user, loading, isAdmin } = useAuth();
  const settings = useProgressStore((state) => state.settings);
  const [disclaimerDone, setDisclaimerDone] = useState(hasAgreedToDisclaimer);

  useEffect(() => {
    registerServiceWorker();
    handleInstallPrompt();

    // Apply theme
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply font size
    const fontSizeMap = { small: '14px', normal: '16px', large: '18px' };
    document.documentElement.style.fontSize = fontSizeMap[settings.fontSize] || '16px';
  }, [settings]);

  // Register user in userDirectory so admin can see them
  useEffect(() => {
    if (user) {
      registerUserDirectory(
        user.uid,
        user.displayName || user.email,
        user.email
      );
    }
  }, [user]);

  // Show loading spinner while auth state resolves
  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-green-500" />
      </div>
    );
  }

  // Not logged in → show login
  if (!user) {
    return <LoginScreen />;
  }

  // Logged in but haven't agreed to disclaimer yet → show once
  if (!disclaimerDone) {
    return <DisclaimerScreen onAgree={() => setDisclaimerDone(true)} />;
  }

  // Admin → show admin dashboard (still can navigate to main app via header link)
  return (
    <Router>
      <div className="min-h-screen bg-navy-900 text-gray-100">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/exam" element={<Exam />} />
          <Route path="/review" element={<Review />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/missed" element={<MissedQuestions />} />
          {isAdmin && <Route path="/admin" element={<AdminDashboard />} />}

          {/* Not Found */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-300 mb-4">404</h1>
                  <p className="text-gray-400 mb-6">Page not found</p>
                  <a
                    href="/"
                    className="inline-block px-6 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    Go Home
                  </a>
                </div>
              </div>
            }
          />
        </Routes>

        <BottomNav />
      </div>
    </Router>
  );
}
