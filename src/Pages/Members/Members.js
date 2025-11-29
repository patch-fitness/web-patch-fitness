import React, { useState, useEffect, useCallback, useRef } from 'react'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AddIcon from '@mui/icons-material/Add';
import { Link, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PeopleIcon from '@mui/icons-material/People';
import ClearIcon from '@mui/icons-material/Clear';
import MemberCard from '@/components/MemberCard/MemberCard';
import AddMemberShip from '@/components/AddMembership/AddMembership';
import AddMembers from '@/components/AddMembers/AddMembers';
import Modal from '@/components/Modal/Modal';
import { toast } from 'react-toastify';
import axios from 'axios';
import { getGymId } from '@/utils/gymUtils';
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog';
import { useTheme } from '@/contexts/ThemeContext';

const Members = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    
    const [addMembership, setAddMemberShip] = useState(false);
    const [addMember, setAddMember] = useState(false);
    const [data, setData] = useState([]);
    const [search, setSearch] = useState("");
    const [isSearchModeOn, setIsSearchModeOn] = useState(false);
    const [allMembers, setAllMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const [startFrom, setStartFrom] = useState(0);
    const [endTo, setEndTo] = useState(9);
    const [totalData, setTotalData] = useState(0);
    const limit = 9;
    const [noOfPage, setNoOfPage] = useState(0);
    const [memberToDelete, setMemberToDelete] = useState(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const deleteClickRef = useRef(false);
    const isDeletingRef = useRef(false);


    const fetchData = useCallback(async (skip, limits) => {
        if (isDeletingRef.current) {
            return;
        }
        
        try {
            const gymId = getGymId();
            const response = await axios.get(`http://localhost:5000/api/members?gymId=${gymId}`);
            const members = response.data || [];
            
            setAllMembers(members);
            
            const membersData = members.slice(skip, skip + limits);
            setData(membersData);
            
            const total = members.length;
            setTotalData(total);

            const extraPage = total % limit === 0 ? 0 : 1;
            const totalPage = parseInt(total / limit + extraPage);
            setNoOfPage(totalPage);

            if(total === 0) {
                setStartFrom(-1);
                setEndTo(0);
            } else {
                setStartFrom(skip);
                setEndTo(Math.min(skip + limits, total));
            }
            
            setLoading(false);
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu thành viên:", err);
            toast.error("Không thể tải dữ liệu thành viên. Vui lòng thử lại sau.");
            setData([]);
            setAllMembers([]);
            setTotalData(0);
            setStartFrom(-1);
            setEndTo(0);
            setNoOfPage(0);
            setLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        fetchData(0, limit);
    }, [fetchData]);

    const handleMemberShip = () => {
        setAddMemberShip(prev => !prev);
    }

    const handleMembers = () => {
        setAddMember(prev => !prev);
    }

    const handlePrev = () => {
        if (currentPage !== 1) {
            const currPage = currentPage - 1;
            setCurrentPage(currPage);
            const from = (currPage - 1) * limit;
            fetchData(from, limit);
        }
    }

    const handleNext = () => {
        if (currentPage !== noOfPage) {
            const currPage = currentPage + 1;
            setCurrentPage(currPage);
            const from = (currPage - 1) * limit;
            fetchData(from, limit);
        }
    }

    const handleSearchData = async () => {
        if (!search.trim()) {
            return;
        }
        
        setIsSearchModeOn(true);
        
        const filtered = allMembers.filter(item => 
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            (item.mobileNo && item.mobileNo.toLowerCase().includes(search.toLowerCase()))
        );
        setData(filtered);
        setTotalData(filtered.length);
    }

    const handleClearSearch = () => {
        setSearch("");
        setIsSearchModeOn(false);
        fetchData(0, 9);
        setCurrentPage(1);
    }

    const handleDeleteClick = (member) => {
        if (deleteClickRef.current || isDeleteDialogOpen) {
            return;
        }
        deleteClickRef.current = true;
        setMemberToDelete(member);
        setIsDeleteDialogOpen(true);
        setTimeout(() => {
            deleteClickRef.current = false;
        }, 300);
    };

    const handleCancelDelete = () => {
        setMemberToDelete(null);
        setIsDeleteDialogOpen(false);
        deleteClickRef.current = false;
    };

    const handleConfirmDelete = async () => {
        if (!memberToDelete) return;
        setDeleteLoading(true);
        
        const memberIdToDelete = memberToDelete.id;
        const memberName = memberToDelete.name;
        const currentPageBeforeDelete = currentPage;
        
        const previousAllMembers = [...allMembers];
        const previousData = [...data];
        const previousTotalData = totalData;
        const previousCurrentPage = currentPage;
        
        isDeletingRef.current = true;
        
        try {
            const updatedAllMembers = allMembers.filter(m => m.id !== memberIdToDelete);
            const newTotalData = updatedAllMembers.length;
            
            let pageToShow = currentPageBeforeDelete;
            let membersData = [];
            let skip = 0;
            
            if (newTotalData === 0) {
                pageToShow = 1;
                membersData = [];
                skip = 0;
            } else {
                const maxPage = Math.ceil(newTotalData / limit);
                
                if (pageToShow > maxPage) {
                    pageToShow = maxPage;
                }
                
                skip = (pageToShow - 1) * limit;
                membersData = updatedAllMembers.slice(skip, skip + limit);
            }
            
            setAllMembers(updatedAllMembers);
            setData(membersData);
            setTotalData(newTotalData);
            
            if (newTotalData === 0) {
                setCurrentPage(1);
                setStartFrom(-1);
                setEndTo(0);
                setNoOfPage(0);
            } else {
                setCurrentPage(pageToShow);
                const extraPage = newTotalData % limit === 0 ? 0 : 1;
                const totalPage = parseInt(newTotalData / limit + extraPage);
                setNoOfPage(totalPage);
                setStartFrom(skip);
                setEndTo(Math.min(skip + limit, newTotalData));
            }
            
            handleCancelDelete();
            
            const url = `http://localhost:5000/api/members/${memberIdToDelete}?force=true&hard=true`;
            
            await axios.delete(url);
            
            toast.success(`Đã xóa hội viên ${memberName} khỏi database`);
            
            setIsSearchModeOn(false);
            setSearch("");
            
            setTimeout(() => {
                isDeletingRef.current = false;
            }, 1000);
            
        } catch (err) {
            console.error('❌ Lỗi khi xóa hội viên:', err);
            
            isDeletingRef.current = false;
            
            setAllMembers(previousAllMembers);
            setData(previousData);
            setTotalData(previousTotalData);
            setCurrentPage(previousCurrentPage);
            
            const errorMessage = err.response?.data?.message || err.message || 'Không thể xóa hội viên';
            toast.error(errorMessage);
            handleCancelDelete();
            
            const currentSkip = (previousCurrentPage - 1) * limit;
            await fetchData(currentSkip, limit);
        } finally {
            setDeleteLoading(false);
        }
    };


    const handleAddSuccess = async (newMember) => {
        try {
            await fetchData(0, 9);
        } catch (err) {
            console.error("Lỗi khi refresh danh sách:", err);
        }
        
        setAddMember(false);
        setCurrentPage(1);
        setIsSearchModeOn(false);
        setSearch("");
    }

    const handleMembershipAdded = (newMembership) => {
        toast.success("Gói tập đã được thêm! Danh sách gói tập sẽ được cập nhật.");
    }

    return (
        <div className={`min-h-screen p-6 lg:p-8 transition-colors duration-300 ${
            isDark ? 'bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950' : 'bg-gradient-to-br from-stone-50 via-primary-50/30 to-stone-100'
        }`}>
            {/* Page Header */}
            <div className="mb-8 animate-fade-in">
                <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-xl ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}>
                        <PeopleIcon className="text-primary-500" sx={{ fontSize: 28 }} />
                    </div>
                    <h1 className={`text-3xl lg:text-4xl font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                        Quản lý thành viên
                    </h1>
                </div>
                <p className={`text-lg ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                    Quản lý hồ sơ và gói tập của thành viên
                </p>
            </div>

            {/* Action Bar */}
            <div className={`flex flex-wrap items-center gap-3 p-4 rounded-2xl mb-6 backdrop-blur-xl transition-colors ${
                isDark ? 'bg-stone-800/50 border border-stone-700/50' : 'bg-white/70 border border-stone-200/50 shadow-sm'
            }`}>
                <button 
                    onClick={handleMembers}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                        isDark 
                            ? 'bg-primary-500 hover:bg-primary-400 text-white shadow-lg shadow-primary-500/25' 
                            : 'bg-primary-500 hover:bg-primary-600 text-white shadow-md shadow-primary-500/30'
                    }`}
                >
                    <AddIcon sx={{ fontSize: 20 }} />
                    Thêm thành viên
                </button>
                
                <button 
                    onClick={handleMemberShip}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                        isDark 
                            ? 'bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600' 
                            : 'bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 shadow-sm'
                    }`}
                >
                    <FitnessCenterIcon sx={{ fontSize: 20 }} />
                    Gói Tập
                </button>
                
                <button 
                    onClick={() => navigate('/subscriptions/create')}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                        isDark 
                            ? 'bg-accent-500/20 hover:bg-accent-500/30 text-accent-400 border border-accent-500/30' 
                            : 'bg-accent-50 hover:bg-accent-100 text-accent-600 border border-accent-200'
                    }`}
                >
                    🎯 Tạo Gói Tập Mới
                </button>
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

            {/* Search Bar */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="relative flex-1 max-w-md">
                    <SearchIcon 
                        className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-stone-500' : 'text-stone-400'}`} 
                        sx={{ fontSize: 20 }} 
                    />
                    <input 
                        type="text" 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        onKeyPress={(e) => { if (e.key === 'Enter') handleSearchData(); }}
                        className={`w-full pl-12 pr-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                            isDark 
                                ? 'bg-stone-800/50 border border-stone-700 text-white placeholder-stone-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20' 
                                : 'bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm'
                        }`} 
                        placeholder="Tìm kiếm theo tên hoặc số điện thoại..." 
                    />
                </div>
                
                <button 
                    onClick={handleSearchData}
                    className={`px-5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                        isDark 
                            ? 'bg-primary-500 hover:bg-primary-400 text-white' 
                            : 'bg-primary-500 hover:bg-primary-600 text-white shadow-sm'
                    }`}
                >
                    Tìm kiếm
                </button>
                
                {isSearchModeOn && (
                    <button 
                        onClick={handleClearSearch}
                        className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                            isDark 
                                ? 'bg-stone-700 hover:bg-stone-600 text-stone-300' 
                                : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                        }`}
                    >
                        <ClearIcon sx={{ fontSize: 18 }} />
                        Xóa tìm kiếm
                    </button>
                )}
            </div>

            {/* Stats Bar */}
            <div className={`flex flex-wrap items-center justify-between gap-4 mb-6 p-4 rounded-xl ${
                isDark ? 'bg-stone-800/30' : 'bg-white/50'
            }`}>
                <div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-stone-800'}`}>
                    Tổng: <span className="text-primary-500">{totalData}</span> thành viên
                </div>
                
                {!isSearchModeOn && totalData > 0 && (
                    <div className="flex items-center gap-4">
                        <span className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                            {startFrom + 1} - {endTo} / {totalData}
                        </span>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={handlePrev}
                                disabled={currentPage === 1}
                                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 ${
                                    currentPage === 1
                                        ? isDark ? 'bg-stone-800 text-stone-600 cursor-not-allowed' : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                                        : isDark ? 'bg-stone-700 hover:bg-primary-500 text-white' : 'bg-white hover:bg-primary-500 hover:text-white text-stone-700 shadow-sm'
                                }`}
                            >
                                <ChevronLeftIcon sx={{ fontSize: 20 }} />
                            </button>
                            
                            <button 
                                onClick={handleNext}
                                disabled={currentPage === noOfPage || noOfPage === 0}
                                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 ${
                                    currentPage === noOfPage || noOfPage === 0
                                        ? isDark ? 'bg-stone-800 text-stone-600 cursor-not-allowed' : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                                        : isDark ? 'bg-stone-700 hover:bg-primary-500 text-white' : 'bg-white hover:bg-primary-500 hover:text-white text-stone-700 shadow-sm'
                                }`}
                            >
                                <ChevronRightIcon sx={{ fontSize: 20 }} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Member Cards Grid */}
            <div className={`p-6 rounded-2xl min-h-[500px] ${
                isDark ? 'bg-stone-800/30 border border-stone-700/30' : 'bg-white/50 border border-stone-200/50'
            }`}>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mb-4"></div>
                        <p className={`text-lg ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>Đang tải dữ liệu...</p>
                    </div>
                ) : data.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                        {data.map((item, index) => (
                            <MemberCard
                                key={item.id || index}
                                item={item}
                                onView={() => navigate(`/member/${item.id}`)}
                                onEdit={() => navigate(`/member/${item.id}?edit=1`)}
                                onDelete={() => handleDeleteClick(item)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                            isDark ? 'bg-stone-700' : 'bg-stone-100'
                        }`}>
                            <PeopleIcon className={isDark ? 'text-stone-500' : 'text-stone-400'} sx={{ fontSize: 40 }} />
                        </div>
                        <p className={`text-xl font-medium mb-2 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                            Không có thành viên nào
                        </p>
                        <p className={`text-sm ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                            Nhấn "Thêm thành viên" để bắt đầu
                        </p>
                    </div>
                )}
            </div>

            {/* Modals */}
            {addMembership && (
                <Modal 
                    header="Thêm gói tập" 
                    handleClose={handleMemberShip} 
                    content={<AddMemberShip onSuccess={handleMembershipAdded} />} 
                />
            )}
            {addMember && (
                <Modal 
                    header="Thêm thành viên mới" 
                    handleClose={handleMembers} 
                    content={<AddMembers onSuccess={handleAddSuccess} onMembershipAdded={handleMembershipAdded} />} 
                />
            )}
            {isDeleteDialogOpen && memberToDelete && (
                <ConfirmDialog
                    title="Xác nhận xóa"
                    message={`Bạn có chắc chắn muốn xóa hội viên "${memberToDelete.name}"?\n\nNếu xóa, không thể khôi phục lại.`}
                    confirmText="Xóa"
                    cancelText="Hủy"
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                    loading={deleteLoading}
                />
            )}
        </div>
    )
}

export default Members
