import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { Link } from "react-router-dom";

// Icons as SVG components
const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const EmptyIcon = () => (
  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const TrendUpIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

const TransactionList = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [gymId] = useState(localStorage.getItem('gymId') || '1');
  const [stats, setStats] = useState({ revenue: 0, expense: 0, count: 0 });

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.type, filters.startDate, filters.endDate]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        gymId,
        ...filters,
        limit: 100
      });
      
      const response = await axios.get(
        `http://localhost:5000/api/finance/transactions?${params}`
      );
      const data = response.data || [];
      setTransactions(data);
      
      // Calculate stats
      const revenue = data.filter(t => t.type === 'Revenue').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      const expense = data.filter(t => t.type === 'Expense').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      setStats({ revenue, expense, count: data.length });
      
      setLoading(false);
    } catch (err) {
      console.error("Lỗi khi tải giao dịch:", err);
      toast.error("Không thể tải danh sách giao dịch");
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        gymId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        type: filters.type
      });
      
      const response = await axios.get(
        `http://localhost:5000/api/finance/export?${params}`
      );
      
      const data = filters.type === 'expense' ? response.data.expenses : response.data.revenues;
      if (!data || data.length === 0) {
        toast.warning("Không có dữ liệu để xuất");
        return;
      }

      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(','),
        ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast.success("Đã xuất file thành công!");
    } catch (err) {
      console.error("Lỗi khi xuất file:", err);
      toast.error("Không thể xuất file");
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa có';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Chưa có';
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Chưa có';
    }
  };

  const formatPaymentMethod = (method) => {
    if (!method) return 'Chưa có';
    const methodMap = {
      'Cash': '💵 Tiền mặt',
      'Transfer': '🏦 Chuyển khoản',
      'Card': '💳 Thẻ',
      'Pending': '⏳ Chưa thanh toán',
      'Paid': '✅ Đã thanh toán'
    };
    return methodMap[method] || method;
  };

  const filteredTransactions = transactions.filter(t => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        t.transaction_code?.toLowerCase().includes(search) ||
        t.description?.toLowerCase().includes(search) ||
        t.category?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const isAutoExpense = (transaction) => {
    if (transaction.type !== 'Expense') return false;
    return (
      transaction.created_by === 'System Auto' ||
      transaction.created_by === 'System Auto (Session Completed)' ||
      transaction.expense_type === 'PT_Commission' ||
      (transaction.description && transaction.description.includes('Tu dong'))
    );
  };

  const handleDeleteExpense = async (expenseId, transactionCode) => {
    if (!window.confirm(`Bạn có chắc muốn xóa chi phí ${transactionCode}?`)) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/expenses/${expenseId}`);
      toast.success("Đã xóa chi phí thành công!");
      fetchTransactions();
    } catch (err) {
      console.error("Lỗi khi xóa chi phí:", err);
      toast.error(err.response?.data?.message || "Không thể xóa chi phí!");
    }
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      startDate: '',
      endDate: '',
      search: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-primary-50/20 to-stone-100 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-6 lg:p-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <Link 
            to="/finance" 
            className="inline-flex items-center gap-2 text-stone-500 hover:text-primary-600 dark:text-stone-400 dark:hover:text-primary-400 transition-colors mb-6 group"
          >
            <ArrowLeftIcon />
            <span className="group-hover:translate-x-1 transition-transform">Quay lại Dashboard</span>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-stone-900 dark:text-stone-50 mb-2">
                Chi tiết <span className="text-gradient">Giao dịch</span>
              </h1>
              <p className="text-lg text-stone-600 dark:text-stone-400">
                Danh sách tất cả giao dịch thu chi của phòng gym
              </p>
            </div>

            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5"
            >
              <DownloadIcon /> Xuất Excel
            </button>
          </div>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <div className="bg-white/70 dark:bg-stone-800/70 backdrop-blur-xl rounded-2xl p-5 border border-stone-200/50 dark:border-stone-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-1">Tổng Doanh thu</p>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{formatCurrency(stats.revenue)}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                <TrendUpIcon />
              </div>
            </div>
          </div>
          <div className="bg-white/70 dark:bg-stone-800/70 backdrop-blur-xl rounded-2xl p-5 border border-stone-200/50 dark:border-stone-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-1">Tổng Chi phí</p>
                <p className="text-2xl font-bold text-accent-600 dark:text-accent-400">{formatCurrency(stats.expense)}</p>
              </div>
              <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/30 rounded-xl flex items-center justify-center text-accent-600 dark:text-accent-400">
                <TrendDownIcon />
              </div>
            </div>
          </div>
          <div className="bg-white/70 dark:bg-stone-800/70 backdrop-blur-xl rounded-2xl p-5 border border-stone-200/50 dark:border-stone-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-1">Tổng giao dịch</p>
                <p className="text-2xl font-bold text-stone-800 dark:text-stone-200">{stats.count}</p>
              </div>
              <div className="w-12 h-12 bg-stone-100 dark:bg-stone-700 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-400">
                <span className="text-lg font-bold">#</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white/70 dark:bg-stone-800/70 backdrop-blur-xl rounded-2xl p-5 border border-stone-200/50 dark:border-stone-700/50 shadow-lg mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                <SearchIcon />
              </div>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                placeholder="Tìm kiếm theo mã GD, mô tả, danh mục..."
              />
            </div>

            {/* Filter Toggle & Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                  showFilters || filters.type || filters.startDate || filters.endDate
                    ? 'bg-primary-500 text-white'
                    : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
                }`}
              >
                <FilterIcon />
                Bộ lọc
                {(filters.type || filters.startDate || filters.endDate) && (
                  <span className="w-5 h-5 bg-white/20 rounded-full text-xs flex items-center justify-center">
                    !
                  </span>
                )}
              </button>

              <button
                onClick={fetchTransactions}
                className="p-3 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-600 transition-all"
                title="Làm mới"
              >
                <RefreshIcon />
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
                    Loại giao dịch
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  >
                    <option value="">📊 Tất cả</option>
                    <option value="revenue">📈 Doanh thu</option>
                    <option value="expense">📉 Chi phí</option>
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
                    Từ ngày
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                      <CalendarIcon />
                    </div>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
                    Đến ngày
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                      <CalendarIcon />
                    </div>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2.5 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-600 transition-all font-medium"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transaction List */}
        <div className="bg-white/70 dark:bg-stone-800/70 backdrop-blur-xl rounded-2xl border border-stone-200/50 dark:border-stone-700/50 shadow-lg overflow-hidden animate-fade-in" style={{ animationDelay: '150ms' }}>
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
              <p className="text-stone-600 dark:text-stone-400">Đang tải dữ liệu...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-stone-100 dark:bg-stone-700 rounded-2xl flex items-center justify-center text-stone-400">
                <EmptyIcon />
              </div>
              <p className="text-lg font-medium text-stone-700 dark:text-stone-300 mb-2">Không có giao dịch nào</p>
              <p className="text-stone-500 dark:text-stone-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-700">
                      <th className="text-left py-4 px-6 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Mã GD</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Loại</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Danh mục</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Mô tả</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Phương thức</th>
                      <th className="text-right py-4 px-6 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Số tiền</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Ngày GD</th>
                      <th className="text-center py-4 px-6 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-700/50">
                    {filteredTransactions.map((transaction, index) => {
                      const canDelete = transaction.type === 'Expense' && !isAutoExpense(transaction);
                      return (
                        <tr 
                          key={`${transaction.type}-${transaction.id}`} 
                          className="hover:bg-stone-50 dark:hover:bg-stone-700/30 transition-colors"
                          style={{ animationDelay: `${index * 20}ms` }}
                        >
                          <td className="py-4 px-6">
                            <span className="font-mono text-sm text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-700 px-2 py-1 rounded">
                              {transaction.transaction_code}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                              transaction.type === 'Revenue' 
                                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' 
                                : 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400'
                            }`}>
                              {transaction.type === 'Revenue' ? <TrendUpIcon /> : <TrendDownIcon />}
                              {transaction.type === 'Revenue' ? 'Thu' : 'Chi'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
                              {transaction.category}
                            </span>
                          </td>
                          <td className="py-4 px-6 max-w-[200px]">
                            <p className="text-sm text-stone-600 dark:text-stone-400 truncate" title={transaction.description}>
                              {transaction.description}
                            </p>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm text-stone-600 dark:text-stone-400">
                              {formatPaymentMethod(transaction.payment_method)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className={`text-sm font-bold ${
                              transaction.type === 'Revenue' 
                                ? 'text-primary-600 dark:text-primary-400' 
                                : 'text-accent-600 dark:text-accent-400'
                            }`}>
                              {transaction.type === 'Revenue' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm text-stone-500 dark:text-stone-400">
                              {formatDate(transaction.date)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {canDelete ? (
                              <button
                                onClick={() => handleDeleteExpense(transaction.id, transaction.transaction_code)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/20 rounded-lg hover:bg-accent-100 dark:hover:bg-accent-900/40 transition-colors"
                                title="Xóa chi phí này"
                              >
                                <DeleteIcon />
                                Xóa
                              </button>
                            ) : (
                              <span className="text-stone-300 dark:text-stone-600">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden divide-y divide-stone-100 dark:divide-stone-700/50">
                {filteredTransactions.map((transaction) => {
                  const canDelete = transaction.type === 'Expense' && !isAutoExpense(transaction);
                  return (
                    <div 
                      key={`${transaction.type}-${transaction.id}`} 
                      className="p-4 hover:bg-stone-50 dark:hover:bg-stone-700/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            transaction.type === 'Revenue' 
                              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' 
                              : 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400'
                          }`}>
                            {transaction.type === 'Revenue' ? '📈 Thu' : '📉 Chi'}
                          </span>
                          <span className="font-mono text-xs text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-700 px-2 py-0.5 rounded">
                            {transaction.transaction_code}
                          </span>
                        </div>
                        <span className={`text-base font-bold ${
                          transaction.type === 'Revenue' 
                            ? 'text-primary-600 dark:text-primary-400' 
                            : 'text-accent-600 dark:text-accent-400'
                        }`}>
                          {transaction.type === 'Revenue' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </div>
                      
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-200 mb-1">
                        {transaction.category}
                      </p>
                      <p className="text-sm text-stone-600 dark:text-stone-400 mb-2 line-clamp-2">
                        {transaction.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                        <span>{formatPaymentMethod(transaction.payment_method)}</span>
                        <span>{formatDate(transaction.date)}</span>
                      </div>

                      {canDelete && (
                        <button
                          onClick={() => handleDeleteExpense(transaction.id, transaction.transaction_code)}
                          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/20 rounded-lg hover:bg-accent-100 dark:hover:bg-accent-900/40 transition-colors"
                        >
                          <DeleteIcon />
                          Xóa chi phí
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Results Count */}
              <div className="px-6 py-4 bg-stone-50 dark:bg-stone-800/50 border-t border-stone-200 dark:border-stone-700">
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  Hiển thị <span className="font-semibold text-stone-800 dark:text-stone-200">{filteredTransactions.length}</span> giao dịch
                </p>
              </div>
            </>
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

export default TransactionList;
