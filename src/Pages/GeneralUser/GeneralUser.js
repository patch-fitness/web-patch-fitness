import React, { useEffect, useState } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FilterListIcon from '@mui/icons-material/FilterList';
import { Link, useNavigate } from 'react-router-dom';
import MemberCard from '@/components/MemberCard/MemberCard';
import { getMonthlyJoined, threeDayExpire, fourToSevenDaysExpire, expired, inActiveMembers } from '@/data/data';
import { toast } from 'react-toastify';
import { useTheme } from '@/contexts/ThemeContext';

const GeneralUser = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    
    const [header, setHeader] = useState("");
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const func = sessionStorage.getItem('func') || 'monthlyJoined';
        functionCall(func);
    }, [])

    const functionCall = async (func) => {
        setLoading(true);
        setError("");
        let membersResponse = { members: [] };
        try {
            switch (func) {
                case "monthlyJoined":
                    setHeader("Hội viên tham gia trong tháng này");
                    membersResponse = await getMonthlyJoined();
                    break;

                case "threeDayExpire":
                    setHeader("Hội viên sắp hết hạn trong 3 ngày");
                    membersResponse = await threeDayExpire();
                    break;

                case "fourToSevenDaysExpire":
                    setHeader("Hội viên sắp hết hạn trong 4 - 7 ngày");
                    membersResponse = await fourToSevenDaysExpire();
                    break;

                case "expired":
                    setHeader("Hội viên đã hết hạn");
                    membersResponse = await expired();
                    break;

                case "inActiveMembers":
                    setHeader("Hội viên đang tạm ngưng");
                    membersResponse = await inActiveMembers();
                    break;

                default:
                    setHeader("Danh sách hội viên");
                    membersResponse = await getMonthlyJoined();
                    break;
            }
            setData(membersResponse.members || []);
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu hội viên theo bộ lọc:", err);
            const message = err.response?.data?.message || "Không thể tải dữ liệu hội viên. Vui lòng thử lại sau.";
            setError(message);
            setData([]);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }

    const handleViewMember = (member) => {
        if (!member?.id) return;
        navigate(`/member/${member.id}`);
    }

    return (
        <div className={`min-h-screen p-6 lg:p-8 transition-colors duration-300 ${
            isDark ? 'bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950' : 'bg-gradient-to-br from-stone-50 via-primary-50/30 to-stone-100'
        }`}>
            {/* Page Header */}
            <div className="mb-8 animate-fade-in">
                <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-xl ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}>
                        <FilterListIcon className="text-primary-500" sx={{ fontSize: 28 }} />
                    </div>
                    <h1 className={`text-3xl lg:text-4xl font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                        {header || 'Danh sách hội viên'}
                    </h1>
                </div>
                <p className={`text-lg ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                    Hiển thị {data.length} hội viên
                </p>
            </div>

            {/* Back Link */}
            <Link 
                to="/dashboard" 
                className={`inline-flex items-center gap-2 mb-6 text-sm font-medium transition-colors ${
                    isDark ? 'text-stone-400 hover:text-primary-400' : 'text-stone-600 hover:text-primary-600'
                }`}
            >
                <ArrowBackIcon sx={{ fontSize: 18 }} />
                Quay lại Bảng điều khiển
            </Link>

            {/* Content */}
            <div className={`p-6 rounded-2xl min-h-[500px] ${
                isDark ? 'bg-stone-800/30 border border-stone-700/30' : 'bg-white/50 border border-stone-200/50'
            }`}>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mb-4"></div>
                        <p className={`text-lg ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>Đang tải dữ liệu...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <p className="text-lg text-rose-500">{error}</p>
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                            isDark ? 'bg-stone-700' : 'bg-stone-100'
                        }`}>
                            <FilterListIcon className={isDark ? 'text-stone-500' : 'text-stone-400'} sx={{ fontSize: 40 }} />
                        </div>
                        <p className={`text-xl font-medium mb-2 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                            Không có hội viên phù hợp
                        </p>
                        <p className={`text-sm ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                            Không tìm thấy hội viên nào trong danh mục này
                        </p>
                    </div>
                ) : (
                    <div className='grid gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
                        {data.map((member) => (
                            <MemberCard
                                key={member.id}
                                item={member}
                                onView={() => handleViewMember(member)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default GeneralUser
