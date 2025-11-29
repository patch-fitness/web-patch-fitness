import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import { Link } from "react-router-dom";
import ConfirmDialog from "@/components/ConfirmDialog/ConfirmDialog";

const PTCommissionSettings = () => {
  const [settings, setSettings] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gymId] = useState(localStorage.getItem('gymId') || '1');
  const [editMode, setEditMode] = useState(null);
  const [editValue, setEditValue] = useState({ type: 'Percentage', value: 0 });
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
      fetchData();
    } catch (err) {
      console.error("Lỗi khi thêm mới:", err);
      toast.error("Không thể thêm cài đặt mới");
    }
  };

  const getTrainerName = (trainerId) => {
    if (!trainerId) return 'Mặc định (tất cả PT)';
    const trainer = trainers.find(t => t.id === trainerId);
    return trainer?.name || `ID: ${trainerId}`;
  };

  const getMembershipName = (membershipId) => {
    if (!membershipId) return 'Mặc định (tất cả gói)';
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
    <div className="text-black p-5 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Link to="/finance/dashboard" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
          <ArrowBackIcon /> <span className="ml-2">Quay lại Dashboard</span>
        </Link>

        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Cài đặt Hoa hồng PT</h1>
          <p className="text-gray-600 mb-6">
            Quản lý tỷ lệ hoa hồng cho từng PT hoặc từng gói tập. Cài đặt cụ thể sẽ ưu tiên hơn cài đặt mặc định.
          </p>

          {/* Add New Setting */}
          <div className="bg-indigo-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Thêm cài đặt mới</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <select
                value={newSetting.trainerId}
                onChange={(e) => setNewSetting({ ...newSetting, trainerId: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tất cả PT</option>
                {trainers.map(trainer => (
                  <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
                ))}
              </select>

              <select
                value={newSetting.membershipId}
                onChange={(e) => setNewSetting({ ...newSetting, membershipId: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tất cả gói tập</option>
                {memberships.map(membership => (
                  <option key={membership.id} value={membership.id}>
                    {membership.title || membership.name}
                  </option>
                ))}
              </select>

              <select
                value={newSetting.commissionType}
                onChange={(e) => setNewSetting({ ...newSetting, commissionType: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Percentage">Phần trăm (%)</option>
                <option value="Fixed">Cố định (VND)</option>
              </select>

              <input
                type="number"
                value={newSetting.commissionValue}
                onChange={(e) => setNewSetting({ ...newSetting, commissionValue: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Giá trị"
                min="0"
                step="0.01"
              />

              <button
                onClick={handleAddNew}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Thêm mới
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              💡 Để trống để tạo cài đặt mặc định cho tất cả PT/gói tập
            </p>
          </div>

          {/* Settings List */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Huấn luyện viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gói tập
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hoa hồng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : settings.length > 0 ? (
                  settings.map((setting, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {setting.is_default ? (
                          <span className="text-indigo-600 font-semibold">
                            {getTrainerName(setting.trainer_id)}
                          </span>
                        ) : (
                          getTrainerName(setting.trainer_id)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getMembershipName(setting.membership_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editMode === index ? (
                          <select
                            value={editValue.type}
                            onChange={(e) => setEditValue({ ...editValue, type: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded"
                          >
                            <option value="Percentage">Phần trăm</option>
                            <option value="Fixed">Cố định</option>
                          </select>
                        ) : (
                          <span className="text-sm text-gray-600">
                            {setting.commission_type === 'Percentage' ? 'Phần trăm' : 'Cố định'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editMode === index ? (
                          <input
                            type="number"
                            value={editValue.value}
                            onChange={(e) => setEditValue({ ...editValue, value: e.target.value })}
                            className="w-24 px-2 py-1 border border-gray-300 rounded"
                            min="0"
                            step="0.01"
                          />
                        ) : (
                          <span className="text-lg font-semibold text-indigo-600">
                            {formatCommission(setting)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editMode === index ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(setting)}
                              className="text-green-600 hover:text-green-800"
                              title="Lưu"
                            >
                              <SaveIcon />
                            </button>
                            <button
                              onClick={() => setEditMode(null)}
                              className="text-gray-600 hover:text-gray-800"
                              title="Hủy"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={() => {
                                setEditMode(index);
                                setEditValue({
                                  type: setting.commission_type,
                                  value: setting.commission_value
                                });
                              }}
                              className="text-indigo-600 hover:text-indigo-800"
                              title="Chỉnh sửa"
                            >
                              <EditIcon />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(setting)}
                              className="text-red-600 hover:text-red-800"
                              title="Xóa"
                            >
                              <DeleteIcon />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Chưa có cài đặt nào. Hãy thêm cài đặt mới bên trên.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h4 className="font-semibold text-blue-800 mb-2">Cách hoạt động:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Cài đặt cụ thể</strong>: Áp dụng cho PT và gói tập được chỉ định</li>
              <li>• <strong>Cài đặt mặc định</strong>: Áp dụng cho tất cả các trường hợp không có cài đặt cụ thể</li>
              <li>• <strong>Phần trăm</strong>: Tính theo % giá trị gói tập (ví dụ: 30% = 300,000đ cho gói 1tr)</li>
              <li>• <strong>Cố định</strong>: Số tiền cố định bất kể giá gói tập (ví dụ: 200,000đ)</li>
            </ul>
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

      <ToastContainer />
    </div>
  );
};

export default PTCommissionSettings;

