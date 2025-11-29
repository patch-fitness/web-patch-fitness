import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FilterListIcon from "@mui/icons-material/FilterList";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import { Link } from "react-router-dom";

const TransactionList = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '', // 'revenue' or 'expense' or ''
    startDate: '',
    endDate: '',
    search: ''
  });
  const [gymId] = useState(localStorage.getItem('gymId') || '1');

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

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
      setTransactions(response.data || []);
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
      
      // Convert to CSV
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

      // Download
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
      // Kiểm tra nếu date không hợp lệ
      if (isNaN(date.getTime())) return 'Chưa có';
      // Format: DD/MM/YYYY HH:mm
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Lỗi khi định dạng ngày:', error, dateString);
      return 'Chưa có';
    }
  };

  // Chuyển đổi payment_method từ tiếng Anh sang tiếng Việt
  const formatPaymentMethod = (method) => {
    if (!method) return 'Chưa có';
    const methodMap = {
      'Cash': 'Tiền mặt',
      'Transfer': 'Chuyển khoản',
      'Card': 'Thẻ',
      'Pending': 'Chưa thanh toán',
      'Paid': 'Đã thanh toán'
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

  // Kiểm tra xem expense có phải tự động không
  const isAutoExpense = (transaction) => {
    if (transaction.type !== 'Expense') return false;
    return (
      transaction.created_by === 'System Auto' ||
      transaction.created_by === 'System Auto (Session Completed)' ||
      transaction.expense_type === 'PT_Commission' ||
      (transaction.description && transaction.description.includes('Tu dong'))
    );
  };

  // Xóa chi phí thủ công
  const handleDeleteExpense = async (expenseId, transactionCode) => {
    if (!window.confirm(`Bạn có chắc muốn xóa chi phí ${transactionCode}?`)) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/expenses/${expenseId}`);
      toast.success("Đã xóa chi phí thành công!");
      // Refresh danh sách
      fetchTransactions();
    } catch (err) {
      console.error("Lỗi khi xóa chi phí:", err);
      toast.error(err.response?.data?.message || "Không thể xóa chi phí!");
    }
  };

  return (
    <div className="text-black p-5 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <Link to="/finance" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4">
          <ArrowBackIcon /> <span className="ml-2">Quay lại Dashboard</span>
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Chi tiết Giao dịch</h1>
            <p className="text-gray-600 mt-1">Danh sách tất cả giao dịch thu chi</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mt-4 md:mt-0"
          >
            <DownloadIcon /> Xuất Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-5 shadow-md mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FilterListIcon />
          <h3 className="text-lg font-semibold">Bộ lọc</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tất cả loại</option>
            <option value="revenue">Doanh thu</option>
            <option value="expense">Chi phí</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Từ ngày"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Đến ngày"
          />

          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 col-span-2"
            placeholder="Tìm kiếm theo mã GD, mô tả..."
          />
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã GD
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mô tả
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phương thức
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày GD
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => {
                  const canDelete = transaction.type === 'Expense' && !isAutoExpense(transaction);
                  return (
                    <tr key={`${transaction.type}-${transaction.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {transaction.transaction_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.type === 'Revenue' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type === 'Revenue' ? 'Thu' : 'Chi'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPaymentMethod(transaction.payment_method)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                        transaction.type === 'Revenue' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'Revenue' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {canDelete ? (
                          <button
                            onClick={() => handleDeleteExpense(transaction.id, transaction.transaction_code)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                            title="Xóa chi phí này"
                          >
                            <DeleteIcon sx={{ fontSize: 18 }} />
                            <span className="ml-1">Xóa</span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Không có giao dịch nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default TransactionList;

