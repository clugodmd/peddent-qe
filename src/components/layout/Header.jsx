import { Settings, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Header = ({ title = 'PedBoards QE' }) => {

  return (
    <header className="sticky top-0 bg-navy-800 border-b border-navy-700 z-30">
      <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-400">
          <Stethoscope size={28} />
          <span className="hidden sm:inline">PedBoards QE</span>
          <span className="sm:hidden">QE</span>
        </Link>

        <h1 className="flex-1 text-center text-lg font-semibold text-gray-100 truncate px-4">
          {title}
        </h1>

        <div className="flex items-center gap-2">
          <Link
            to="/settings"
            className="p-2 rounded-lg hover:bg-navy-700 transition-colors text-gray-400 hover:text-gray-200"
            title="Settings"
          >
            <Settings size={24} />
          </Link>
        </div>
      </div>
    </header>
  );
};
