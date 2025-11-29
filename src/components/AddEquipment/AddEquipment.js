import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTheme } from '@/contexts/ThemeContext';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RefreshIcon from '@mui/icons-material/Refresh';

const AddEquipment = ({ onSuccess }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const fileInputRef = useRef(null);

    const [inputField, setInputField] = useState({ 
        name: "", 
        category: "", 
        location: "", 
        condition: "Good", 
        status: "Available",
        image: "https://via.placeholder.com/150",
        description: "",
        purchaseDate: "",
        maintenanceDate: "",
        maintenanceCost: "",
        purchasePrice: ""
    });
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const handleOnChange = (event, name) => {
        setInputField({ ...inputField, [name]: event.target.value });
    }

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File ảnh quá lớn! Vui lòng chọn file nhỏ hơn 5MB");
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error("Vui lòng chọn file ảnh!");
            return;
        }

        setSelectedImageFile(file);
        const preview = URL.createObjectURL(file);
        setImagePreview(preview);
        setInputField((prev) => ({ ...prev, image: preview }));
    }

    useEffect(() => {
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
        };
    }, [imagePreview]);

    const resetForm = () => {
        setInputField({ 
            name: "", 
            category: "", 
            location: "", 
            condition: "Good", 
            status: "Available",
            image: "https://via.placeholder.com/150",
            description: "",
            purchaseDate: "",
            maintenanceDate: "",
            maintenanceCost: "",
            purchasePrice: ""
        });
        setSelectedImageFile(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        toast.info("Đã xóa form");
    };

    const handleRegisterButton = async () => {
        if (!inputField.name || !inputField.category || !inputField.location) {
            toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
            return;
        }

        const purchasePriceValue = inputField.purchasePrice ? parseFloat(inputField.purchasePrice) : 0;
        if (!inputField.purchasePrice || isNaN(purchasePriceValue) || purchasePriceValue <= 0) {
            toast.error("Giá mua phải là số lớn hơn 0!");
            return;
        }

        const maintenanceCostValue = inputField.maintenanceCost ? parseFloat(inputField.maintenanceCost) : 0;
        if (inputField.maintenanceCost && (isNaN(maintenanceCostValue) || maintenanceCostValue < 0)) {
            toast.error("Giá bảo trì không hợp lệ!");
            return;
        }

        try {
            const formData = new FormData();
            formData.append('name', inputField.name);
            formData.append('category', inputField.category);
            formData.append('location', inputField.location);
            formData.append('status', inputField.status);
            formData.append('condition', inputField.condition);
            formData.append('description', inputField.description || '');
            formData.append('purchasePrice', purchasePriceValue);
            formData.append('maintenanceCost', maintenanceCostValue);
            formData.append('gymId', 1);
            
            if (inputField.purchaseDate) {
                formData.append('purchaseDate', inputField.purchaseDate);
            }
            if (inputField.maintenanceDate) {
                formData.append('maintenanceDate', inputField.maintenanceDate);
            }

            if (selectedImageFile) {
                formData.append('image', selectedImageFile);
            } else if (inputField.image && !inputField.image.startsWith('blob:')) {
                formData.append('image', inputField.image);
            }

            const response = await axios.post('http://localhost:5000/api/equipment', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success("Thêm thiết bị thành công!");
            
            if (onSuccess) {
                setTimeout(() => {
                    onSuccess(response.data);
                }, 500);
            }
            
            resetForm();
        } catch (err) {
            console.error("Lỗi khi thêm thiết bị:", err);
            const errorMessage = err.response?.data?.message || err.message || "Thêm thiết bị thất bại!";
            toast.error(errorMessage);
        }
    }

    const inputClass = `w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
        isDark 
            ? 'bg-stone-800 border border-stone-700 text-white placeholder-stone-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20' 
            : 'bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
    }`;

    const labelClass = `block mb-2 text-sm font-medium ${isDark ? 'text-stone-300' : 'text-stone-700'}`;

    return (
        <div className={isDark ? 'text-stone-200' : 'text-stone-800'}>
            <div className='grid gap-5 grid-cols-1 md:grid-cols-2'>
                {/* Tên thiết bị */}
                <div>
                    <label className={labelClass}>Tên thiết bị *</label>
                    <input 
                        value={inputField.name} 
                        onChange={(event) => handleOnChange(event, "name")} 
                        placeholder='Nhập tên thiết bị' 
                        type='text' 
                        className={inputClass}
                    />
                </div>
                
                {/* Loại thiết bị */}
                <div>
                    <label className={labelClass}>Loại thiết bị *</label>
                    <select 
                        value={inputField.category} 
                        onChange={(event) => handleOnChange(event, "category")} 
                        className={inputClass}
                    >
                        <option value="">Chọn loại thiết bị</option>
                        <option value="Cardio">Cardio</option>
                        <option value="Strength">Strength</option>
                        <option value="Free Weights">Free Weights</option>
                        <option value="Machines">Machines</option>
                        <option value="Accessories">Accessories</option>
                    </select>
                </div>

                {/* Vị trí */}
                <div>
                    <label className={labelClass}>Vị trí *</label>
                    <input 
                        value={inputField.location} 
                        onChange={(event) => handleOnChange(event, "location")} 
                        placeholder='Ví dụ: Khu vực A, Phòng 101' 
                        type='text' 
                        className={inputClass}
                    />
                </div>

                {/* Trạng thái */}
                <div>
                    <label className={labelClass}>Trạng thái</label>
                    <select 
                        value={inputField.status} 
                        onChange={(event) => handleOnChange(event, "status")} 
                        className={inputClass}
                    >
                        <option value="Available">Sẵn sàng</option>
                        <option value="In Use">Đang sử dụng</option>
                        <option value="Maintenance">Bảo trì</option>
                    </select>
                </div>

                {/* Tình trạng */}
                <div>
                    <label className={labelClass}>Tình trạng</label>
                    <select 
                        value={inputField.condition} 
                        onChange={(event) => handleOnChange(event, "condition")} 
                        className={inputClass}
                    >
                        <option value="Excellent">Tuyệt vời</option>
                        <option value="Good">Tốt</option>
                        <option value="Fair">Khá</option>
                        <option value="Poor">Kém</option>
                    </select>
                </div>

                {/* Ngày mua */}
                <div>
                    <label className={labelClass}>Ngày mua</label>
                    <input 
                        value={inputField.purchaseDate} 
                        onChange={(event) => handleOnChange(event, "purchaseDate")} 
                        type='date' 
                        className={inputClass}
                    />
                </div>

                {/* Giá mua */}
                <div>
                    <label className={labelClass}>Giá mua (₫) *</label>
                    <input 
                        value={inputField.purchasePrice} 
                        onChange={(event) => handleOnChange(event, "purchasePrice")} 
                        placeholder='Nhập giá mua' 
                        type='number' 
                        min='0'
                        step='1000'
                        className={inputClass}
                    />
                </div>

                {/* Ngày bảo trì */}
                <div>
                    <label className={labelClass}>Ngày bảo trì</label>
                    <input 
                        value={inputField.maintenanceDate} 
                        onChange={(event) => handleOnChange(event, "maintenanceDate")} 
                        type='date' 
                        className={inputClass}
                    />
                </div>

                {/* Giá bảo trì */}
                <div>
                    <label className={labelClass}>Giá bảo trì (₫)</label>
                    <input 
                        value={inputField.maintenanceCost} 
                        onChange={(event) => handleOnChange(event, "maintenanceCost")} 
                        placeholder='Nhập giá bảo trì' 
                        type='number' 
                        min='0'
                        step='1000'
                        className={inputClass}
                    />
                </div>

                {/* Mô tả */}
                <div className='md:col-span-2'>
                    <label className={labelClass}>Mô tả</label>
                    <textarea 
                        value={inputField.description} 
                        onChange={(event) => handleOnChange(event, "description")} 
                        placeholder='Mô tả chi tiết về thiết bị' 
                        rows={3}
                        className={inputClass}
                    />
                </div>

                {/* Ảnh thiết bị */}
                <div className='md:col-span-2'>
                    <label className={labelClass}>Ảnh thiết bị</label>
                    <div className={`p-4 rounded-xl border-2 border-dashed transition-colors ${
                        isDark ? 'border-stone-700 bg-stone-800/50' : 'border-stone-300 bg-stone-50'
                    }`}>
                        <input 
                            ref={fileInputRef}
                            type='file' 
                            onChange={handleImageChange} 
                            accept="image/*"
                            className={`w-full text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}
                        />
                        {inputField.image && inputField.image !== "https://via.placeholder.com/150" && (
                            <div className='mt-4 flex justify-center'>
                                <img 
                                    src={inputField.image} 
                                    alt="equipment preview" 
                                    className='w-32 h-32 object-cover rounded-xl ring-4 ring-primary-500/20'
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Buttons */}
                <div className='md:col-span-2 pt-4 flex flex-col sm:flex-row gap-3'>
                    <button
                        type='button'
                        onClick={resetForm}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                            isDark 
                                ? 'bg-stone-700 text-stone-300 hover:bg-stone-600 border border-stone-600' 
                                : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-300'
                        }`}
                    >
                        <RefreshIcon sx={{ fontSize: 20 }} />
                        Xóa form
                    </button>
                    <button
                        type='button'
                        onClick={handleRegisterButton} 
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 ${
                            isDark 
                                ? 'bg-primary-500 hover:bg-primary-400 shadow-lg shadow-primary-500/25' 
                                : 'bg-primary-500 hover:bg-primary-600 shadow-lg shadow-primary-500/30'
                        }`}
                    >
                        <AddCircleIcon sx={{ fontSize: 20 }} />
                        Thêm thiết bị
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AddEquipment
