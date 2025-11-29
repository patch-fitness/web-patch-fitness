import React from 'react';
import CircleIcon from '@mui/icons-material/Circle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SchoolIcon from '@mui/icons-material/School';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

const DEFAULT_AVATAR = "https://th.bing.com/th/id/OIP.gj6t3grz5no6UZ03uIluiwHaHa?rs=1&pid=ImgDetMain";

const TrainerCard = ({trainer, onEdit, onDelete, onView}) => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    
    if (!trainer) return null;

    const canEdit = typeof onEdit === 'function';
    const canDelete = typeof onDelete === 'function';

    const getStatusColor = (status) => {
        switch(status) {
            case 'Active': return '#10b981';
            case 'Inactive': return '#f43f5e';
            default: return '#78716c';
        }
    }

    const getStatusLabel = (status) => {
        switch(status) {
            case 'Active': return 'Hoạt động';
            case 'Inactive': return 'Nghỉ';
            default: return status || 'N/A';
        }
    }

    const formatCurrency = (value) => {
        if (!value) return 'N/A';
        return Number(value).toLocaleString('vi-VN') + '₫';
    }

    const getProfileImageSrc = (src) => {
        if (!src || src === null || src === undefined || src === '') return DEFAULT_AVATAR;
        if (typeof src !== 'string') return DEFAULT_AVATAR;
        if (src.startsWith('http')) return src;
        const path = src.startsWith('/') ? src : `/${src}`;
        return `http://localhost:5000${path}`;
    };

    return (
        <div className={`group relative rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 ${
            isDark 
                ? 'bg-stone-800/80 border border-stone-700/50 hover:border-accent-500/50 hover:shadow-lg hover:shadow-accent-500/10' 
                : 'bg-white border border-stone-200 hover:border-accent-300 hover:shadow-xl hover:shadow-accent-500/10'
        }`}>
            {/* Status Badge */}
            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                trainer?.status === 'Active'
                    ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                    : isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'
            }`}>
                <CircleIcon sx={{ fontSize: 8 }} />
                {getStatusLabel(trainer?.status)}
            </div>

            {/* Avatar */}
            <div className="flex justify-center mb-4">
                <div className={`relative w-24 h-24 rounded-full p-1 ${
                    isDark ? 'bg-gradient-to-br from-accent-500/30 to-primary-500/30' : 'bg-gradient-to-br from-accent-200 to-primary-200'
                }`}>
                    <img 
                        className="w-full h-full rounded-full object-cover ring-2 ring-white dark:ring-stone-800" 
                        src={getProfileImageSrc(trainer?.profilePic)} 
                        alt={trainer?.name || 'Trainer'} 
                    />
                </div>
            </div>

            {/* Info */}
            <div className="text-center mb-4">
                <h3 className={`text-lg font-bold mb-1 truncate ${isDark ? 'text-white' : 'text-stone-900'}`}>
                    {trainer?.name || "N/A"}
                </h3>
                <p className={`text-sm font-mono ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                    {trainer?.mobileNo ? `+84 ${trainer.mobileNo}` : "Chưa có SĐT"}
                </p>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-4">
                {trainer?.degree && (
                    <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                        <SchoolIcon sx={{ fontSize: 16 }} className="text-primary-500" />
                        <span className="truncate">{trainer.degree}</span>
                    </div>
                )}
                {trainer?.salary && (
                    <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                        <AttachMoneyIcon sx={{ fontSize: 16 }} className="text-accent-500" />
                        <span>{formatCurrency(trainer.salary)}</span>
                    </div>
                )}
            </div>

            {/* Gender Badge */}
            {trainer?.sex && (
                <div className="flex justify-center mb-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        trainer.sex === 'Male' 
                            ? isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-700'
                            : isDark ? 'bg-pink-500/20 text-pink-400' : 'bg-pink-100 text-pink-700'
                    }`}>
                        {trainer.sex === 'Male' ? '👨 Nam' : '👩 Nữ'}
                    </span>
                </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
                <button
                    onClick={() => onView ? onView(trainer) : navigate(`/trainers/${trainer?.id}`)}
                    className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isDark 
                            ? 'bg-accent-500/20 text-accent-400 hover:bg-accent-500 hover:text-white' 
                            : 'bg-accent-50 text-accent-600 hover:bg-accent-500 hover:text-white'
                    }`}
                >
                    <VisibilityIcon sx={{ fontSize: 18 }} />
                    Xem chi tiết
                </button>
                
                {(canEdit || canDelete) && (
                    <div className="flex gap-2">
                        {canEdit && (
                            <button
                                onClick={() => onEdit(trainer)}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    isDark 
                                        ? 'bg-stone-700 text-stone-300 hover:bg-amber-500/20 hover:text-amber-400' 
                                        : 'bg-stone-100 text-stone-600 hover:bg-amber-100 hover:text-amber-700'
                                }`}
                            >
                                <EditIcon sx={{ fontSize: 16 }} />
                                Sửa
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={() => onDelete(trainer)}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    isDark 
                                        ? 'bg-stone-700 text-stone-300 hover:bg-rose-500/20 hover:text-rose-400' 
                                        : 'bg-stone-100 text-stone-600 hover:bg-rose-100 hover:text-rose-700'
                                }`}
                            >
                                <DeleteIcon sx={{ fontSize: 16 }} />
                                Xóa
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default TrainerCard;
