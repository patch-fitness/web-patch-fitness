import React, { useState, useEffect, useCallback } from 'react'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { Link, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import EquipmentCard from '@/components/EquipmentCard/EquipmentCard';
import AddEquipment from '@/components/AddEquipment/AddEquipment';
import Modal from '@/components/Modal/Modal';
import { toast } from 'react-toastify';
import axios from 'axios';
import { mockEquipment } from '@/data/mockData';
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog';
import { useTheme } from '@/contexts/ThemeContext';

const Equipment = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    
    const [addEquipment, setAddEquipment] = useState(false);
    const [data, setData] = useState([]);
    const [search, setSearch] = useState("");
    const [isSearchModeOn, setIsSearchModeOn] = useState(false);
    const [allEquipment, setAllEquipment] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const [startFrom, setStartFrom] = useState(0);
    const [endTo, setEndTo] = useState(9);
    const [totalData, setTotalData] = useState(0);
    const limit = 9;
    const [noOfPage, setNoOfPage] = useState(0);
    const [equipmentToDelete, setEquipmentToDelete] = useState(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchData = useCallback(async (skip, limits) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/equipment?gymId=1`);
            const equipment = response.data || [];
            
            setAllEquipment(equipment);
            
            const equipmentData = equipment.slice(skip, skip + limits);
            setData(equipmentData);
            
            const total = equipment.length;
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
            console.error("Lỗi khi tải dữ liệu thiết bị:", err);
            toast.error("Lỗi khi tải dữ liệu thiết bị. Sử dụng dữ liệu mẫu.");
            const equipmentData = mockEquipment.slice(skip, skip + limits);
            setData(equipmentData);
            setAllEquipment([...mockEquipment]);
            setTotalData(mockEquipment.length);
            setLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        fetchData(0, 9);
        setCurrentPage(1);
    }, []);

    const handleEquipment = () => {
        setAddEquipment(prev => !prev);
    }

    const handleAddSuccess = async (newEquipment) => {
        try {
            const equipmentData = {
                name: newEquipment.name,
                category: newEquipment.category || null,
                location: newEquipment.location || null,
                status: newEquipment.status || 'Available',
                condition: newEquipment.condition || 'Good',
                image: newEquipment.image || null,
                description: newEquipment.description || null,
                purchasePrice: newEquipment.purchasePrice || 0,
                purchaseDate: newEquipment.purchaseDate || null,
                maintenanceDate: newEquipment.maintenanceDate || null,
                maintenanceCost: newEquipment.maintenanceCost || 0,
                monthlyMaintenanceCost: 0,
                gymId: 1
            };
            
            await axios.post('http://localhost:5000/api/equipment', equipmentData);
            toast.success("Thêm thiết bị thành công!");
            
            await fetchData(0, 9);
        } catch (err) {
            console.error("Lỗi khi thêm thiết bị:", err);
            const errorMessage = err.response?.data?.message || err.message || "Lỗi khi thêm thiết bị!";
            toast.error(errorMessage);
        }
        
        setAddEquipment(false);
        setCurrentPage(1);
        setIsSearchModeOn(false);
        setSearch("");
    }

    const handlePrev = () => {
        if (currentPage !== 1) {
            const currPage = currentPage - 1;
            setCurrentPage(currPage);
            const from = (currPage - 1) * limit;
            const to = currPage * limit;
            setStartFrom(from);
            setEndTo(Math.min(to, totalData));
            fetchData(from, limit);
        }
    }

    const handleNext = () => {
        if (currentPage !== noOfPage) {
           const currPage = currentPage + 1;
            setCurrentPage(currPage);
            const from = (currPage - 1) * limit;
            const to = Math.min(currPage * limit, totalData);
            setStartFrom(from);
            setEndTo(to);
            fetchData(from, limit);
        }
    }

    const handleSearchData = async () => {
        if (!search.trim()) {
            toast.warning("Vui lòng nhập từ khóa tìm kiếm!");
            return;
        }
        
        setIsSearchModeOn(true);

        const keyword = search.toLowerCase();
        const filtered = allEquipment.filter(item => {
            const maintenanceDate = item.maintenanceDate ? item.maintenanceDate.toLowerCase() : "";
            const maintenanceCost = item.maintenanceCost !== undefined ? String(item.maintenanceCost) : "";
            const purchasePrice = item.purchasePrice !== undefined ? String(item.purchasePrice) : "";
            return (
                item.name.toLowerCase().includes(keyword) ||
                item.category.toLowerCase().includes(keyword) ||
                item.location.toLowerCase().includes(keyword) ||
                maintenanceDate.includes(keyword) ||
                maintenanceCost.includes(keyword) ||
                purchasePrice.includes(keyword)
            );
        });
        setData(filtered);
        setTotalData(filtered.length);
    }

    const handleClearSearch = () => {
        setSearch("");
        setIsSearchModeOn(false);
        fetchData(0, 9);
        setCurrentPage(1);
    }

    const handleDeleteClick = (equipment) => {
        setEquipmentToDelete(equipment);
        setIsDeleteDialogOpen(true);
    };

    const handleCancelDelete = () => {
        setEquipmentToDelete(null);
        setIsDeleteDialogOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (!equipmentToDelete) return;
        setDeleteLoading(true);
        try {
            await axios.delete(`http://localhost:5000/api/equipment/${equipmentToDelete.id}`);
            toast.success(`Đã xóa thiết bị ${equipmentToDelete.name}`);
            await fetchData(0, 9);
            setCurrentPage(1);
            setIsSearchModeOn(false);
            setSearch("");
        } catch (err) {
            console.error('Lỗi khi xóa thiết bị:', err);
            toast.error(err.response?.data?.message || 'Không thể xóa thiết bị');
        } finally {
            setDeleteLoading(false);
            handleCancelDelete();
        }
    };

    return (
        <div className={`min-h-screen p-6 lg:p-8 transition-colors duration-300 ${
            isDark ? 'bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950' : 'bg-gradient-to-br from-stone-50 via-primary-50/30 to-stone-100'
        }`}>
            {/* Page Header */}
            <div className="mb-8 animate-fade-in">
                <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-xl ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}>
                        <FitnessCenterIcon className="text-primary-500" sx={{ fontSize: 28 }} />
                    </div>
                    <h1 className={`text-3xl lg:text-4xl font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                        Quản lý thiết bị
                    </h1>
                </div>
                <p className={`text-lg ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                    Quản lý danh sách và tình trạng thiết bị phòng gym
                </p>
            </div>

            {/* Action Bar */}
            <div className={`flex flex-wrap items-center gap-3 p-4 rounded-2xl mb-6 backdrop-blur-xl transition-colors ${
                isDark ? 'bg-stone-800/50 border border-stone-700/50' : 'bg-white/70 border border-stone-200/50 shadow-sm'
            }`}>
                <button 
                    onClick={handleEquipment}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                        isDark 
                            ? 'bg-primary-500 hover:bg-primary-400 text-white shadow-lg shadow-primary-500/25' 
                            : 'bg-primary-500 hover:bg-primary-600 text-white shadow-md shadow-primary-500/30'
                    }`}
                >
                    <AddIcon sx={{ fontSize: 20 }} />
                    Thêm thiết bị
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
                        placeholder="Tìm kiếm theo tên, loại, vị trí..." 
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
                    Tổng: <span className="text-primary-500">{totalData}</span> thiết bị
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

            {/* Equipment Cards Grid */}
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
                            <EquipmentCard
                                key={item.id || index}
                                item={item}
                                onView={() => navigate(`/equipment/${item.id}`)}
                                onEdit={() => navigate(`/equipment/${item.id}?edit=1`)}
                                onDelete={() => handleDeleteClick(item)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                            isDark ? 'bg-stone-700' : 'bg-stone-100'
                        }`}>
                            <FitnessCenterIcon className={isDark ? 'text-stone-500' : 'text-stone-400'} sx={{ fontSize: 40 }} />
                        </div>
                        <p className={`text-xl font-medium mb-2 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                            Không có thiết bị nào
                        </p>
                        <p className={`text-sm ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                            Nhấn "Thêm thiết bị" để bắt đầu
                        </p>
                    </div>
                )}
            </div>

            {/* Modals */}
            {addEquipment && (
                <Modal 
                    header="Thêm thiết bị mới" 
                    handleClose={handleEquipment} 
                    content={<AddEquipment onSuccess={handleAddSuccess} />} 
                />
            )}
            {isDeleteDialogOpen && equipmentToDelete && (
                <ConfirmDialog
                    title="Xác nhận xóa thiết bị"
                    message={`Bạn có chắc chắn muốn xóa thiết bị "${equipmentToDelete.name}"?\nHành động này không thể hoàn tác.`}
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

export default Equipment
