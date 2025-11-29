import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

const ThemeToggle = () => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 ${
        isDark 
          ? 'bg-stone-800 hover:bg-stone-700 border border-stone-700 shadow-lg shadow-black/20' 
          : 'bg-white hover:bg-stone-50 border border-stone-200 shadow-lg shadow-stone-200/50'
      }`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Chuyển sang chế độ ${isDark ? 'sáng' : 'tối'}`}
    >
      <div className="relative w-5 h-5">
        <LightModeIcon
          className={`absolute inset-0 transition-all duration-300 ${
            isDark 
              ? 'opacity-0 rotate-90 scale-0' 
              : 'opacity-100 rotate-0 scale-100 text-amber-500'
          }`}
          sx={{ fontSize: 20 }}
        />
        <DarkModeIcon
          className={`absolute inset-0 transition-all duration-300 ${
            isDark 
              ? 'opacity-100 rotate-0 scale-100 text-primary-400' 
              : 'opacity-0 -rotate-90 scale-0'
          }`}
          sx={{ fontSize: 20 }}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;
