import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Bot, Lightbulb, Zap, BarChart3, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProgressStore } from '../../store/progressStore';
import { getAllQuestions } from '../../utils/helpers';
import { useMemo } from 'react';

export const BottomNav = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const progress = useProgressStore((state) => state.progress);

  const isActive = (path) => location.pathname === path;

  // Calculate missed questions count
  const missedCount = useMemo(() => {
    const allQuestions = getAllQuestions();
    const missed = allQuestions.filter((question) => {
      const qProgress = progress[question.id];
      if (!qProgress || qProgress.attempts === 0) return false;
      return qProgress.correct < qProgress.attempts;
    });
    return missed.length;
  }, [progress]);

  const links = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/quiz', icon: BookOpen, label: 'Quiz' },
    { path: '/tutor', icon: Bot, label: 'AI Tutor' },
    { path: '/flashcards', icon: Lightbulb, label: 'Cards' },
    { path: '/exam', icon: Zap, label: 'Exam' },
    { path: '/missed', icon: AlertCircle, label: 'Missed', badge: missedCount > 0 ? missedCount : null },
    { path: '/progress', icon: BarChart3, label: 'Progress' },
    ...(isAdmin ? [{ path: '/admin', icon: Shield, label: 'Admin' }] : [])
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-navy-800 border-t border-navy-700 z-40">
      <div className="flex justify-around items-center h-20 max-w-4xl mx-auto">
        {links.map(({ path, icon: Icon, label, badge }) => (
          <Link
            key={path}
            to={path}
            className={`
              flex flex-col items-center gap-1 flex-1 h-full
              transition-colors justify-center relative
              ${
                isActive(path)
                  ? 'text-blue-400 bg-navy-700/50'
                  : 'text-gray-400 hover:text-gray-200'
              }
            `}
          >
            <Icon size={24} />
            <span className="text-xs font-medium">{label}</span>
            {badge !== null && badge > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
};
