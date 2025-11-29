import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link, useNavigate } from "react-router-dom";

const AddExpense = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [gymId] = useState(localStorage.getItem('gymId') || '1');
  const [formData, setFormData] = useState({
    expense_type: 'Operating',
    category: '',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_status: 'Pending',
    payment_method: '',
    paid_date: '',
    notes: ''
  });

  const expenseTypes = [
    { value: 'Operating', label: 'Vận hành', hasCategories: true, categories: ['Tiền điện', 'Tiền nước', 'Tiền thuê mặt bằng', 'Internet', 'Khác'] },
    { value: 'Salary', label: 'Lương nhân viên', hasCategories: false },
    { value: 'Marketing', label: 'Quảng cáo', hasCategories: false },
    { value: 'Other', label: 'Khác', hasCategories: false, isCustomInput: true }
  ];

  const currentType = expenseTypes.find(t => t.value === formData.expense_type) || expenseTypes[0];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleExpenseTypeChange = (newType) => {
    setFormData(prev => ({
      ...prev,
      expense_type: newType,
      category: '' // Reset category when expense type changes
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.description || !formData.amount) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    // Validation cho category: bắt buộc nếu là "Vận hành" hoặc "Khác"
    if ((formData.expense_type === 'Operating' || formData.expense_type === 'Other') && !formData.category) {
      toast.error("Vui lòng chọn/nhập danh mục!");
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error("Số tiền phải lớn hơn 0!");
      return;
    }

    try {
      setLoading(true);
      
      // Nếu không phải "Vận hành" hoặc "Khác", set category = expense_type label
      let finalCategory = formData.category;
      if (formData.expense_type !== 'Operating' && formData.expense_type !== 'Other') {
        const typeLabel = expenseTypes.find(t => t.value === formData.expense_type)?.label || formData.expense_type;
        finalCategory = typeLabel;
      }

      // Nếu không chọn ngày, không gửi expense_date (backend sẽ dùng thời gian hiện tại)
      const expenseData = {
        ...formData,
        category: finalCategory,
        amount: parseFloat(formData.amount),
        gymId: parseInt(gymId),
        created_by: 'Admin', // TODO: Get from auth context
        // Chỉ gửi expense_date nếu có giá trị, nếu không backend sẽ dùng thời gian hiện tại
        expense_date: formData.expense_date && formData.expense_date.trim() !== '' 
          ? formData.expense_date 
          : undefined
      };

      await axios.post('http://localhost:5000/api/expenses', expenseData);
      
      toast.success("Đã thêm chi phí thành công!");
      setTimeout(() => {
        navigate('/finance');
      }, 1500);
    } catch (err) {
      console.error("Lỗi khi thêm chi phí:", err);
      toast.error(err.response?.data?.message || "Không thể thêm chi phí!");
      setLoading(false);
    }
  };

  return (
    <div className="text-black p-5 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Link to="/finance" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
          <ArrowBackIcon /> <span className="ml-2">Quay lại</span>
        </Link>

        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Thêm Chi Phí Mới</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Expense Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại Chi Phí <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.expense_type}
                onChange={(e) => handleExpenseTypeChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                {expenseTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Category - Chỉ hiển thị khi chọn "Vận hành" */}
            {currentType.hasCategories && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh Mục <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">-- Chọn danh mục --</option>
                  {currentType.categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom Category Input - Chỉ hiển thị khi chọn "Khác" */}
            {currentType.isCustomInput && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Loại Chi Phí <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập tên loại chi phí..."
                  required
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô Tả <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="3"
                placeholder="Mô tả chi tiết về khoản chi phí này..."
                required
              />
            </div>

            {/* Amount and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số Tiền (VND) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                  min="0"
                  step="1000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày Chi
                  <span className="text-gray-500 text-xs ml-2">(Để trống sẽ dùng ngày giờ hiện tại)</span>
                </label>
                <input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => handleChange('expense_date', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Payment Status and Method */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng Thái Thanh Toán
                </label>
                <select
                  value={formData.payment_status}
                  onChange={(e) => handleChange('payment_status', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Pending">Chưa thanh toán</option>
                  <option value="Paid">Đã thanh toán</option>
                </select>
              </div>

              {formData.payment_status === 'Paid' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phương Thức Thanh Toán
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => handleChange('payment_method', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Chọn --</option>
                    <option value="Cash">Tiền mặt</option>
                    <option value="Transfer">Chuyển khoản</option>
                    <option value="Card">Thẻ</option>
                  </select>
                </div>
              )}
            </div>

            {/* Paid Date */}
            {formData.payment_status === 'Paid' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày Thanh Toán
                </label>
                <input
                  type="date"
                  value={formData.paid_date}
                  onChange={(e) => handleChange('paid_date', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi Chú
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="2"
                placeholder="Ghi chú thêm (không bắt buộc)..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {loading ? 'Đang lưu...' : 'Lưu Chi Phí'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/finance')}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default AddExpense;

