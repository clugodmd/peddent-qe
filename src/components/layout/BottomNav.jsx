import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Lightbulb, Zap, BarChart3 } from 'lucide-react';

export const BottomNav = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const links = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/quiz', icon: BookOpen, label: 'Quiz' },
    { path: '/flashcards', icon: Lightbulb, label: 'Cards' },
    { path: '/exam', icon: Zap, label: 'Exam' },
    { path: '/progress', icon: BarChart3, label: 'Progress' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-navy-800 border-t border-navy-700 z-40">
      <div className="flex justify-around items-center h-20 max-w-4xl mx-auto">
        {links.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`
              flex flex-col items-center gap-1 flex-1 h-full
              transition-colors justify-center
              ${
                isActive(path)
                  ? 'text-blue-400 bg-navy-700/50'
                  : 'text-gray-400 hover:text-gray-200'
              }
            `}
          >
            <Icon size={24} />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};
