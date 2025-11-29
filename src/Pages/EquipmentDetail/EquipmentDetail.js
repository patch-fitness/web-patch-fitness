import React, { useState, useEffect, useCallback } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import { mockEquipment } from "@/data/mockData";

const DEFAULT_IMAGE = "https://via.placeholder.com/150";

const EquipmentDetail = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    location: "",
    status: "Available",
    condition: "Good",
    purchaseDate: "",
    maintenanceDate: "",
    maintenanceCost: "",
    purchasePrice: "",
    description: "",
    image: "",
  });
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  // Helper function to get proper image URL - giống trainer hoàn toàn
  const getImageSrc = (src) => {
    if (!src || src === null || src === undefined || src === '') return DEFAULT_IMAGE;
    if (typeof src !== 'string') return DEFAULT_IMAGE;
    if (src.startsWith('http')) return src;
    if (src.startsWith('blob:')) return src; // For preview URLs
    // Đảm bảo đường dẫn bắt đầu bằng /
    const path = src.startsWith('/') ? src : `/${src}`;
    return `http://localhost:5000${path}`;
  };

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/equipment/${id}`
      );
      if (response.data) {
        const found = response.data;
        setData(found);
        // Set imagePreview giống trainer - xử lý null/undefined
        setImagePreview(getImageSrc(found.image || null));
      } else {
        toast.error("Không tìm thấy thiết bị!");
      }
      setLoading(false);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu thiết bị:", err);
      toast.error("Không tìm thấy thiết bị!");
      const equipment = mockEquipment.find((e) => e.id === Number(id));
      if (equipment) {
        setData(equipment);
        setImagePreview(getImageSrc(equipment.image || null));
      }
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (data) {
      setEditForm({
        name: data.name || "",
        category: data.category || "",
        location: data.location || "",
        status: data.status || "Available",
        condition: data.condition || "Good",
        purchaseDate: data.purchaseDate
          ? data.purchaseDate.slice(0, 10)
          : "",
        maintenanceDate: data.maintenanceDate
          ? data.maintenanceDate.slice(0, 10)
          : "",
        maintenanceCost:
          data.maintenanceCost !== null && data.maintenanceCost !== undefined
            ? data.maintenanceCost
            : "",
        purchasePrice:
          data.purchasePrice !== null && data.purchasePrice !== undefined
            ? data.purchasePrice
            : "",
        description: data.description || "",
        image: data.image || "",
      });
    }
  }, [data]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("edit") === "1" && data) {
      setIsEditing(true);
    }
  }, [location.search, data]);

  const getConditionColor = (condition) => {
    switch (condition) {
      case "Excellent":
        return "text-green-600";
      case "Good":
        return "text-blue-600";
      case "Fair":
        return "text-yellow-600";
      case "Poor":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch (error) {
      return "Chưa cập nhật";
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value))
      return "Chưa cập nhật";
    return Number(value).toLocaleString("vi-VN") + "₫";
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Kiểm tra kích thước file (tối đa 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File ảnh quá lớn! Vui lòng chọn file nhỏ hơn 5MB");
      return;
    }

    // Kiểm tra loại file
    if (!file.type.startsWith('image/')) {
      toast.error("Vui lòng chọn file ảnh!");
      return;
    }

    // Hiển thị preview ảnh ngay lập tức (giống trainer)
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setNewImageFile(file);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(data ? getImageSrc(data.image) : null);
    setNewImageFile(null);
    if (data) {
      setEditForm({
        name: data.name || "",
        category: data.category || "",
        location: data.location || "",
        status: data.status || "Available",
        condition: data.condition || "Good",
        purchaseDate: data.purchaseDate
          ? data.purchaseDate.slice(0, 10)
          : "",
        maintenanceDate: data.maintenanceDate
          ? data.maintenanceDate.slice(0, 10)
          : "",
        maintenanceCost:
          data.maintenanceCost !== null && data.maintenanceCost !== undefined
            ? data.maintenanceCost
            : "",
        purchasePrice:
          data.purchasePrice !== null && data.purchasePrice !== undefined
            ? data.purchasePrice
            : "",
        description: data.description || "",
        image: data.image || "",
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) {
      toast.error("Tên thiết bị là bắt buộc!");
      return;
    }
    try {
      setSaving(true);
      
      // Tạo FormData giống trainer
      const formData = new FormData();
      formData.append("name", editForm.name);
      formData.append("category", editForm.category);
      formData.append("location", editForm.location);
      formData.append("status", editForm.status);
      formData.append("condition", editForm.condition);
      formData.append("description", editForm.description || "");
      
      if (editForm.purchaseDate) {
        formData.append("purchaseDate", editForm.purchaseDate);
      }
      if (editForm.maintenanceDate) {
        formData.append("maintenanceDate", editForm.maintenanceDate);
      }
      if (editForm.maintenanceCost) {
        formData.append("maintenanceCost", Number(editForm.maintenanceCost));
      }
      if (editForm.purchasePrice) {
        formData.append("purchasePrice", Number(editForm.purchasePrice));
      }

      // Upload ảnh trực tiếp lên backend giống trainer
      if (newImageFile) {
        formData.append("image", newImageFile);
      }

      const response = await axios.put(
        `http://localhost:5000/api/equipment/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      
      const updatedEquipment = response.data;
      setData(updatedEquipment);
      setImagePreview(getImageSrc(updatedEquipment.image));
      setNewImageFile(null);
      toast.success("Cập nhật thiết bị thành công!");
      setIsEditing(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật thiết bị:", error);
      toast.error(
        error.response?.data?.message || "Không thể cập nhật thiết bị"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-3/4 text-black p-5">
      <div
        onClick={() => navigate(-1)}
        className="border-2 w-fit text-xl font-sans text-white p-2 rounded-xl bg-slate-900 cursor-pointer mb-5"
      >
        <ArrowBackIcon /> Quay lại
      </div>

      {loading ? (
        <div className="text-center mt-20 text-2xl text-gray-500">
          Đang tải dữ liệu...
        </div>
      ) : data ? (
        <div className="mt-10 p-2">
          <div className="w-full h-fit flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 mx-auto flex flex-col items-center">
              <img
                src={getImageSrc(imagePreview || data?.image)}
                alt="equipment"
                className="w-full rounded-lg shadow-md object-cover"
              />
              {isEditing && (
                <div className="mt-4 flex flex-col gap-2 w-full">
                  <label className="text-lg font-semibold text-slate-700">
                    Ảnh thiết bị
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="border-2 border-dashed border-slate-300 rounded-lg p-3"
                  />
                </div>
              )}
            </div>

            <div className="w-full md:w-2/3 mt-5 text-xl p-5 bg-white/80 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="text-3xl font-bold text-slate-800 flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => handleEditChange("name", e.target.value)}
                      className="w-full border-2 border-slate-300 rounded-lg p-2 text-2xl font-semibold"
                    />
                  ) : (
                    data.name
                  )}
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-lg border border-indigo-500 text-indigo-600 hover:bg-indigo-50 transition-colors text-base"
                  >
                    Chỉnh sửa
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 rounded-lg border border-gray-400 text-gray-600 hover:bg-gray-100 transition-colors text-base"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className={`px-4 py-2 rounded-lg text-base text-white ${
                        saving
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700"
                      } transition-colors`}
                    >
                      {saving ? "Đang lưu..." : "Lưu"}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">
                    Loại thiết bị
                  </p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.category}
                      onChange={(e) =>
                        handleEditChange("category", e.target.value)
                      }
                      className="w-full border-2 border-slate-300 rounded-lg p-2 text-lg"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-slate-800">
                      {data.category || "Chưa cập nhật"}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">
                    Vị trí
                  </p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) =>
                        handleEditChange("location", e.target.value)
                      }
                      className="w-full border-2 border-slate-300 rounded-lg p-2 text-lg"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-slate-800">
                      {data.location || "Chưa cập nhật"}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">
                    Tình trạng
                  </p>
                  {isEditing ? (
                    <select
                      value={editForm.condition}
                      onChange={(e) =>
                        handleEditChange("condition", e.target.value)
                      }
                      className="w-full border-2 border-slate-300 rounded-lg p-2 text-lg"
                    >
                      <option value="Excellent">Tuyệt vời</option>
                      <option value="Good">Tốt</option>
                      <option value="Fair">Khá</option>
                      <option value="Poor">Kém</option>
                    </select>
                  ) : (
                    <p
                      className={`text-lg font-semibold ${getConditionColor(
                        data.condition
                      )}`}
                    >
                      {data.condition}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">
                    Trạng thái
                  </p>
                  {isEditing ? (
                    <select
                      value={editForm.status}
                      onChange={(e) =>
                        handleEditChange("status", e.target.value)
                      }
                      className="w-full border-2 border-slate-300 rounded-lg p-2 text-lg"
                    >
                      <option value="Available">Sẵn sàng</option>
                      <option value="In Use">Đang sử dụng</option>
                      <option value="Maintenance">Bảo trì</option>
                    </select>
                  ) : (
                    <p className="text-lg font-semibold text-slate-800">
                      {data.status}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">
                    Ngày mua
                  </p>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editForm.purchaseDate || ""}
                      onChange={(e) =>
                        handleEditChange("purchaseDate", e.target.value)
                      }
                      className="w-full border-2 border-slate-300 rounded-lg p-2 text-lg"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-slate-800">
                      {formatDate(data.purchaseDate)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">
                    Ngày bảo trì
                  </p>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editForm.maintenanceDate || ""}
                      onChange={(e) =>
                        handleEditChange("maintenanceDate", e.target.value)
                      }
                      className="w-full border-2 border-slate-300 rounded-lg p-2 text-lg"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-slate-800">
                      {formatDate(data.maintenanceDate)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">
                    Giá bảo trì (₫)
                  </p>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={editForm.maintenanceCost}
                      onChange={(e) =>
                        handleEditChange("maintenanceCost", e.target.value)
                      }
                      className="w-full border-2 border-slate-300 rounded-lg p-2 text-lg"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-red-600">
                      {formatCurrency(data.maintenanceCost)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">
                    Giá mua (₫)
                  </p>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={editForm.purchasePrice}
                      onChange={(e) =>
                        handleEditChange("purchasePrice", e.target.value)
                      }
                      className="w-full border-2 border-slate-300 rounded-lg p-2 text-lg"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-indigo-600">
                      {formatCurrency(data.purchasePrice)}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">
                  Mô tả
                </p>
                {isEditing ? (
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      handleEditChange("description", e.target.value)
                    }
                    className="w-full border-2 border-slate-300 rounded-lg p-3 text-lg min-h-[120px]"
                  />
                ) : (
                  <p className="text-lg text-slate-700">
                    {data.description || "Chưa cập nhật"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center mt-20 text-2xl text-gray-500">
          Đang tải dữ liệu...
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default EquipmentDetail;

