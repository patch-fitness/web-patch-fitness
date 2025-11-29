import React from 'react'
import CircleIcon from '@mui/icons-material/Circle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

const DEFAULT_AVATAR = "https://th.bing.com/th/id/OIP.gj6t3grz5no6UZ03uIluiwHaHa?rs=1&pid=ImgDetMain";

const MemberCard = ({item, onEdit, onDelete, onView}) => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    
    if (!item) return null;
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
            case 'Inactive': return 'Không hoạt động';
            default: return status || 'N/A';
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return dateString.slice(0,10).split('-').reverse().join('/');
        } catch {
            return 'N/A';
        }
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
                ? 'bg-stone-800/80 border border-stone-700/50 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10' 
                : 'bg-white border border-stone-200 hover:border-primary-300 hover:shadow-xl hover:shadow-primary-500/10'
        }`}>
            {/* Status Badge */}
            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                item?.status === 'Active'
                    ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                    : isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'
            }`}>
                <CircleIcon sx={{ fontSize: 8 }} />
                {getStatusLabel(item?.status)}
            </div>

            {/* Avatar */}
            <div className="flex justify-center mb-4">
                <div className={`relative w-24 h-24 rounded-full p-1 ${
                    isDark ? 'bg-gradient-to-br from-primary-500/30 to-accent-500/30' : 'bg-gradient-to-br from-primary-200 to-accent-200'
                }`}>
                    <img 
                        className="w-full h-full rounded-full object-cover ring-2 ring-white dark:ring-stone-800" 
                        src={getProfileImageSrc(item?.profilePic)} 
                        alt={item?.name || 'Member'} 
                    />
                </div>
            </div>

            {/* Info */}
            <div className="text-center mb-4">
                <h3 className={`text-lg font-bold mb-1 truncate ${isDark ? 'text-white' : 'text-stone-900'}`}>
                    {item?.name || "N/A"}
                </h3>
                <p className={`text-sm font-mono ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                    {item?.mobileNo ? `+84 ${item.mobileNo}` : "Chưa có SĐT"}
                </p>
            </div>

            {/* Date Info */}
            <div className={`flex items-center justify-center gap-2 text-xs mb-5 ${
                isDark ? 'text-stone-500' : 'text-stone-500'
            }`}>
                <CalendarTodayIcon sx={{ fontSize: 14 }} />
                {item?.nextBillDate ? (
                    <span>Hết hạn: <span className={isDark ? 'text-primary-400' : 'text-primary-600'}>{formatDate(item.nextBillDate)}</span></span>
                ) : item?.joinDate ? (
                    <span>Tham gia: {formatDate(item.joinDate)}</span>
                ) : (
                    <span>N/A</span>
                )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
                <button
                    onClick={() => onView ? onView(item) : navigate(`/member/${item?.id}`)}
                    className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isDark 
                            ? 'bg-primary-500/20 text-primary-400 hover:bg-primary-500 hover:text-white' 
                            : 'bg-primary-50 text-primary-600 hover:bg-primary-500 hover:text-white'
                    }`}
                >
                    <VisibilityIcon sx={{ fontSize: 18 }} />
                    Xem chi tiết
                </button>
                
                {(canEdit || canDelete) && (
                    <div className="flex gap-2">
                        {canEdit && (
                            <button
                                onClick={() => onEdit(item)}
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
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (onDelete) {
                                        onDelete(item);
                                    }
                                }}
                                type="button"
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

export default MemberCard
