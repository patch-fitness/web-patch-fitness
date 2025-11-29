import React, { useEffect } from 'react'
import ClearIcon from '@mui/icons-material/Clear';
import { useTheme } from '@/contexts/ThemeContext';

const Modal = ({handleClose, content, header}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Ngăn scroll body khi modal mở
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-300 ${
        isDark ? 'bg-black/70 backdrop-blur-sm' : 'bg-black/50 backdrop-blur-sm'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className={`w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl transition-colors duration-300 animate-scale-in ${
        isDark 
          ? 'bg-stone-900 border border-stone-700/50' 
          : 'bg-white border border-stone-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b flex-shrink-0 ${
          isDark ? 'border-stone-700/50' : 'border-stone-200'
        }`}>
          <h2 className={`text-xl md:text-2xl font-bold ${
            isDark ? 'text-white' : 'text-stone-900'
          }`}>
            {header}
          </h2>
          <button
            onClick={handleClose}
            className={`p-2 rounded-xl transition-all duration-200 ${
              isDark 
                ? 'text-stone-400 hover:text-white hover:bg-stone-700' 
                : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
            }`}
            title="Đóng"
            aria-label="Đóng modal"
          >
            <ClearIcon sx={{ fontSize: 24 }} />
          </button>
        </div>
        
        {/* Content */}
        <div 
          className={`flex-1 overflow-y-auto p-5 ${
            isDark ? 'text-stone-300' : 'text-stone-700'
          }`}
          style={{ 
            maxHeight: 'calc(90vh - 80px)',
            scrollBehavior: 'smooth'
          }}
        >
          {content}
        </div>
      </div>
    </div>
  )
}

export default Modal
