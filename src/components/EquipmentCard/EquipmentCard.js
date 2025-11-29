import React from 'react'
import CircleIcon from '@mui/icons-material/Circle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BuildIcon from '@mui/icons-material/Build';
import { useTheme } from '@/contexts/ThemeContext';

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=300&fit=crop";

const EquipmentCard = ({item, onView, onEdit, onDelete}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const getStatusConfig = (status) => {
        switch(status) {
            case 'Available': 
                return { 
                    color: '#10b981', 
                    label: 'Sẵn sàng',
                    bgClass: isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                };
            case 'In Use': 
                return { 
                    color: '#f59e0b', 
                    label: 'Đang sử dụng',
                    bgClass: isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                };
            case 'Maintenance': 
                return { 
                    color: '#f43f5e', 
                    label: 'Bảo trì',
                    bgClass: isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'
                };
            case 'Broken': 
                return { 
                    color: '#ef4444', 
                    label: 'Hỏng',
                    bgClass: isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                };
            default: 
                return { 
                    color: '#78716c', 
                    label: status || 'N/A',
                    bgClass: isDark ? 'bg-stone-500/20 text-stone-400' : 'bg-stone-100 text-stone-700'
                };
        }
    }

    const getCategoryLabel = (category) => {
        switch(category) {
            case 'Cardio': return 'Cardio';
            case 'Muscle': return 'Tập cơ';
            case 'Accessory': return 'Phụ kiện';
            default: return category || 'Chưa phân loại';
        }
    }

    const formatCurrency = (value) => {
        if (value === null || value === undefined || isNaN(value)) return 'N/A';
        return Number(value).toLocaleString('vi-VN') + '₫';
    };

    const getImageSrc = (src) => {
        if (!src || src === null || src === undefined || src === '') return DEFAULT_IMAGE;
        if (typeof src !== 'string') return DEFAULT_IMAGE;
        if (src.startsWith('http')) return src;
        const path = src.startsWith('/') ? src : `/${src}`;
        return `http://localhost:5000${path}`;
    };

    const statusConfig = getStatusConfig(item?.status);

    return (
        <div className={`group relative rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 ${
            isDark 
                ? 'bg-stone-800/80 border border-stone-700/50 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10' 
                : 'bg-white border border-stone-200 hover:border-primary-300 hover:shadow-xl hover:shadow-primary-500/10'
        }`}>
            {/* Status Badge */}
            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${statusConfig.bgClass}`}>
                <CircleIcon sx={{ fontSize: 8 }} />
                {statusConfig.label}
            </div>

            {/* Image */}
            <div className="flex justify-center mb-4">
                <div className={`relative w-28 h-28 rounded-xl overflow-hidden ${
                    isDark ? 'ring-2 ring-stone-700' : 'ring-2 ring-stone-200'
                }`}>
                    <img 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                        src={getImageSrc(item?.image)} 
                        alt={item?.name || 'Equipment'} 
                    />
                </div>
            </div>

            {/* Info */}
            <div className="text-center mb-3">
                <h3 className={`text-lg font-bold mb-1 truncate ${isDark ? 'text-white' : 'text-stone-900'}`}>
                    {item?.name || "Thiết bị"}
                </h3>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    isDark ? 'bg-primary-500/20 text-primary-400' : 'bg-primary-100 text-primary-700'
                }`}>
                    {getCategoryLabel(item?.category)}
                </span>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-4">
                <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                    <LocationOnIcon sx={{ fontSize: 16 }} className="text-primary-500" />
                    <span className="truncate">{item?.location || "Chưa xác định"}</span>
                </div>
                <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                    <BuildIcon sx={{ fontSize: 16 }} className="text-accent-500" />
                    <span>Chi phí bảo trì: {formatCurrency(item?.maintenanceCost)}</span>
                </div>
            </div>

            {/* Price Tag */}
            <div className={`text-center py-2 px-3 rounded-lg mb-4 ${
                isDark ? 'bg-stone-700/50' : 'bg-stone-100'
            }`}>
                <span className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>Giá mua</span>
                <p className={`text-lg font-bold ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
                    {formatCurrency(item?.purchasePrice)}
                </p>
            </div>

            {/* Actions */}
            <div className="space-y-2">
                <button
                    onClick={() => onView && onView(item)}
                    className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isDark 
                            ? 'bg-primary-500/20 text-primary-400 hover:bg-primary-500 hover:text-white' 
                            : 'bg-primary-50 text-primary-600 hover:bg-primary-500 hover:text-white'
                    }`}
                >
                    <VisibilityIcon sx={{ fontSize: 18 }} />
                    Xem chi tiết
                </button>
                
                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit && onEdit(item)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                            isDark 
                                ? 'bg-stone-700 text-stone-300 hover:bg-amber-500/20 hover:text-amber-400' 
                                : 'bg-stone-100 text-stone-600 hover:bg-amber-100 hover:text-amber-700'
                        }`}
                    >
                        <EditIcon sx={{ fontSize: 16 }} />
                        Sửa
                    </button>
                    <button
                        onClick={() => onDelete && onDelete(item)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                            isDark 
                                ? 'bg-stone-700 text-stone-300 hover:bg-rose-500/20 hover:text-rose-400' 
                                : 'bg-stone-100 text-stone-600 hover:bg-rose-100 hover:text-rose-700'
                        }`}
                    >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                        Xóa
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EquipmentCard
