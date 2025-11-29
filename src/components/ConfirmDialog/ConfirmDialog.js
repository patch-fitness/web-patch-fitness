import React from 'react';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useTheme } from '@/contexts/ThemeContext';

const ConfirmDialog = ({
  title = 'Xác nhận',
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${
      isDark ? 'bg-black/70 backdrop-blur-sm' : 'bg-black/50 backdrop-blur-sm'
    }`}>
      <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6 animate-scale-in ${
        isDark 
          ? 'bg-stone-900 border border-stone-700/50' 
          : 'bg-white border border-stone-200'
      }`}>
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
            isDark ? 'bg-rose-500/20' : 'bg-rose-100'
          }`}>
            <WarningAmberIcon className="text-rose-500" sx={{ fontSize: 32 }} />
          </div>
        </div>

        {/* Title */}
        <h3 className={`text-xl font-bold text-center mb-3 ${
          isDark ? 'text-white' : 'text-stone-900'
        }`}>
          {title}
        </h3>

        {/* Message */}
        <p className={`text-center mb-6 whitespace-pre-line ${
          isDark ? 'text-stone-400' : 'text-stone-600'
        }`}>
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className={`flex-1 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
              isDark 
                ? 'bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700' 
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 ${
              loading
                ? 'bg-rose-400 cursor-not-allowed'
                : 'bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-500/30'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Đang xử lý...
              </span>
            ) : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
