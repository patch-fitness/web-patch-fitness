import React, { useState, useEffect, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { Link } from "react-router-dom";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const FinanceDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('this_month');
  const [gymId] = useState(localStorage.getItem('gymId') || '1');

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const [calculatingSalary, setCalculatingSalary] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/finance/dashboard?gymId=${gymId}&period=${period}`
      );
      setDashboardData(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Lỗi khi tải dashboard:", err);
      toast.error("Không thể tải dữ liệu tài chính");
      setLoading(false);
    }
  };

  const handleCalculatePTSalaries = async () => {
    if (!window.confirm('Bạn có chắc muốn tính lương PT cho tháng này? Hệ thống sẽ tạo expenses cho các PT có member active.')) {
      return;
    }

    try {
      setCalculatingSalary(true);
      const response = await axios.post(
        `http://localhost:5000/api/finance/calculate-pt-salaries?gymId=${gymId}&period=${period}`
      );
      
      const { expenses_created, total_amount, trainers_with_active_members } = response.data;
      
      if (expenses_created > 0) {
        toast.success(
          `Đã tạo ${expenses_created} chi phí lương PT. Tổng: ${total_amount.toLocaleString('vi-VN')} VND`
        );
      } else if (trainers_with_active_members === 0) {
        toast.info('Không có PT nào có member active trong tháng này.');
      } else {
        toast.info('Tất cả PT đã có expense cho tháng này rồi.');
      }
      
      // Refresh dashboard
      await fetchDashboardData();
    } catch (err) {
      console.error("Lỗi khi tính lương PT:", err);
      toast.error(err.response?.data?.message || "Không thể tính lương PT");
    } finally {
      setCalculatingSalary(false);
    }
  };

  const handleCleanupPTExpenses = async () => {
    if (!window.confirm('Bạn có chắc muốn dọn dẹp tất cả chi phí PT không hợp lệ? Hệ thống sẽ xóa các chi phí PT của trainer không còn member active.')) {
      return;
    }

    try {
      setCleaningUp(true);
      // Sử dụng route calculatePTSalaries với tham số cleanupOnly=true
      const url = `http://localhost:5000/api/finance/calculate-pt-salaries?gymId=${gymId}&period=${period}&cleanupOnly=true`;
      
      const response = await axios.post(url);
      
      const { deleted_count } = response.data;
      
      if (deleted_count > 0) {
        toast.success(
          `Đã xóa ${deleted_count} chi phí PT không hợp lệ`
        );
      } else {
        toast.info('Không có chi phí PT không hợp lệ cần xóa.');
      }
      
      // Refresh dashboard
      await fetchDashboardData();
    } catch (err) {
      console.error("Lỗi khi dọn dẹp chi phí PT:", err);
      toast.error(err.response?.data?.message || err.message || "Không thể dọn dẹp chi phí PT");
    } finally {
      setCleaningUp(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value || 0);
  };


  // Chuyển đổi expense_type từ tiếng Anh sang tiếng Việt
  const translateExpenseType = (type) => {
    const typeMap = {
      'Operating': 'Vận hành',
      'Salary': 'Lương nhân viên',
      'Marketing': 'Quảng cáo',
      'Maintenance': 'Bảo trì',
      'Equipment': 'Mua sắm thiết bị',
      'PT_Commission': 'Lương PT',
      'Other': 'Khác'
    };
    return typeMap[type] || type;
  };

  // Prepare data for charts
  const expenseTypeData = useMemo(() => {
    if (!dashboardData?.expenses_by_type) return [];
    return dashboardData.expenses_by_type.map(item => ({
      name: translateExpenseType(item.expense_type),
      value: parseFloat(item.total),
      count: item.count
    }));
  }, [dashboardData]);

  const trendData = useMemo(() => {
    if (!dashboardData?.trends) return [];
    const months = new Set([
      ...dashboardData.trends.revenue.map(r => r.month),
      ...dashboardData.trends.expense.map(e => e.month)
    ]);
    
    return Array.from(months).sort().map(month => {
      const rev = dashboardData.trends.revenue.find(r => r.month === month);
      const exp = dashboardData.trends.expense.find(e => e.month === month);
      return {
        month,
        revenue: parseFloat(rev?.total || 0),
        expense: parseFloat(exp?.total || 0),
        profit: parseFloat(rev?.total || 0) - parseFloat(exp?.total || 0)
      };
    });
  }, [dashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl text-gray-600">Đang tải dữ liệu...</div>
      </div>
    );
  }

  const summary = dashboardData?.summary || {};

  return (
    <div className="text-black p-5 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <Link to="/dashboard" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4">
          <ArrowBackIcon /> <span className="ml-2">Quay lại Dashboard</span>
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Tài chính</h1>
            <p className="text-gray-600 mt-1">Quản lý thu chi và báo cáo tài chính</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="today">Hôm nay</option>
              <option value="this_week">Tuần này</option>
              <option value="this_month">Tháng này</option>
              <option value="last_month">Tháng trước</option>
              <option value="this_year">Năm nay</option>
            </select>
            <Link
              to="/finance/transactions"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Xem chi tiết
            </Link>
            <Link
              to="/finance/add-expense"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Thêm chi phí
            </Link>
            <Link
              to="/finance/pt-commission"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Cài đặt hoa hồng PT
            </Link>
            <button
              onClick={handleCalculatePTSalaries}
              disabled={calculatingSalary || cleaningUp}
              className={`px-4 py-2 rounded-lg transition-colors ${
                calculatingSalary || cleaningUp
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
              title="Tính lương PT dựa trên số member active"
            >
              {calculatingSalary ? 'Đang tính...' : '💰 Tính Lương PT'}
            </button>
            <button
              onClick={handleCleanupPTExpenses}
              disabled={cleaningUp || calculatingSalary}
              className={`px-4 py-2 rounded-lg transition-colors ${
                cleaningUp || calculatingSalary
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
              title="Xóa tất cả chi phí PT không hợp lệ (trainer không còn member active)"
            >
              {cleaningUp ? 'Đang dọn dẹp...' : '🗑️ Dọn Dẹp Chi Phí PT'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Tổng Doanh Thu</p>
              <p className="text-2xl font-bold text-emerald-600 mt-2">
                {formatCurrency(summary.total_revenue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {summary.revenue_transactions} giao dịch
              </p>
            </div>
            <TrendingUpIcon sx={{ fontSize: 48, color: '#10b981' }} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-rose-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Tổng Chi Phí</p>
              <p className="text-2xl font-bold text-rose-600 mt-2">
                {formatCurrency(summary.total_expense)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {summary.expense_transactions} giao dịch
              </p>
            </div>
            <TrendingDownIcon sx={{ fontSize: 48, color: '#ef4444' }} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-sky-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Lợi Nhuận</p>
              <p className={`text-2xl font-bold mt-2 ${summary.profit >= 0 ? 'text-sky-600' : 'text-rose-600'}`}>
                {formatCurrency(summary.profit)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Margin: {summary.profit_margin}%
              </p>
            </div>
            <AccountBalanceWalletIcon sx={{ fontSize: 48, color: '#0ea5e9' }} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 shadow-md text-white">
          <p className="text-sm font-medium opacity-90">Tỷ lệ Chi/Thu</p>
          <p className="text-3xl font-bold mt-2">
            {summary.total_revenue > 0 
              ? ((summary.total_expense / summary.total_revenue) * 100).toFixed(1)
              : 0}%
          </p>
          <div className="mt-3 bg-white/20 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-500"
              style={{ 
                width: `${Math.min((summary.total_expense / summary.total_revenue) * 100, 100)}%` 
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue vs Expense Trend */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Xu hướng Doanh thu & Chi phí (6 tháng)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Doanh thu" strokeWidth={2} />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" name="Chi phí" strokeWidth={2} />
              <Line type="monotone" dataKey="profit" stroke="#3b82f6" name="Lợi nhuận" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Expense by Type Pie Chart */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Cơ cấu Chi phí theo loại
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {expenseTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Payment Method */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Doanh thu theo phương thức thanh toán
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={(dashboardData?.revenue_by_payment_method || []).map(item => ({
              ...item,
              payment_method: item.payment_method === 'Cash' ? 'Tiền mặt' 
                : item.payment_method === 'Transfer' ? 'Chuyển khoản'
                : item.payment_method === 'Card' ? 'Thẻ'
                : item.payment_method
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="payment_method" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="total" fill="#10b981" name="Doanh thu" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Details Table */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Chi tiết Chi phí theo loại
          </h3>
          <div className="overflow-auto max-h-80">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Loại chi phí</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Số lượng</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                {expenseTypeData.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{item.count}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-rose-600">
                      {formatCurrency(item.value)}
                    </td>
                  </tr>
                ))}
                {expenseTypeData.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                      Chưa có chi phí nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default FinanceDashboard;

