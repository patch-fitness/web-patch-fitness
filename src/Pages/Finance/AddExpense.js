import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

// Icons as SVG components
const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const SaveIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const CancelIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const MoneyIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CategoryIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const CreditCardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const NoteIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

// Expense type icons
const expenseTypeIcons = {
  Operating: '⚙️',
  Salary: '💼',
  Marketing: '📢',
  Other: '📦'
};

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
    { value: 'Operating', label: 'Vận hành', icon: '⚙️', hasCategories: true, categories: ['Tiền điện', 'Tiền nước', 'Tiền thuê mặt bằng', 'Internet', 'Khác'], color: 'bg-blue-500' },
    { value: 'Salary', label: 'Lương nhân viên', icon: '💼', hasCategories: false, color: 'bg-emerald-500' },
    { value: 'Marketing', label: 'Quảng cáo', icon: '📢', hasCategories: false, color: 'bg-purple-500' },
    { value: 'Other', label: 'Khác', icon: '📦', hasCategories: false, isCustomInput: true, color: 'bg-stone-500' }
  ];

  const currentType = expenseTypes.find(t => t.value === formData.expense_type) || expenseTypes[0];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleExpenseTypeChange = (newType) => {
    setFormData(prev => ({
      ...prev,
      expense_type: newType,
      category: ''
    }));
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    const numValue = value.toString().replace(/\D/g, '');
    return new Intl.NumberFormat('vi-VN').format(numValue);
  };

  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    handleChange('amount', rawValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

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
      
      let finalCategory = formData.category;
      if (formData.expense_type !== 'Operating' && formData.expense_type !== 'Other') {
        const typeLabel = expenseTypes.find(t => t.value === formData.expense_type)?.label || formData.expense_type;
        finalCategory = typeLabel;
      }

      const expenseData = {
        ...formData,
        category: finalCategory,
        amount: parseFloat(formData.amount),
        gymId: parseInt(gymId),
        created_by: 'Admin',
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
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-accent-50/20 to-stone-100 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <Link 
            to="/finance" 
            className="inline-flex items-center gap-2 text-stone-500 hover:text-primary-600 dark:text-stone-400 dark:hover:text-primary-400 transition-colors mb-6 group"
          >
            <ArrowLeftIcon />
            <span className="group-hover:translate-x-1 transition-transform">Quay lại</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-accent-500/25">
              <MoneyIcon />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-stone-900 dark:text-stone-50">
                Thêm Chi Phí Mới
              </h1>
              <p className="text-stone-600 dark:text-stone-400 mt-1">
                Ghi nhận khoản chi tiêu cho phòng gym
              </p>
            </div>
          </div>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          {/* Expense Type Selection */}
          <div className="bg-white/70 dark:bg-stone-800/70 backdrop-blur-xl rounded-2xl p-6 border border-stone-200/50 dark:border-stone-700/50 shadow-lg">
            <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4 flex items-center gap-2">
              <CategoryIcon />
              Loại Chi Phí <span className="text-accent-500">*</span>
            </label>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {expenseTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleExpenseTypeChange(type.value)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.expense_type === type.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg shadow-primary-500/10'
                      : 'border-stone-200 dark:border-stone-700 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-stone-800'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">{type.icon}</span>
                    <span className={`text-sm font-medium ${
                      formData.expense_type === type.value
                        ? 'text-primary-700 dark:text-primary-300'
                        : 'text-stone-700 dark:text-stone-300'
                    }`}>
                      {type.label}
                    </span>
                  </div>
                  {formData.expense_type === type.value && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selection - Only for Operating */}
          {currentType.hasCategories && (
            <div className="bg-white/70 dark:bg-stone-800/70 backdrop-blur-xl rounded-2xl p-6 border border-stone-200/50 dark:border-stone-700/50 shadow-lg animate-fade-in">
              <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4">
                Danh Mục <span className="text-accent-500">*</span>
              </label>
              
              <div className="flex flex-wrap gap-2">
                {currentType.categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleChange('category', cat)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      formData.category === cat
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                        : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Category Input - Only for Other */}
          {currentType.isCustomInput && (
            <div className="bg-white/70 dark:bg-stone-800/70 backdrop-blur-xl rounded-2xl p-6 border border-stone-200/50 dark:border-stone-700/50 shadow-lg animate-fade-in">
              <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">
                Tên Loại Chi Phí <span className="text-accent-500">*</span>
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                placeholder="Nhập tên loại chi phí..."
                required
              />
            </div>
          )}

          {/* Description */}
          <div className="bg-white/70 dark:bg-stone-800/70 backdrop-blur-xl rounded-2xl p-6 border border-stone-200/50 dark:border-stone-700/50 shadow-lg">
            <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2">
              <DocumentIcon />
              Mô Tả <span className="text-accent-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none"
              rows="3"
              placeholder="Mô tả chi tiết về khoản chi phí này..."
              required
            />
          </div>

          {/* Amount and Date Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount */}
            <div className="bg-white/70 dark:bg-stone-800/70 backdrop-blur-xl rounded-2xl p-6 border border-stone-200/50 dark:border-stone-700/50 shadow-lg">
              <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2">
                <MoneyIcon />
                Số Tiền (VND) <span className="text-accent-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formatCurrency(formData.amount)}
                  onChange={handleAmountChange}
                  className="w-full px-4 py-3 pr-16 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 text-lg font-semibold placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  placeholder="0"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">VND</span>
              </div>
              {formData.amount && (
                <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                  ≈ {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(formData.amount)}
                </p>
              )}
            </div>

            {/* Date */}
            <div className="bg-white/70 dark:bg-stone-800/70 backdrop-blur-xl rounded-2xl p-6 border border-stone-200/50 dark:border-stone-700/50 shadow-lg">
              <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2">
                <CalendarIcon />
                Ngày Chi
              </label>
              <input
                type="date"
                value={formData.expense_date}
                onChange={(e) => handleChange('expense_date', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
              />
              <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                Để trống sẽ sử dụng thời gian hiện tại
              </p>
            </div>
          </div>

          {/* Payment Status and Method */}
          <div className="bg-white/70 dark:bg-stone-800/70 backdrop-blur-xl rounded-2xl p-6 border border-stone-200/50 dark:border-stone-700/50 shadow-lg">
            <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4 flex items-center gap-2">
              <CreditCardIcon />
              Trạng Thái Thanh Toán
            </label>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => handleChange('payment_status', 'Pending')}
                className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 ${
                  formData.payment_status === 'Pending'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-stone-200 dark:border-stone-700 hover:border-amber-300'
                }`}
              >
                <span className="text-2xl">⏳</span>
                <span className={`font-medium ${
                  formData.payment_status === 'Pending' 
                    ? 'text-amber-700 dark:text-amber-300' 
                    : 'text-stone-700 dark:text-stone-300'
                }`}>
                  Chưa thanh toán
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleChange('payment_status', 'Paid')}
                className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 ${
                  formData.payment_status === 'Paid'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-stone-200 dark:border-stone-700 hover:border-emerald-300'
                }`}
              >
                <span className="text-2xl">✅</span>
                <span className={`font-medium ${
                  formData.payment_status === 'Paid' 
                    ? 'text-emerald-700 dark:text-emerald-300' 
                    : 'text-stone-700 dark:text-stone-300'
                }`}>
                  Đã thanh toán
                </span>
              </button>
            </div>

            {/* Payment Method - Only show when Paid */}
            {formData.payment_status === 'Paid' && (
              <div className="space-y-4 pt-4 border-t border-stone-200 dark:border-stone-700 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-3">
                    Phương Thức Thanh Toán
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'Cash', label: 'Tiền mặt', icon: '💵' },
                      { value: 'Transfer', label: 'Chuyển khoản', icon: '🏦' },
                      { value: 'Card', label: 'Thẻ', icon: '💳' }
                    ].map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => handleChange('payment_method', method.value)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                          formData.payment_method === method.value
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                            : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
                        }`}
                      >
                        <span>{method.icon}</span>
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
                    Ngày Thanh Toán
                  </label>
                  <input
                    type="date"
                    value={formData.paid_date}
                    onChange={(e) => handleChange('paid_date', e.target.value)}
                    className="w-full md:w-auto px-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white/70 dark:bg-stone-800/70 backdrop-blur-xl rounded-2xl p-6 border border-stone-200/50 dark:border-stone-700/50 shadow-lg">
            <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2">
              <NoteIcon />
              Ghi Chú
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none"
              rows="2"
              placeholder="Ghi chú thêm (không bắt buộc)..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-white transition-all ${
                loading 
                  ? 'bg-stone-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5'
              }`}
            >
              {loading ? <SpinnerIcon /> : <SaveIcon />}
              {loading ? 'Đang lưu...' : 'Lưu Chi Phí'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/finance')}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-all"
            >
              <CancelIcon />
              Hủy
            </button>
          </div>
        </form>
      </div>

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

export default AddExpense;
