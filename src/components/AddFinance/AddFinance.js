import React, { useState } from 'react';
import { toast } from 'react-toastify';

const AddFinance = ({ onSuccess }) => {
  const [form, setForm] = useState({
    bill: '',
    income: '',
    expense: '',
  });

  const handleChange = (event, name) => {
    setForm({ ...form, [name]: event.target.value });
  };

  const handleSubmit = () => {
    if (!form.bill.trim()) {
      toast.error('Vui lòng nhập tên hóa đơn / giao dịch');
      return;
    }

    const incomeNumber = Number(form.income);
    const expenseNumber = Number(form.expense);

    if (isNaN(incomeNumber) || incomeNumber < 0) {
      toast.error('Tiền thu vào phải là số không âm');
      return;
    }

    if (isNaN(expenseNumber) || expenseNumber < 0) {
      toast.error('Tiền trả ra phải là số không âm');
      return;
    }

    const payload = {
      bill: form.bill,
      income: incomeNumber,
      expense: expenseNumber,
      profit: incomeNumber - expenseNumber,
    };

    toast.success('Đã thêm bản ghi tài chính!');

    if (onSuccess) {
      setTimeout(() => {
        onSuccess(payload);
      }, 400);
    }

    setTimeout(() => {
      setForm({
        bill: '',
        income: '',
        expense: '',
      });
    }, 500);
  };

  return (
    <div className="text-black">
      <div className="flex flex-col gap-5 text-lg">
        <input
          value={form.bill}
          onChange={(event) => handleChange(event, 'bill')}
          placeholder="Tên hóa đơn / giao dịch"
          type="text"
          className="border-2 w-full pl-3 pr-3 pt-2 pb-2 border-slate-400 rounded-md h-12"
        />

        <input
          value={form.income}
          onChange={(event) => handleChange(event, 'income')}
          placeholder="Tiền thu vào (₫)"
          type="number"
          min="0"
          className="border-2 w-full pl-3 pr-3 pt-2 pb-2 border-slate-400 rounded-md h-12"
        />

        <input
          value={form.expense}
          onChange={(event) => handleChange(event, 'expense')}
          placeholder="Tiền trả ra (₫)"
          type="number"
          min="0"
          className="border-2 w-full pl-3 pr-3 pt-2 pb-2 border-slate-400 rounded-md h-12"
        />

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={() =>
              setForm({
                bill: '',
                income: '',
                expense: '',
              })
            }
            className="px-6 py-3 border-2 border-gray-400 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            🔄 Xóa form
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg cursor-pointer hover:from-emerald-600 hover:to-green-700 transition-all font-bold text-base md:text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            ✓ XÁC NHẬN
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddFinance;

