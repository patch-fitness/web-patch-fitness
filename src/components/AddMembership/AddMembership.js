import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify';
import { useTheme } from '@/contexts/ThemeContext';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';

const AddMemberShip = ({ onSuccess }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [inputField, setInputField] = useState({ 
        months: "", 
        price: "", 
        title: "",
        has_trainer: false
    });
    const [membershipList, setMembershipList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const handleOnChange = (event, name) => {
        setInputField({ ...inputField, [name]: event.target.value })
    }

    const fetchMembership = async () => {
        try {
            const gymId = localStorage.getItem('gymId') || '1';
            const response = await axios.get(`http://localhost:5000/api/memberships?gymId=${gymId}`);
            const memberships = response.data || [];
            setMembershipList(memberships);
        } catch (err) {
            console.error("Lỗi khi tải danh sách gói tập:", err);
            toast.error("Lỗi khi tải danh sách gói tập");
        }
    }

    useEffect(() => {
        fetchMembership();
    }, [])

    const handleHasTrainerChange = (checked) => {
        setInputField({ ...inputField, has_trainer: checked });
    }

    const handleDeleteMembership = async (membership) => {
        if (!membership?.id) return;
        const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa gói tập "${membership.title || membership.name}"?`);
        if (!confirmDelete) return;

        try {
            setDeletingId(membership.id);
            await axios.delete(`http://localhost:5000/api/memberships/${membership.id}`);
            toast.success(`Đã xóa gói tập ${membership.title || membership.name}`);
            setMembershipList(prev => prev.filter(item => item.id !== membership.id));
            window.dispatchEvent(new Event('membershipDeleted'));
        } catch (error) {
            console.error("Lỗi khi xóa gói tập:", error);
            toast.error(error.response?.data?.message || "Không thể xóa gói tập");
        } finally {
            setDeletingId(null);
        }
    };

    const handleAddMembership = async () => {
        if (!inputField.months || !inputField.price) {
            toast.error("Vui lòng điền đầy đủ thông tin (Số tháng và Giá)!");
            return;
        }

        const months = parseInt(inputField.months, 10);
        const price = parseFloat(inputField.price);

        if (isNaN(months) || months <= 0) {
            toast.error("Số tháng phải là số dương!");
            return;
        }

        if (isNaN(price) || price <= 0) {
            toast.error("Giá phải là số dương!");
            return;
        }

        setLoading(true);
        try {
            const gymId = parseInt(localStorage.getItem('gymId') || '1', 10);
            const title = inputField.title || `Gói ${months} tháng${inputField.has_trainer ? ' (Có HLV)' : ''}`;
            
            const membershipData = {
                title: title,
                name: title,
                price: price,
                duration_in_months: months,
                package_type: inputField.has_trainer ? 'VIP' : 'Normal',
                gymId: gymId,
                has_trainer: inputField.has_trainer
            };

            const response = await axios.post('http://localhost:5000/api/memberships', membershipData);
            
            toast.success("Thêm gói tập thành công!");

            if (onSuccess) {
                onSuccess(response.data);
            }

            window.dispatchEvent(new Event('membershipAdded'));
            await fetchMembership();

            setInputField({ 
                months: "", 
                price: "", 
                title: "",
                has_trainer: false
            });
        } catch (err) {
            console.error("Lỗi khi thêm gói tập:", err);
            const errorMessage = err.response?.data?.message || err.message || "Thêm gói tập thất bại!";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    const inputClass = `w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
        isDark 
            ? 'bg-stone-800 border border-stone-700 text-white placeholder-stone-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20' 
            : 'bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
    }`;

    const labelClass = `block mb-2 text-sm font-medium ${isDark ? 'text-stone-300' : 'text-stone-700'}`;

    return (
        <div className={isDark ? 'text-stone-200' : 'text-stone-800'}>
            {/* Danh sách gói tập hiện có */}
            <div className='mb-6'>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                    Danh sách gói tập hiện có
                </h3>
                <div className='flex flex-wrap gap-3'>
                    {membershipList.length > 0 ? (
                        membershipList.map((item) => (
                            <div 
                                key={item.id} 
                                className={`relative group px-4 py-3 rounded-xl font-medium transition-all ${
                                    item.has_trainer 
                                        ? isDark 
                                            ? 'bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white' 
                                            : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                                        : isDark 
                                            ? 'bg-stone-700 text-stone-200' 
                                            : 'bg-stone-200 text-stone-800'
                                }`}
                            >
                                <button
                                    className='absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100'
                                    onClick={() => handleDeleteMembership(item)}
                                    disabled={deletingId === item.id}
                                    title='Xóa gói tập'
                                >
                                    {deletingId === item.id ? "…" : <DeleteIcon sx={{ fontSize: 14 }} />}
                                </button>
                                <div className='flex items-center gap-2'>
                                    {item.has_trainer && <span>✨</span>}
                                    <span>{item.title || item.name || `${item.months || item.duration_in_months} Tháng`}</span>
                                    {item.has_trainer && (
                                        <span className='text-xs bg-white/20 px-2 py-0.5 rounded'>VIP</span>
                                    )}
                                </div>
                                <div className='text-sm mt-1 opacity-80'>
                                    {item.price ? `${item.price.toLocaleString('vi-VN')} ₫` : 'N/A'}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={`text-sm ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                            Chưa có gói tập nào
                        </div>
                    )}
                </div>
            </div>

            <hr className={`my-6 ${isDark ? 'border-stone-700' : 'border-stone-300'}`} />
            
            {/* Form thêm gói tập mới */}
            <div className='space-y-4'>
                {/* Tên gói tập */}
                <div>
                    <label className={labelClass}>Tên gói tập (tùy chọn)</label>
                    <input 
                        value={inputField.title} 
                        onChange={(event) => handleOnChange(event, "title")} 
                        className={inputClass}
                        type='text' 
                        placeholder="Ví dụ: Gói 1 tháng, Gói VIP 3 tháng..." 
                    />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                    {/* Số tháng */}
                    <div>
                        <label className={labelClass}>Số tháng *</label>
                        <input 
                            value={inputField.months} 
                            onChange={(event) => handleOnChange(event, "months")} 
                            className={inputClass}
                            type='number' 
                            min="1"
                            placeholder="Nhập số tháng" 
                        />
                    </div>

                    {/* Giá */}
                    <div>
                        <label className={labelClass}>Giá (VND) *</label>
                        <input 
                            value={inputField.price} 
                            onChange={(event) => handleOnChange(event, "price")} 
                            className={inputClass}
                            type='number' 
                            min="0"
                            step="1000"
                            placeholder="Nhập giá" 
                        />
                    </div>
                </div>

                {/* Checkbox VIP */}
                <div className={`p-4 rounded-xl border transition-colors ${
                    isDark 
                        ? 'bg-purple-500/10 border-purple-500/30' 
                        : 'bg-purple-50 border-purple-200'
                }`}>
                    <label className='flex items-start cursor-pointer'>
                        <input
                            type='checkbox'
                            checked={inputField.has_trainer}
                            onChange={(e) => handleHasTrainerChange(e.target.checked)}
                            className='w-5 h-5 mt-0.5 mr-3 cursor-pointer accent-purple-600'
                        />
                        <div>
                            <div className={`font-semibold ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                                ✨ Gói VIP - Có Huấn luyện viên cá nhân
                            </div>
                            <div className={`text-sm mt-1 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                                Tích vào đây nếu gói tập này bao gồm huấn luyện viên hướng dẫn cá nhân
                            </div>
                        </div>
                    </label>
                    {inputField.has_trainer && (
                        <div className={`mt-3 p-3 rounded-lg text-sm ${
                            isDark 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        }`}>
                            ✓ Gói này sẽ yêu cầu phân công huấn luyện viên khi tạo subscription
                        </div>
                    )}
                </div>

                {/* Nút thêm */}
                <button 
                    onClick={handleAddMembership}
                    disabled={loading}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                        loading 
                            ? 'bg-stone-400 cursor-not-allowed text-white' 
                            : isDark 
                                ? 'bg-primary-500 hover:bg-primary-400 text-white shadow-lg shadow-primary-500/25' 
                                : 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                    }`}
                >
                    <AddCircleIcon sx={{ fontSize: 20 }} />
                    {loading ? 'Đang thêm...' : 'Thêm gói tập'}
                </button>
            </div>
        </div>
    )
}

export default AddMemberShip
