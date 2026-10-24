import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all select-none active:scale-95 ${
        isDark
          ? 'bg-[#1e293b] border-[#334155] text-amber-400 hover:bg-[#27354a]'
          : 'bg-[#FFF9F6] border-[#F3E5DC] text-slate-700 hover:bg-[#FFF0E6] hover:text-[#F67009]'
      } ${className}`}
    >
      <span className="w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <FontAwesomeIcon icon={faSun} className="text-amber-400 text-sm" />
        ) : (
          <FontAwesomeIcon icon={faMoon} className="text-slate-600 text-sm" />
        )}
      </span>
      {showLabel && (
        <span className="text-xs font-bold tracking-tight">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
