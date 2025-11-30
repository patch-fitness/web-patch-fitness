import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { Link } from "react-router-dom";
import ConfirmDialog from "@/components/ConfirmDialog/ConfirmDialog";

// Icons as SVG components
const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CancelIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const PackageIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const PercentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const EmptyIcon = () => (
  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const PTCommissionSettings = () => {
  const [settings, setSettings] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gymId] = useState(localStorage.getItem('gymId') || '1');
  const [editMode, setEditMode] = useState(null);
  const [editValue, setEditValue] = useState({ type: 'Percentage', value: 0 });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSetting, setNewSetting] = useState({
    trainerId: '',
    membershipId: '',
    commissionType: 'Percentage',
    commissionValue: 30
  });
  const [settingToDelete, setSettingToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, trainersRes, membershipsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/expenses/pt-commission-settings?gymId=${gymId}`),
        axios.get(`http://localhost:5000/api/trainers?gymId=${gymId}`),
        axios.get(`http://localhost:5000/api/memberships?gymId=${gymId}`)
      ]);
      
      setSettings(settingsRes.data || []);
      setTrainers(trainersRes.data || []);
      setMemberships(membershipsRes.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu:", err);
      toast.error("Không thể tải cài đặt hoa hồng");
      setLoading(false);
    }
  };

  const handleSaveEdit = async (setting) => {
    try {
      await axios.put(
        'http://localhost:5000/api/expenses/pt-commission-settings',
        {
          trainerId: setting.trainer_id,
          membershipId: setting.membership_id,
          commissionType: editValue.type,
          commissionValue: parseFloat(editValue.value),
          gymId: parseInt(gymId)
        }
      );
      
      toast.success("Đã cập nhật cài đặt hoa hồng!");
      setEditMode(null);
      fetchData();
    } catch (err) {
      console.error("Lỗi khi cập nhật:", err);
      toast.error("Không thể cập nhật cài đặt");
    }
  };

  const handleAddNew = async () => {
    if (!newSetting.commissionValue || parseFloat(newSetting.commissionValue) <= 0) {
      toast.error("Giá trị hoa hồng phải lớn hơn 0!");
      return;
    }

    try {
      await axios.put(
        'http://localhost:5000/api/expenses/pt-commission-settings',
        {
          trainerId: newSetting.trainerId || null,
          membershipId: newSetting.membershipId || null,
          commissionType: newSetting.commissionType,
          commissionValue: parseFloat(newSetting.commissionValue),
          gymId: parseInt(gymId)
        }
      );
      
      toast.success("Đã thêm cài đặt mới!");
      setNewSetting({
        trainerId: '',
        membershipId: '',
        commissionType: 'Percentage',
        commissionValue: 30
      });
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      console.error("Lỗi khi thêm mới:", err);
      toast.error("Không thể thêm cài đặt mới");
    }
  };

  const getTrainerName = (trainerId) => {
    if (!trainerId) return 'Tất cả PT';
    const trainer = trainers.find(t => t.id === trainerId);
    return trainer?.name || `ID: ${trainerId}`;
  };

  const getMembershipName = (membershipId) => {
    if (!membershipId) return 'Tất cả gói';
    const membership = memberships.find(m => m.id === membershipId);
    return membership?.title || membership?.name || `ID: ${membershipId}`;
  };

  const formatCommission = (setting) => {
    if (setting.commission_type === 'Percentage') {
      return `${setting.commission_value}%`;
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(setting.commission_value);
  };

  const handleDeleteClick = (setting) => {
    setSettingToDelete(setting);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!settingToDelete) return;

    try {
      setDeleteLoading(true);
      await axios.delete(
        `http://localhost:5000/api/expenses/pt-commission-settings/${settingToDelete.id}`
      );
      
      toast.success("Đã xóa cài đặt hoa hồng thành công!");
      setIsDeleteDialogOpen(false);
      setSettingToDelete(null);
      fetchData();
    } catch (err) {
      console.error("Lỗi khi xóa:", err);
      const errorMessage = err.response?.data?.message || err.message || "Không thể xóa cài đặt";
      toast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setSettingToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-primary-50/20 to-stone-100 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <Link 
            to="/finance/dashboard" 
            className="inline-flex items-center gap-2 text-stone-500 hover:text-primary-600 dark:text-stone-400 dark:hover:text-primary-400 transition-colors mb-6 group"
          >
            <ArrowLeftIcon />
            <span className="group-hover:translate-x-1 transition-transform">Quay lại Dashboard</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
              <SettingsIcon />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-stone-900 dark:text-stone-50">
                Cài đặt Hoa hồng PT
              </h1>
              <p className="text-stone-600 dark:text-stone-400 mt-1">
                Quản lý tỷ lệ hoa hồng cho từng PT và gói tập
              </p>
            </div>
          </div>
        </header>

        {/* Add New Button / Form */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '50ms' }}>
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5"
            >
              <PlusIcon /> Thêm cài đặt mới
            </button>
          ) : (
            <div className="bg-white/70 dark:bg-stone-800/70 backdrop-blur-xl rounded-2xl p-6 border border-stone-200/50 dark:border-stone-700/50 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                  <span className="w-2 h-6 bg-primary-500 rounded-full" />
                  Thêm cài đặt hoa hồng mới
                </h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                >
                  <CancelIcon />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Trainer Select */}
                <div>
                  <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2 flex items-center gap-2">
                    <UserIcon /> Huấn luyện viên
                  </label>
                  <select
                    value={newSetting.trainerId}
                    onChange={(e) => setNewSetting({ ...newSetting, trainerId: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  >
                    <option value="">🌐 Tất cả PT</option>
                    {trainers.map(trainer => (
                      <option key={trainer.id} value={trainer.id}>👤 {trainer.name}</option>
                    ))}
                  </select>
                </div>

                {/* Membership Select */}
                <div>
                  <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2 flex items-center gap-2">
                    <PackageIcon /> Gói tập
                  </label>
                  <select
                    value={newSetting.membershipId}
                    onChange={(e) => setNewSetting({ ...newSetting, membershipId: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  >
                    <option value="">📦 Tất cả gói</option>
                    {memberships.map(membership => (
                      <option key={membership.id} value={membership.id}>
                        📋 {membership.title || membership.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Commission Type */}
                <div>
                  <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2 flex items-center gap-2">
                    <PercentIcon /> Loại hoa hồng
                  </label>
                  <select
                    value={newSetting.commissionType}
                    onChange={(e) => setNewSetting({ ...newSetting, commissionType: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  >
                    <option value="Percentage">📊 Phần trăm (%)</option>
                    <option value="Fixed">💵 Cố định (VND)</option>
                  </select>
                </div>

                {/* Commission Value */}
                <div>
                  <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
                    Giá trị
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newSetting.commissionValue}
                      onChange={(e) => setNewSetting({ ...newSetting, commissionValue: e.target.value })}
                      className="w-full px-4 py-3 pr-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                      placeholder="30"
                      min="0"
                      step="0.01"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">
                      {newSetting.commissionType === 'Percentage' ? '%' : '₫'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleAddNew}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-primary-500/25"
                >
                  <SaveIcon /> Lưu cài đặt
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl font-medium hover:bg-stone-200 dark:hover:bg-stone-600 transition-all"
                >
                  Hủy
                </button>
              </div>

              <p className="mt-4 text-sm text-stone-500 dark:text-stone-400 flex items-center gap-2">
                <span className="text-lg">💡</span>
                Để trống PT/Gói tập để tạo cài đặt mặc định áp dụng cho tất cả
              </p>
            </div>
          )}
        </div>

        {/* Settings List */}
        <div className="bg-white/70 dark:bg-stone-800/70 backdrop-blur-xl rounded-2xl border border-stone-200/50 dark:border-stone-700/50 shadow-lg overflow-hidden animate-fade-in" style={{ animationDelay: '100ms' }}>
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
              <p className="text-stone-600 dark:text-stone-400">Đang tải dữ liệu...</p>
            </div>
          ) : settings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-stone-100 dark:bg-stone-700 rounded-2xl flex items-center justify-center text-stone-400">
                <EmptyIcon />
              </div>
              <p className="text-lg font-medium text-stone-700 dark:text-stone-300 mb-2">Chưa có cài đặt nào</p>
              <p className="text-stone-500 dark:text-stone-400 mb-4">Hãy thêm cài đặt hoa hồng cho PT</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all"
              >
                <PlusIcon /> Thêm cài đặt đầu tiên
              </button>
            </div>
          ) : (
            <>
              {/* Settings Grid */}
              <div className="divide-y divide-stone-100 dark:divide-stone-700/50">
                {settings.map((setting, index) => (
                  <div 
                    key={index} 
                    className={`p-5 hover:bg-stone-50 dark:hover:bg-stone-700/30 transition-colors ${
                      setting.is_default ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                    }`}
                  >
                    {editMode === index ? (
                      // Edit Mode
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-stone-100 dark:bg-stone-700 rounded-xl flex items-center justify-center text-stone-500">
                              <UserIcon />
                            </div>
                            <div>
                              <p className="text-xs text-stone-500 dark:text-stone-400">PT</p>
                              <p className="font-medium text-stone-800 dark:text-stone-200">
                                {getTrainerName(setting.trainer_id)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <select
                              value={editValue.type}
                              onChange={(e) => setEditValue({ ...editValue, type: e.target.value })}
                              className="flex-1 px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                            >
                              <option value="Percentage">Phần trăm (%)</option>
                              <option value="Fixed">Cố định (VND)</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              value={editValue.value}
                              onChange={(e) => setEditValue({ ...editValue, value: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveEdit(setting)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-all"
                          >
                            <SaveIcon /> Lưu
                          </button>
                          <button
                            onClick={() => setEditMode(null)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg text-sm font-medium hover:bg-stone-200 dark:hover:bg-stone-600 transition-all"
                          >
                            <CancelIcon /> Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4 lg:gap-8">
                          {/* Trainer */}
                          <div className="flex items-center gap-3 min-w-[180px]">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              setting.trainer_id 
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                            }`}>
                              <UserIcon />
                            </div>
                            <div>
                              <p className="text-xs text-stone-500 dark:text-stone-400">Huấn luyện viên</p>
                              <p className={`font-medium ${
                                setting.trainer_id 
                                  ? 'text-stone-800 dark:text-stone-200'
                                  : 'text-primary-600 dark:text-primary-400'
                              }`}>
                                {setting.trainer_id ? getTrainerName(setting.trainer_id) : '🌐 Mặc định (tất cả)'}
                              </p>
                            </div>
                          </div>

                          {/* Membership */}
                          <div className="flex items-center gap-3 min-w-[180px]">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              setting.membership_id 
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
                            }`}>
                              <PackageIcon />
                            </div>
                            <div>
                              <p className="text-xs text-stone-500 dark:text-stone-400">Gói tập</p>
                              <p className={`font-medium ${
                                setting.membership_id 
                                  ? 'text-stone-800 dark:text-stone-200'
                                  : 'text-stone-600 dark:text-stone-400'
                              }`}>
                                {setting.membership_id ? getMembershipName(setting.membership_id) : '📦 Tất cả gói'}
                              </p>
                            </div>
                          </div>

                          {/* Commission Type */}
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                              setting.commission_type === 'Percentage'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            }`}>
                              {setting.commission_type === 'Percentage' ? '📊 Phần trăm' : '💵 Cố định'}
                            </span>
                          </div>

                          {/* Commission Value */}
                          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                            {formatCommission(setting)}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditMode(index);
                              setEditValue({
                                type: setting.commission_type,
                                value: setting.commission_value
                              });
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                          >
                            <EditIcon /> Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteClick(setting)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/20 rounded-lg hover:bg-accent-100 dark:hover:bg-accent-900/40 transition-colors"
                          >
                            <DeleteIcon /> Xóa
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Results Count */}
              <div className="px-6 py-4 bg-stone-50 dark:bg-stone-800/50 border-t border-stone-200 dark:border-stone-700">
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  Tổng cộng <span className="font-semibold text-stone-800 dark:text-stone-200">{settings.length}</span> cài đặt hoa hồng
                </p>
              </div>
            </>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-primary-50 dark:from-blue-900/20 dark:to-primary-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/30 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
            <span className="text-xl">💡</span> Cách hoạt động
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-400">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-200 dark:bg-blue-800 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <div>
                <strong>Cài đặt cụ thể</strong>: Áp dụng cho PT và gói tập được chỉ định
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-200 dark:bg-blue-800 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <div>
                <strong>Cài đặt mặc định</strong>: Áp dụng cho tất cả trường hợp không có cài đặt riêng
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-200 dark:bg-blue-800 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
              <div>
                <strong>Phần trăm</strong>: Tính theo % giá trị gói tập (VD: 30% của gói 1tr = 300k)
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-200 dark:bg-blue-800 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
              <div>
                <strong>Cố định</strong>: Số tiền cố định bất kể giá gói (VD: 200,000đ)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && settingToDelete && (
        <ConfirmDialog
          title="Xác nhận xóa cài đặt hoa hồng"
          message={`Bạn có chắc chắn muốn xóa cài đặt hoa hồng này?\n\nPT: ${getTrainerName(settingToDelete.trainer_id)}\nGói tập: ${getMembershipName(settingToDelete.membership_id)}\nHoa hồng: ${formatCommission(settingToDelete)}\n\nHành động này không thể hoàn tác.`}
          confirmText="Xóa"
          cancelText="Hủy"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          loading={deleteLoading}
        />
      )}

      <ToastContainer 
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

export default PTCommissionSettings;
