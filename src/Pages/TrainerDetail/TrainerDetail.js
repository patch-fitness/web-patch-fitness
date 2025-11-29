import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";



const DEFAULT_AVATAR =
  "https://th.bing.com/th/id/OIP.gj6t3grz5no6UZ03uIluiwHaHa?rs=1&pid=ImgDetMain";

export default function TrainerDetail() {
  const { id } = useParams(); // lấy id từ URL
  const navigate = useNavigate();

  const [trainer, setTrainer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    mobileNo: "",
    sex: "",
    degree: "",
    salary: "",
    profilePic: "",
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper function to get proper image URL
  const getProfileImageSrc = (src) => {
    if (!src || src === null || src === undefined || src === '') return DEFAULT_AVATAR;
    if (typeof src !== 'string') return DEFAULT_AVATAR;
    if (src.startsWith('http')) return src;
    if (src.startsWith('blob:')) return src; // For preview URLs
    // Đảm bảo đường dẫn bắt đầu bằng /
    const path = src.startsWith('/') ? src : `/${src}`;
    return `http://localhost:5000${path}`;
  };

  // Fetch trainer data from API
  useEffect(() => {
    const fetchTrainer = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/trainers/${id}`);
        const found = response.data;
        if (found) {
          setTrainer(found);
          setEditForm({
            name: found.name || "",
            mobileNo: found.mobileNo || "",
            sex: found.sex || "",
            degree: found.degree || "",
            salary: found.salary || "",
            profilePic: found.profilePic || "",
          });
          setAvatarPreview(getProfileImageSrc(found.profilePic));
        } else {
          setTrainer(null);
          toast.error("Không tìm thấy huấn luyện viên!");
        }
        setLoading(false);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu trainer:", err);
        toast.error("Không tìm thấy huấn luyện viên!");
        setTrainer(null);
        setLoading(false);
      }
    };

    const fetchTrainerMembers = async () => {
      try {
        // Get subscriptions for this trainer
        const subsResponse = await axios.get(
          `http://localhost:5000/api/subscriptions?trainerId=${id}&status=Active`
        );
        const subscriptions = subsResponse.data || [];
        
        // Get member details for each subscription
        const memberPromises = subscriptions.map(sub => 
          axios.get(`http://localhost:5000/api/members/${sub.memberId}`)
            .then(res => res.data)
            .catch(() => null)
        );
        
        const trainerMembers = (await Promise.all(memberPromises)).filter(Boolean);
        setMembers(trainerMembers);
      } catch (err) {
        console.error("Lỗi khi tải danh sách học viên:", err);
        setMembers([]);
      }
    };

    fetchTrainer();
    fetchTrainerMembers();
  }, [id]);

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };
  // Hủy chỉnh sửa
  const cancelEdit = () => {
    if (!trainer) return;
    setIsEditing(false);
    setEditForm({
      name: trainer.name,
      mobileNo: trainer.mobileNo,
      sex: trainer.sex,
      degree: trainer.degree,
      salary: trainer.salary,
      profilePic: trainer.profilePic || "",
    });
    setAvatarPreview(getProfileImageSrc(trainer.profilePic));
    setNewAvatarFile(null);
  };

 const handleSaveEdit = async () => {
  if (!trainer) return;

  try {
    const formData = new FormData();
    formData.append("name", editForm.name);
    formData.append("mobileNo", editForm.mobileNo);
    formData.append("sex", editForm.sex || "");
    formData.append("degree", editForm.degree || "");
    if (editForm.salary) {
      formData.append("salary", editForm.salary);
    }
    if (newAvatarFile) {
      formData.append("avatar", newAvatarFile);
    }

    const response = await axios.put(
      `http://localhost:5000/api/trainers/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const updatedTrainer = response.data;
    setTrainer(updatedTrainer);
    setAvatarPreview(getProfileImageSrc(updatedTrainer.profilePic));
    setIsEditing(false);
    toast.success("Cập nhật thông tin thành công!");
  } catch (err) {
    console.error("Lỗi khi cập nhật trainer:", err);
    toast.error("Không thể cập nhật thông tin!");
  }
};

  if (loading) {
    return (
      <div className="w-3/4 text-black p-5">
        <div className="text-center mt-20 text-2xl text-gray-500">
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="w-3/4 text-black p-5">
        <div className="text-center mt-20 text-2xl text-gray-500">
          Không tìm thấy huấn luyện viên!
        </div>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="w-3/4 text-black p-5 space-y-5 ">

  {/* Go Back */}
  <div
    onClick={() => navigate(-1)}
    className="border-2 w-fit text-xl font-sans text-white p-2 rounded-xl bg-slate-900 cursor-pointer mb-5 flex items-center gap-2"
  >
    <ArrowBackIcon /> Go Back
  </div>

  <div className="flex flex-col md:flex-row gap-6">

    {/* Avatar */}
    <div className="md:w-1/3 mx-auto flex flex-col items-center">
      <img
        src={getProfileImageSrc(avatarPreview || trainer?.profilePic)}
        alt="avatar"
        className="w-full rounded-lg shadow-md object-cover"
      />
      {isEditing && (
        <input
          type="file"
          accept="image/*"
          className="mt-2 border-2 border-dashed p-2 rounded w-full"
          onChange={(e) => {
            const file = e.target.files[0];
            setNewAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
          }}
        />
      )}
    </div>

    {/* Info */}
    <div className="md:w-2/3 bg-white/80 p-6 rounded-2xl shadow-lg flex flex-col gap-4 mt-5">
      
      {/* Edit / Save / Cancel */}
      <div className="flex justify-end gap-2">
        {!isEditing ? (
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
        ) : (
          <>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded"
              onClick={handleSaveEdit}
            >
              Save
            </button>
            <button
              className="px-4 py-2 bg-gray-400 text-white rounded"
              onClick={cancelEdit}
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Info Fields */}
      <div className="space-y-3">
        <div>
          <label className="font-semibold">Name:</label>
          {isEditing ? (
            <input
              value={editForm.name}
              onChange={(e) => handleEditChange("name", e.target.value)}
              className="w-full border p-2 rounded"
            />
          ) : (
            <p>{trainer.name}</p>
          )}
        </div>

        <div>
          <label className="font-semibold">Mobile:</label>
          {isEditing ? (
            <input
              value={editForm.mobileNo}
              onChange={(e) => handleEditChange("mobileNo", e.target.value)}
              className="w-full border p-2 rounded"
            />
          ) : (
            <p>{trainer.mobileNo}</p>
          )}
        </div>

        <div>
          <label className="font-semibold">Sex:</label>
          {isEditing ? (
            <select
              value={editForm.sex}
              onChange={(e) => handleEditChange("sex", e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">Select…</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          ) : (
            <p>{trainer.sex}</p>
          )}
        </div>

        <div>
          <label className="font-semibold">Degree:</label>
          {isEditing ? (
            <input
              value={editForm.degree}
              onChange={(e) => handleEditChange("degree", e.target.value)}
              className="w-full border p-2 rounded"
            />
          ) : (
            <p>{trainer.degree}</p>
          )}
        </div>

        <div>
          <label className="font-semibold">Salary:</label>
          {isEditing ? (
            <input
              type="number"
              value={editForm.salary}
              onChange={(e) => handleEditChange("salary", e.target.value)}
              className="w-full border p-2 rounded"
            />
          ) : (
            <p>{trainer.salary}</p>
          )}
        </div>
      </div>
    </div>
  </div>
  {/* Members list */}
<h2 className="text-2xl font-semibold text-slate-900 mb-3">
  Học viên của Trainer
</h2>

<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 ">
  {members.length > 0 ? (
    members.filter(m => m && m.id).map((m) => (
      <div
        key={m.id}
        className="bg-white p-4 rounded-xl shadow hover:shadow-md cursor-pointer transition"
        onClick={() => navigate(`/member/${m.id}`)}
      >
        {/* Avatar */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
            {m.profilePic ? (
              <img
                src={getProfileImageSrc(m.profilePic)}
                alt={m.name || 'Member'}
                className="w-full h-full object-cover"
              />
            ) : (
              <PersonIcon className="text-slate-700" />
            )}
          </div>
          <div>
            <div className="text-lg font-semibold">{m.name || 'N/A'}</div>
            <div className="text-sm text-slate-500">{m.mobileNo || 'N/A'}</div>
          </div>
        </div>
      </div>
    ))
  ) : (
    <div className="col-span-3 text-center text-slate-500 text-xl mt-10">
      Trainer chưa có học viên
    </div>
  )}
</div>

      <ToastContainer />
    </div>
  );
}
