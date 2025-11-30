import React, { useState, useEffect, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Link } from "react-router-dom";

// Icons as SVG components for better performance
const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const TrendUpIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendDownIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

const WalletIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const ListIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CalcIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// Custom colors for charts - aligned with design system
const CHART_COLORS = {
  revenue: '#14b8a6',    // primary-500 teal
  expense: '#f43f5e',    // accent-500 coral
  profit: '#3b82f6',     // blue
  pie: ['#14b8a6', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899']
};

const FinanceDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('this_month');
  const [gymId] = useState(localStorage.getItem('gymId') || '1');
  const [calculatingSalary, setCalculatingSalary] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [activeView, setActiveView] = useState('overview'); // overview, charts, details

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

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
      const url = `http://localhost:5000/api/finance/calculate-pt-salaries?gymId=${gymId}&period=${period}&cleanupOnly=true`;
      
      const response = await axios.post(url);
      
      const { deleted_count } = response.data;
      
      if (deleted_count > 0) {
        toast.success(`Đã xóa ${deleted_count} chi phí PT không hợp lệ`);
      } else {
        toast.info('Không có chi phí PT không hợp lệ cần xóa.');
      }
      
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

  const formatShortCurrency = (value) => {
    if (value >= 1000000000) {
      return (value / 1000000000).toFixed(1) + ' tỷ';
    }
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + ' tr';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'k';
    }
    return value?.toString() || '0';
  };

  const translateExpenseType = (type) => {
    const typeMap = {
      'Operating': 'Vận hành',
      'Salary': 'Lương nhân viên',
      'Marketing': 'Quảng cáo',
      'Maintenance': 'Bảo trì',
      'Equipment': 'Thiết bị',
      'PT_Commission': 'Lương PT',
      'Other': 'Khác'
    };
    return typeMap[type] || type;
  };

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
        month: month.slice(5), // Only show MM part
        revenue: parseFloat(rev?.total || 0),
        expense: parseFloat(exp?.total || 0),
        profit: parseFloat(rev?.total || 0) - parseFloat(exp?.total || 0)
      };
    });
  }, [dashboardData]);

  const paymentMethodData = useMemo(() => {
    if (!dashboardData?.revenue_by_payment_method) return [];
    return dashboardData.revenue_by_payment_method.map(item => ({
      name: item.payment_method === 'Cash' ? 'Tiền mặt' 
        : item.payment_method === 'Transfer' ? 'Chuyển khoản'
        : item.payment_method === 'Card' ? 'Thẻ'
        : item.payment_method,
      value: parseFloat(item.total),
      count: item.count
    }));
  }, [dashboardData]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-stone-800 px-4 py-3 rounded-xl shadow-xl border border-stone-200 dark:border-stone-700">
          <p className="text-sm font-semibold text-stone-700 dark:text-stone-200 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-lg text-stone-600 dark:text-stone-400 font-medium">Đang tải dữ liệu tài chính...</p>
        </div>
      </div>
    );
  }

  const summary = dashboardData?.summary || {};
  const profitMargin = summary.profit_margin || 0;
  const expenseRatio = summary.total_revenue > 0 
    ? ((summary.total_expense / summary.total_revenue) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-primary-50/20 to-stone-100 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-6 lg:p-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center gap-2 text-stone-500 hover:text-primary-600 dark:text-stone-400 dark:hover:text-primary-400 transition-colors mb-6 group"
          >
            <ArrowLeftIcon />
            <span className="group-hover:translate-x-1 transition-transform">Quay lại Dashboard</span>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-stone-900 dark:text-stone-50 mb-2">
                Quản lý <span className="text-gradient">Tài chính</span>
              </h1>
              <p className="text-lg text-stone-600 dark:text-stone-400">
                Theo dõi doanh thu, chi phí và báo cáo tài chính của phòng gym
              </p>
            </div>

            {/* Period Selector */}
            <div className="flex items-center gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-700 dark:text-stone-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all cursor-pointer min-w-[160px]"
              >
                <option value="today">📅 Hôm nay</option>
                <option value="this_week">📆 Tuần này</option>
                <option value="this_month">🗓️ Tháng này</option>
                <option value="last_month">📋 Tháng trước</option>
                <option value="this_year">📊 Năm nay</option>
              </select>
            </div>
          </div>
        </header>

        {/* Quick Actions Bar */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <div className="bg-white/70 dark:bg-stone-800/70 backdrop-blur-xl rounded-2xl p-4 border border-stone-200/50 dark:border-stone-700/50 shadow-lg">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/finance/transactions"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5"
              >
                <ListIcon /> Chi tiết giao dịch
              </Link>
              <Link
                to="/finance/add-expense"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-accent-500/25 hover:-translate-y-0.5"
              >
                <PlusIcon /> Thêm chi phí
              </Link>
              <Link
                to="/finance/pt-commission"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-700 hover:bg-stone-800 dark:bg-stone-600 dark:hover:bg-stone-500 text-white rounded-xl font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <SettingsIcon /> Hoa hồng PT
              </Link>
              
              <div className="h-8 w-px bg-stone-300 dark:bg-stone-600 mx-2" />
              
              <button
                onClick={handleCalculatePTSalaries}
                disabled={calculatingSalary || cleaningUp}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
                  calculatingSalary || cleaningUp
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-600 text-white hover:shadow-lg hover:shadow-amber-500/25 hover:-translate-y-0.5'
                }`}
              >
                {calculatingSalary ? <SpinnerIcon /> : <CalcIcon />}
                {calculatingSalary ? 'Đang tính...' : 'Tính lương PT'}
              </button>
              <button
                onClick={handleCleanupPTExpenses}
                disabled={cleaningUp || calculatingSalary}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
                  cleaningUp || calculatingSalary
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                    : 'bg-rose-500 hover:bg-rose-600 text-white hover:shadow-lg hover:shadow-rose-500/25 hover:-translate-y-0.5'
                }`}
              >
                {cleaningUp ? <SpinnerIcon /> : <TrashIcon />}
                {cleaningUp ? 'Đang dọn...' : 'Dọn dẹp PT'}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards - Bento Grid Style */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6 mb-8">
          {/* Revenue Card - Large */}
          <div 
            className="col-span-12 md:col-span-6 lg:col-span-3 animate-fade-in"
            style={{ animationDelay: '100ms' }}
          >
            <div className="h-full bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white relative overflow-hidden group hover:shadow-xl hover:shadow-primary-500/25 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-primary-100 text-sm font-medium uppercase tracking-wider">Doanh thu</span>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <TrendUpIcon />
                  </div>
                </div>
                <p className="text-3xl lg:text-4xl font-bold mb-2">
                  {formatShortCurrency(summary.total_revenue)}
                </p>
                <p className="text-primary-100 text-sm">
                  {summary.revenue_transactions || 0} giao dịch
                </p>
              </div>
            </div>
          </div>

          {/* Expense Card */}
          <div 
            className="col-span-12 md:col-span-6 lg:col-span-3 animate-fade-in"
            style={{ animationDelay: '150ms' }}
          >
            <div className="h-full bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl p-6 text-white relative overflow-hidden group hover:shadow-xl hover:shadow-accent-500/25 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-accent-100 text-sm font-medium uppercase tracking-wider">Chi phí</span>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <TrendDownIcon />
                  </div>
                </div>
                <p className="text-3xl lg:text-4xl font-bold mb-2">
                  {formatShortCurrency(summary.total_expense)}
                </p>
                <p className="text-accent-100 text-sm">
                  {summary.expense_transactions || 0} giao dịch
                </p>
              </div>
            </div>
          </div>

          {/* Profit Card */}
          <div 
            className="col-span-12 md:col-span-6 lg:col-span-3 animate-fade-in"
            style={{ animationDelay: '200ms' }}
          >
            <div className={`h-full rounded-2xl p-6 text-white relative overflow-hidden group hover:shadow-xl transition-all duration-300 ${
              summary.profit >= 0 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 hover:shadow-blue-500/25' 
                : 'bg-gradient-to-br from-rose-600 to-rose-700 hover:shadow-rose-500/25'
            }`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white/80 text-sm font-medium uppercase tracking-wider">Lợi nhuận</span>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <WalletIcon />
                  </div>
                </div>
                <p className="text-3xl lg:text-4xl font-bold mb-2">
                  {formatShortCurrency(Math.abs(summary.profit || 0))}
                </p>
                <p className="text-white/80 text-sm">
                  Margin: {profitMargin}%
                </p>
              </div>
            </div>
          </div>

          {/* Expense Ratio Card */}
          <div 
            className="col-span-12 md:col-span-6 lg:col-span-3 animate-fade-in"
            style={{ animationDelay: '250ms' }}
          >
            <div className="h-full bg-white/70 dark:bg-stone-800/70 backdrop-blur-xl rounded-2xl p-6 border border-stone-200/50 dark:border-stone-700/50 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-stone-500 dark:text-stone-400 text-sm font-medium uppercase tracking-wider">Tỷ lệ Chi/Thu</span>
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <ChartIcon />
                  </div>
                </div>
                <p className="text-3xl lg:text-4xl font-bold text-stone-900 dark:text-stone-50 mb-3">
                  {expenseRatio}%
                </p>
                
                {/* Progress Bar */}
                <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${
                      parseFloat(expenseRatio) > 80 ? 'bg-accent-500' : 
                      parseFloat(expenseRatio) > 50 ? 'bg-amber-500' : 'bg-primary-500'
                    }`}
                    style={{ width: `${Math.min(parseFloat(expenseRatio), 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 mb-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
          {['overview', 'charts', 'details'].map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                activeView === view
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-white/50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400 hover:bg-white dark:hover:bg-stone-800'
              }`}
            >
              {view === 'overview' ? '📊 Tổng quan' : view === 'charts' ? '📈 Biểu đồ' : '📋 Chi tiết'}
            </button>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Trend Chart - Full Width or Half based on view */}
          {(activeView === 'overview' || activeView === 'charts') && (
            <div 
              className={`${activeView === 'charts' ? 'col-span-12' : 'col-span-12 lg:col-span-8'} animate-fade-in`}
              style={{ animationDelay: '350ms' }}
            >
              <div className="bg-white/70 dark:bg-stone-800/70 backdrop-blur-xl rounded-2xl p-6 border border-stone-200/50 dark:border-stone-700/50 shadow-lg h-full">
                <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-6 flex items-center gap-3">
                  <span className="w-2 h-8 bg-primary-500 rounded-full" />
                  Xu hướng Thu Chi (6 tháng)
                </h3>
                <ResponsiveContainer width="100%" height={activeView === 'charts' ? 400 : 320}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.revenue} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={CHART_COLORS.revenue} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.expense} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={CHART_COLORS.expense} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                    <XAxis dataKey="month" stroke="#78716c" fontSize={12} tickLine={false} />
                    <YAxis stroke="#78716c" fontSize={12} tickLine={false} tickFormatter={(v) => formatShortCurrency(v)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke={CHART_COLORS.revenue} strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area type="monotone" dataKey="expense" name="Chi phí" stroke={CHART_COLORS.expense} strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                    <Line type="monotone" dataKey="profit" name="Lợi nhuận" stroke={CHART_COLORS.profit} strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Expense by Type Pie Chart */}
          {(activeView === 'overview' || activeView === 'charts') && (
            <div 
              className={`${activeView === 'charts' ? 'col-span-12 lg:col-span-6' : 'col-span-12 lg:col-span-4'} animate-fade-in`}
              style={{ animationDelay: '400ms' }}
            >
              <div className="bg-white/70 dark:bg-stone-800/70 backdrop-blur-xl rounded-2xl p-6 border border-stone-200/50 dark:border-stone-700/50 shadow-lg h-full">
                <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-6 flex items-center gap-3">
                  <span className="w-2 h-8 bg-accent-500 rounded-full" />
                  Cơ cấu Chi phí
                </h3>
                <ResponsiveContainer width="100%" height={activeView === 'charts' ? 350 : 280}>
                  <PieChart>
                    <Pie
                      data={expenseTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={activeView === 'charts' ? 70 : 50}
                      outerRadius={activeView === 'charts' ? 120 : 90}
                      fill="#8884d8"
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {expenseTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS.pie[index % CHART_COLORS.pie.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-3 justify-center">
                  {expenseTypeData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS.pie[index % CHART_COLORS.pie.length] }}
                      />
                      <span className="text-sm text-stone-600 dark:text-stone-400">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Payment Method Chart */}
          {activeView === 'charts' && (
            <div className="col-span-12 lg:col-span-6 animate-fade-in" style={{ animationDelay: '450ms' }}>
              <div className="bg-white/70 dark:bg-stone-800/70 backdrop-blur-xl rounded-2xl p-6 border border-stone-200/50 dark:border-stone-700/50 shadow-lg h-full">
                <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-6 flex items-center gap-3">
                  <span className="w-2 h-8 bg-blue-500 rounded-full" />
                  Doanh thu theo Phương thức
                </h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={paymentMethodData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="#78716c" fontSize={12} tickFormatter={(v) => formatShortCurrency(v)} />
                    <YAxis type="category" dataKey="name" stroke="#78716c" fontSize={12} width={100} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="value" name="Doanh thu" fill={CHART_COLORS.revenue} radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Expense Details Table */}
          {(activeView === 'overview' || activeView === 'details') && (
            <div 
              className={`${activeView === 'details' ? 'col-span-12' : 'col-span-12'} animate-fade-in`}
              style={{ animationDelay: activeView === 'details' ? '350ms' : '450ms' }}
            >
              <div className="bg-white/70 dark:bg-stone-800/70 backdrop-blur-xl rounded-2xl p-6 border border-stone-200/50 dark:border-stone-700/50 shadow-lg">
                <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-6 flex items-center gap-3">
                  <span className="w-2 h-8 bg-amber-500 rounded-full" />
                  Chi tiết Chi phí theo Loại
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-stone-200 dark:border-stone-700">
                        <th className="text-left py-4 px-4 text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Loại chi phí</th>
                        <th className="text-center py-4 px-4 text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Số lượng</th>
                        <th className="text-right py-4 px-4 text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Tổng tiền</th>
                        <th className="text-right py-4 px-4 text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Tỷ lệ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-700/50">
                      {expenseTypeData.map((item, index) => {
                        const percentage = summary.total_expense > 0 
                          ? ((item.value / summary.total_expense) * 100).toFixed(1) 
                          : 0;
                        return (
                          <tr key={index} className="hover:bg-stone-50 dark:hover:bg-stone-700/30 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: CHART_COLORS.pie[index % CHART_COLORS.pie.length] }}
                                />
                                <span className="font-medium text-stone-800 dark:text-stone-200">{item.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 bg-stone-100 dark:bg-stone-700 rounded-lg text-sm font-semibold text-stone-700 dark:text-stone-300">
                                {item.count}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right font-bold text-accent-600 dark:text-accent-400">
                              {formatCurrency(item.value)}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-20 h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ 
                                      width: `${percentage}%`,
                                      backgroundColor: CHART_COLORS.pie[index % CHART_COLORS.pie.length]
                                    }}
                                  />
                                </div>
                                <span className="text-sm text-stone-600 dark:text-stone-400 w-12 text-right">
                                  {percentage}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {expenseTypeData.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-stone-500 dark:text-stone-400">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-16 h-16 bg-stone-100 dark:bg-stone-700 rounded-2xl flex items-center justify-center">
                                <ChartIcon />
                              </div>
                              <p>Chưa có dữ liệu chi phí</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {expenseTypeData.length > 0 && (
                      <tfoot>
                        <tr className="border-t-2 border-stone-300 dark:border-stone-600">
                          <td className="py-4 px-4 font-bold text-stone-800 dark:text-stone-200">Tổng cộng</td>
                          <td className="py-4 px-4 text-center font-bold text-stone-800 dark:text-stone-200">
                            {expenseTypeData.reduce((sum, item) => sum + item.count, 0)}
                          </td>
                          <td className="py-4 px-4 text-right font-bold text-accent-600 dark:text-accent-400 text-lg">
                            {formatCurrency(summary.total_expense)}
                          </td>
                          <td className="py-4 px-4 text-right font-bold text-stone-800 dark:text-stone-200">
                            100%
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
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

export default FinanceDashboard;
