import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTheme } from '@/contexts/ThemeContext';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const AddTrainer = ({ onSuccess }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [inputField, setInputField] = useState({
    name: "",
    mobileNo: "",
    sex: "",
    degree: "",
    salary: "",
    profilePic: "https://th.bing.com/th/id/OIP.gj6t3grz5no6UZ03uIluiwHaHa?rs=1&pid=ImgDetMain",
    gymId: localStorage.getItem('gymId') || '1',
  });

  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleOnChange = (event, name) => {
    setInputField({ ...inputField, [name]: event.target.value });
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedImageFile(file);
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    setInputField({ ...inputField, profilePic: preview });
  }

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    }
  }, [imagePreview]);

  const handleRegisterButton = async () => {
    if (!inputField.name || !inputField.mobileNo || !inputField.degree || !inputField.salary || !inputField.sex) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', inputField.name);
      formData.append('mobileNo', inputField.mobileNo);
      formData.append('sex', inputField.sex);
      formData.append('degree', inputField.degree);
      formData.append('salary', inputField.salary);
      formData.append('gymId', parseInt(inputField.gymId, 10));

      if (selectedImageFile) {
        formData.append('avatar', selectedImageFile);
      } else if (inputField.profilePic) {
        formData.append('profilePic', inputField.profilePic);
      }

      const response = await axios.post('http://localhost:5000/api/trainers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success("Thêm huấn luyện viên thành công!");
      if (onSuccess) {
        setTimeout(() => onSuccess(response.data), 500);
      }

      setInputField({
        name: "",
        mobileNo: "",
        sex: "",
        degree: "",
        salary: "",
        profilePic: "https://th.bing.com/th/id/OIP.gj6t3grz5no6UZ03uIluiwHaHa?rs=1&pid=ImgDetMain",
        gymId: localStorage.getItem('gymId') || '1',
      });
      setSelectedImageFile(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);

    } catch (err) {
      console.error("Lỗi khi thêm trainer:", err);
      const errorMessage = err.response?.data?.message || err.message || "Thêm trainer thất bại!";
      toast.error(errorMessage);
    }
  }

  const inputClass = `w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
    isDark 
      ? 'bg-stone-800 border border-stone-700 text-white placeholder-stone-500 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20' 
      : 'bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20'
  }`;

  const labelClass = `block mb-2 text-sm font-medium ${isDark ? 'text-stone-300' : 'text-stone-700'}`;

  return (
    <div className={isDark ? 'text-stone-200' : 'text-stone-800'}>
      <div className='grid gap-5 grid-cols-1 md:grid-cols-2'>
        {/* Tên */}
        <div>
          <label className={labelClass}>Tên huấn luyện viên *</label>
          <input 
            value={inputField.name}
            onChange={(e) => handleOnChange(e, "name")}
            placeholder='Nhập tên huấn luyện viên'
            type='text'
            className={inputClass}
          />
        </div>

        {/* Số điện thoại */}
        <div>
          <label className={labelClass}>Số điện thoại *</label>
          <input 
            value={inputField.mobileNo}
            onChange={(e) => handleOnChange(e, "mobileNo")}
            placeholder='Nhập số điện thoại'
            type='text'
            className={inputClass}
          />
        </div>

        {/* Giới tính */}
        <div>
          <label className={labelClass}>Giới tính *</label>
          <select
            value={inputField.sex}
            onChange={(e) => handleOnChange(e, "sex")}
            className={inputClass}
          >
            <option value="">Chọn giới tính</option>
            <option value="Male">Nam</option>
            <option value="Female">Nữ</option>
          </select>
        </div>

        {/* Bằng cấp */}
        <div>
          <label className={labelClass}>Bằng cấp / Chuyên môn *</label>
          <input 
            value={inputField.degree}
            onChange={(e) => handleOnChange(e, "degree")}
            placeholder='Ví dụ: Cử nhân TDTT, PT Certificate...'
            type='text'
            className={inputClass}
          />
        </div>

        {/* Lương */}
        <div>
          <label className={labelClass}>Mức lương (VND) *</label>
          <input 
            value={inputField.salary}
            onChange={(e) => handleOnChange(e, "salary")}
            placeholder='Nhập mức lương'
            type='number'
            className={inputClass}
          />
        </div>

        {/* Ảnh đại diện */}
        <div className='md:col-span-2'>
          <label className={labelClass}>Ảnh đại diện</label>
          <div className={`p-4 rounded-xl border-2 border-dashed transition-colors ${
            isDark ? 'border-stone-700 bg-stone-800/50' : 'border-stone-300 bg-stone-50'
          }`}>
            <input 
              type='file' 
              onChange={handleImageChange} 
              accept="image/*"
              className={`w-full text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}
            />
            {inputField.profilePic && (
              <div className='mt-4 flex justify-center'>
                <img 
                  src={inputField.profilePic} 
                  alt="profile preview" 
                  className='w-24 h-24 object-cover rounded-full ring-4 ring-accent-500/20'
                />
              </div>
            )}
          </div>
        </div>

        {/* Nút đăng ký */}
        <div className='md:col-span-2 pt-4'>
          <button 
            onClick={handleRegisterButton}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 ${
              isDark 
                ? 'bg-accent-500 hover:bg-accent-400 shadow-lg shadow-accent-500/25' 
                : 'bg-accent-500 hover:bg-accent-600 shadow-lg shadow-accent-500/30'
            }`}
          >
            <PersonAddIcon sx={{ fontSize: 20 }} />
            Đăng ký huấn luyện viên
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddTrainer;
