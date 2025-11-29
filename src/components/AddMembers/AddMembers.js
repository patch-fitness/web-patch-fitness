import React, { useState, useEffect } from 'react'
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTheme } from '@/contexts/ThemeContext';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const AddMembers = ({ onSuccess, onMembershipAdded }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [inputField, setInputField] = useState({ 
    name: "", 
    mobileNo: "", 
    address: "", 
    membership: "", 
    profilePic: "https://th.bing.com/th/id/OIP.gj6t3grz5no6UZ03uIluiwHaHa?rs=1&pid=ImgDetMain", 
    joiningDate: "",
    status: "Active",
    plan: "Standard Plan"
  });
  const [membershipList, setMembershipList] = useState([]);
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const handleOnChange = (event, name) => {
    setInputField({ ...inputField, [name]: event.target.value });
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setSelectedImageFile(file);
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    setInputField({ ...inputField, profilePic: preview });
  };

  const fetchMembership = async () => {
    try {
      const gymId = localStorage.getItem('gymId') || '1';
      const response = await axios.get(`http://localhost:5000/api/memberships?gymId=${gymId}`);
      const memberships = response.data || [];
      
      const formattedMemberships = memberships.map(m => ({
        _id: m.id.toString(),
        id: m.id,
        months: m.months || m.duration_in_months,
        title: m.title || m.name,
        price: m.price
      }));
      
      setMembershipList(formattedMemberships);
    } catch (err) {
      console.error("Lỗi khi tải danh sách gói tập:", err);
      toast.error("Lỗi khi tải danh sách gói tập");
      setMembershipList([]);
    }
  }

  useEffect(() => {
    fetchMembership();
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    const handleMembershipUpdate = () => {
      fetchMembership();
    };
    window.addEventListener('membershipAdded', handleMembershipUpdate);
    return () => {
      window.removeEventListener('membershipAdded', handleMembershipUpdate);
    };
  }, []);

  const handleOnChangeSelect = (event) => {
    const value = event.target.value;
    setSelectedOption(value);
    setInputField({ ...inputField, membership: value });
  };

  const handleRegisterButton = async () => {
    if (!inputField.name || !inputField.mobileNo || !inputField.membership) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      const gymId = localStorage.getItem('gymId') || '1';
      
      const formData = new FormData();
      formData.append('name', inputField.name);
      formData.append('mobileNo', inputField.mobileNo);
      formData.append('address', inputField.address || '');
      formData.append('joinDate', inputField.joiningDate || new Date().toISOString());
      formData.append('status', inputField.status || 'Active');
      formData.append('gymId', parseInt(gymId, 10));
      if (inputField.membership) {
        formData.append('membershipId', parseInt(inputField.membership, 10));
      }
      if (selectedImageFile) {
        formData.append('avatar', selectedImageFile);
      } else if (inputField.profilePic) {
        formData.append('profilePic', inputField.profilePic);
      }
      
      const response = await axios.post('http://localhost:5000/api/members', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success("Thêm thành viên thành công!");
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess(response.data);
        }, 500);
      }
      
      setTimeout(() => {
        setInputField({ 
          name: "", 
          mobileNo: "", 
          address: "", 
          membership: "", 
          profilePic: "https://th.bing.com/th/id/OIP.gj6t3grz5no6UZ03uIluiwHaHa?rs=1&pid=ImgDetMain", 
          joiningDate: "",
          status: "Active",
          plan: "Standard Plan"
        });
        setSelectedOption("");
        setSelectedImageFile(null);
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(null);
      }, 600);
    } catch (err) {
      console.error("Lỗi khi thêm thành viên:", err);
      const errorMessage = err.response?.data?.message || err.message || "Thêm thành viên thất bại!";
      toast.error(errorMessage);
    }
  }

  // Input class for dark mode support
  const inputClass = `w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
    isDark 
      ? 'bg-stone-800 border border-stone-700 text-white placeholder-stone-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20' 
      : 'bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
  }`;

  const labelClass = `block mb-2 text-sm font-medium ${isDark ? 'text-stone-300' : 'text-stone-700'}`;

  return (
    <div className={isDark ? 'text-stone-200' : 'text-stone-800'}>
      <div className='grid gap-5 grid-cols-1 md:grid-cols-2'>
        {/* Tên thành viên */}
        <div>
          <label className={labelClass}>Tên thành viên *</label>
          <input 
            value={inputField.name} 
            onChange={(event) => handleOnChange(event, "name")} 
            placeholder='Nhập tên thành viên' 
            type='text' 
            className={inputClass}
          />
        </div>
        
        {/* Số điện thoại */}
        <div>
          <label className={labelClass}>Số điện thoại *</label>
          <input 
            value={inputField.mobileNo} 
            onChange={(event) => handleOnChange(event, "mobileNo")} 
            placeholder='Nhập số điện thoại' 
            type='text' 
            className={inputClass}
          />
        </div>

        {/* Địa chỉ */}
        <div>
          <label className={labelClass}>Địa chỉ</label>
          <input 
            value={inputField.address} 
            onChange={(event) => handleOnChange(event, "address")} 
            placeholder='Nhập địa chỉ' 
            type='text' 
            className={inputClass}
          />
        </div>

        {/* Gói tập */}
        <div>
          <label className={labelClass}>Gói tập *</label>
          <select 
            value={selectedOption} 
            onChange={handleOnChangeSelect} 
            className={inputClass}
          >
            <option value="">Chọn gói tập</option>
            {membershipList.map((item, index) => (
              <option key={item.id || item._id || index} value={item.id || item._id}>
                {item.title || item.name || `${item.months} Tháng`} - {item.price ? `${item.price.toLocaleString('vi-VN')} VND` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Ngày tham gia */}
        <div>
          <label className={labelClass}>Ngày tham gia</label>
          <input 
            value={inputField.joiningDate} 
            onChange={(event) => handleOnChange(event, "joiningDate")} 
            type='date' 
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
                  className='w-24 h-24 object-cover rounded-full ring-4 ring-primary-500/20'
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
                ? 'bg-primary-500 hover:bg-primary-400 shadow-lg shadow-primary-500/25' 
                : 'bg-primary-500 hover:bg-primary-600 shadow-lg shadow-primary-500/30'
            }`}
          >
            <PersonAddIcon sx={{ fontSize: 20 }} />
            Đăng ký thành viên
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddMembers
