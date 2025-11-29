import React, { useState, useEffect } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Switch from "react-switch";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";

const DEFAULT_AVATAR =
  "https://th.bing.com/th/id/OIP.gj6t3grz5no6UZ03uIluiwHaHa?rs=1&pid=ImgDetMain";

const MemberDetail = () => {
  const [status, setStatus] = useState("Pending");
  const [renew, setRenew] = useState(false);
  const [membership, setMembership] = useState([]);
  const [data, setData] = useState(null);
  const [planMember, setPlanMember] = useState("");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    mobileNo: "",
    address: "",
    status: "Active",
  });
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedMembershipId, setSelectedMembershipId] = useState("");
  const [initialMembershipId, setInitialMembershipId] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  useEffect(() => {
    // Fetch dữ liệu từ backend khi component mount hoặc id thay đổi
    fetchData();
    fetchMembership();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (data) {
      setEditForm({
        name: data.name || "",
        mobileNo: data.mobileNo || "",
        address: data.address || "",
        status: data.status || "Active",
      });
    }
  }, [data]);

useEffect(() => {
  if (!data) {
    setInitialMembershipId("");
    setSelectedMembershipId("");
    return;
  }
  const matched = membership.find(
    (item) =>
      (item.title || item.name) &&
      (item.title === data.plan || item.name === data.plan)
  );
  const matchedId = matched ? String(matched.id) : "";
  setInitialMembershipId(matchedId);
  setSelectedMembershipId(matchedId);
}, [data, membership]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("edit") === "1" && data) {
      setIsEditing(true);
    }
  }, [location.search, data]);

  useEffect(() => {
    return () => {
      if (editAvatarPreview) {
        URL.revokeObjectURL(editAvatarPreview);
      }
    };
  }, [editAvatarPreview]);

  const fetchMembership = async () => {
    try {
      const gymId = localStorage.getItem("gymId") || "1";
      const response = await axios.get(
        `http://localhost:5000/api/memberships?gymId=${gymId}`
      );
      setMembership(response.data || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách gói tập:", err);
      setMembership([]);
    }
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/members/${id}`
      );
      if (response.data) {
        const memberData = {
          ...response.data,
          createdAt:
            response.data.createdAt ||
            response.data.joinDate ||
            new Date().toISOString(),
          nextBillDate: response.data.nextBillDate || null,
          status: response.data.status || "Active",
          plan: response.data.plan || "No Plan",
          profilePic: response.data.profilePic || DEFAULT_AVATAR,
        };
        setData(memberData);
        setStatus(memberData.status);
        setPlanMember(memberData.plan);
      } else {
        toast.error("Không tìm thấy thành viên!");
        setData(null);
      }
      setLoading(false);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu thành viên:", err);
      toast.error("Không tìm thấy thành viên!");
      setData(null);
      setLoading(false);
    }
  };

  const handleSwitchBtn = () => {
    const newStatus = status === "Active" ? "Inactive" : "Active";
    setStatus(newStatus);
    toast.info(`Đã đổi trạng thái sang ${newStatus}`);
  };

  const isDateInPast = (inputDate) => {
    const today = new Date();
    const givenDate = new Date(inputDate);
    return givenDate < today;
  };

  const handleOnChangeSelect = (event) => {
    setPlanMember(event.target.value);
  };

  const handleRenewSaveBtn = async () => {
    if (!planMember) {
      toast.error("Vui lòng chọn gói tập!");
      return;
    }

    try {
      // Tìm membership được chọn
      const selectedMembership = membership.find(
        (m) => (m.name || m.title) === planMember
      );

      if (!selectedMembership) {
        toast.error("Không tìm thấy gói tập!");
        return;
      }

      // 1. Vô hiệu hóa tất cả subscriptions cũ của member (nếu có)
      try {
        const subsResponse = await axios.get(`http://localhost:5000/api/subscriptions?memberId=${id}&status=Active`);
        const activeSubscriptions = subsResponse.data || [];
        
        for (const sub of activeSubscriptions) {
          await axios.put(`http://localhost:5000/api/subscriptions/${sub.id}`, {
            status: 'Expired'
          });
        }
      } catch (err) {
        console.warn("Không thể vô hiệu hóa subscription cũ:", err);
      }

      // 2. Tính toán startDate và endDate
      const startDate = new Date();
      const endDate = new Date(startDate);
      const months = selectedMembership.months || selectedMembership.duration_in_months || 1;
      endDate.setMonth(endDate.getMonth() + months);

      // 3. Tạo subscription mới
      const subscriptionData = {
        memberId: Number(id),
        membershipId: selectedMembership.id,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: 'Active',
      };

      await axios.post('http://localhost:5000/api/subscriptions', subscriptionData);
      
      toast.success(`Gia hạn thành công với gói ${planMember}!`);
      setRenew(false);
      
      // Refresh dữ liệu member để cập nhật nextBillDate
      await fetchData();
    } catch (err) {
      console.error("Lỗi khi gia hạn:", err);
      toast.error(err.response?.data?.message || "Gia hạn thất bại!");
    }
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (editAvatarPreview) {
      URL.revokeObjectURL(editAvatarPreview);
    }
    setEditAvatarFile(file);
    setEditAvatarPreview(URL.createObjectURL(file));
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditAvatarFile(null);
    if (editAvatarPreview) {
      URL.revokeObjectURL(editAvatarPreview);
    }
    setEditAvatarPreview(null);
    if (data) {
      setEditForm({
        name: data.name || "",
        mobileNo: data.mobileNo || "",
        address: data.address || "",
        status: data.status || "Active",
      });
      const matched = membership.find(
        (item) =>
          (item.title || item.name) &&
          (item.title === data.plan || item.name === data.plan)
      );
      const matchedId = matched ? String(matched.id) : "";
      setInitialMembershipId(matchedId);
      setSelectedMembershipId(matchedId);
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim() || !editForm.mobileNo.trim()) {
      toast.error("Tên và số điện thoại là bắt buộc!");
      return;
    }
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("name", editForm.name);
      formData.append("mobileNo", editForm.mobileNo);
      formData.append("address", editForm.address);
      formData.append("status", editForm.status);
      if (editAvatarFile) {
        formData.append("avatar", editAvatarFile);
      }
      const response = await axios.put(
        `http://localhost:5000/api/members/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const updated = response.data;
      setData({
        ...updated,
        profilePic: updated.profilePic || DEFAULT_AVATAR,
      });
      setStatus(updated.status || "Active");
      setPlanMember(updated.plan || "No Plan");
      const membershipChanged =
        selectedMembershipId !== initialMembershipId;

      if (membershipChanged) {
        await updateMembership(selectedMembershipId);
      }

      toast.success("Cập nhật thông tin thành công!");
      cancelEdit();
    } catch (error) {
      console.error("Lỗi khi cập nhật hội viên:", error);
      toast.error(
        error.response?.data?.message || "Không thể cập nhật hội viên"
      );
    } finally {
      setSaving(false);
    }
  };

  const updateMembership = async (newMembershipId) => {
    try {
      // Expire old subscriptions
      try {
        const subsResponse = await axios.get(
          `http://localhost:5000/api/subscriptions?memberId=${id}&status=Active`
        );
        const activeSubscriptions = subsResponse.data || [];
        for (const sub of activeSubscriptions) {
          await axios.put(
            `http://localhost:5000/api/subscriptions/${sub.id}`,
            { status: "Expired" }
          );
        }
      } catch (err) {
        console.warn("Không thể vô hiệu hóa subscription cũ:", err);
      }

      if (!newMembershipId) {
        toast.info("Đã hủy gói tập của hội viên.");
        await fetchData();
        return;
      }

      const selectedMembership = membership.find(
        (m) => String(m.id) === String(newMembershipId)
      );

      if (!selectedMembership) {
        toast.error("Không tìm thấy gói tập đã chọn!");
        return;
      }

      const startDate = new Date();
      const endDate = new Date(startDate);
      const months =
        selectedMembership.months ||
        selectedMembership.duration_in_months ||
        1;
      endDate.setMonth(endDate.getMonth() + months);

      await axios.post("http://localhost:5000/api/subscriptions", {
        memberId: Number(id),
        membershipId: selectedMembership.id,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        status: "Active",
      });

      toast.success("Đã cập nhật gói tập cho hội viên!");
      await fetchData();
    } catch (error) {
      console.error("Lỗi khi cập nhật gói tập:", error);
      toast.error(
        error.response?.data?.message || "Không thể cập nhật gói tập"
      );
    }
  };

  const getProfileImageSrc = () => {
    const src = editAvatarPreview || (data && data.profilePic);
    if (!src || src === null || src === undefined || src === '') return DEFAULT_AVATAR;
    if (typeof src !== 'string') return DEFAULT_AVATAR;
    if (src.startsWith('http')) return src;
    if (src.startsWith('blob:')) return src; // For preview URLs
    // Đảm bảo đường dẫn bắt đầu bằng /
    const path = src.startsWith('/') ? src : `/${src}`;
    return `http://localhost:5000${path}`;
  };

  return (
    <div className="w-3/4 text-black p-5">
      <div
        onClick={() => navigate(-1)}
        className="border-2 w-fit text-xl font-sans text-white p-2 rounded-xl bg-slate-900 cursor-pointer"
      >
        <ArrowBackIcon /> Go Back
      </div>

      {loading ? (
        <div className="text-center mt-20 text-2xl text-gray-500">
          Đang tải dữ liệu...
        </div>
      ) : data ? (
        <div className="mt-10 p-2">
          <div className="w-full h-fit flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 mx-auto">
              <img
                src={getProfileImageSrc()}
                alt="member"
                className="w-full rounded-lg shadow-md object-cover"
              />
              {isEditing && (
                <div className="mt-4 flex flex-col gap-2">
                  <label className="text-lg font-semibold text-slate-700">
                    Ảnh đại diện
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
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
                    Ngày tham gia
                  </p>
                  <p className="text-lg font-semibold text-slate-800">
                    {data.createdAt
                      ? data.createdAt
                          .slice(0, 10)
                          .split("-")
                          .reverse()
                          .join("-")
                      : "Chưa có thông tin"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">
                    Ngày hết hạn
                  </p>
                  <p className="text-lg font-semibold text-slate-800">
                    {data.nextBillDate
                      ? data.nextBillDate
                          .slice(0, 10)
                          .split("-")
                          .reverse()
                          .join("-")
                      : "Chưa có gói tập"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">
                    Số điện thoại
                  </p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.mobileNo}
                      onChange={(e) =>
                        handleEditChange("mobileNo", e.target.value)
                      }
                      className="w-full border-2 border-slate-300 rounded-lg p-2 text-lg"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-slate-800">
                      {data.mobileNo}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">
                    Địa chỉ
                  </p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) =>
                        handleEditChange("address", e.target.value)
                      }
                      className="w-full border-2 border-slate-300 rounded-lg p-2 text-lg"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-slate-800">
                      {data.address}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-1 mb-4 text-2xl font-semibold flex items-center gap-4">
                Trạng thái:
                {isEditing ? (
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      handleEditChange("status", e.target.value)
                    }
                    className="border-2 border-slate-300 rounded-lg p-2 text-lg"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                ) : (
                  <>
                    <Switch
                      onColor="#6366F1"
                      checked={status === "Active"}
                      onChange={handleSwitchBtn}
                    />
                    <span
                      className={`font-bold ${
                        status === "Active" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {status}
                    </span>
                  </>
                )}
              </div>

              <div className="text-2xl mb-3 font-semibold">
                Gói hiện tại:{" "}
                <span className="text-indigo-600">{planMember}</span>
              </div>

              {isEditing && (
                <div className="mt-2 mb-4">
                  <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">
                    Chọn gói tập
                  </p>
                  <select
                    value={selectedMembershipId}
                    onChange={(e) => setSelectedMembershipId(e.target.value)}
                    className="w-full md:w-2/3 border-2 border-slate-300 rounded-lg p-2 text-lg"
                  >
                    <option value="">Chưa gán gói</option>
                    {membership.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.title || plan.name || `Gói ${plan.id}`}{" "}
                        {plan.price
                          ? `- ${plan.price.toLocaleString("vi-VN")}₫`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {( !data.nextBillDate || !planMember || planMember === "No Plan" || isDateInPast(data.nextBillDate) ) && (
                <div
                  onClick={() => setRenew((prev) => !prev)}
                  className={`mt-1 rounded-lg p-3 border-2 border-slate-900 text-center ${
                    renew && status === "Active"
                      ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white"
                      : ""
                  } w-full md:w-1/2 cursor-pointer hover:text-white hover:bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500`}
                >
                  Gia hạn
                </div>
              )}

              {renew && status === "Active" && (
                <div className="mt-4 space-y-4">
                  <select
                    value={planMember}
                    onChange={handleOnChangeSelect}
                    className="p-3 border border-gray-400 rounded-md w-full md:w-1/2"
                  >
                    {membership.map((plan) => (
                      <option key={plan.id} value={plan.name || plan.title}>
                        {plan.name || plan.title} -{" "}
                        {plan.price ? plan.price.toLocaleString("vi-VN") : "0"}₫
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleRenewSaveBtn}
                    className="block mt-2 bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              )}
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

export default MemberDetail;
