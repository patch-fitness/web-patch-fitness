import React, { useState } from "react";
import "@/index.css";
import {mockUser} from "@/data/mockData";
import { useNavigate } from "react-router-dom";

export default function AuthTabs({ setAuthView }) {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
  e.preventDefault();

  if (isLogin) {
    // Kiểm tra mock login
    if (
      formData.email === mockUser.username &&
      formData.password === mockUser.password
    ) {
      localStorage.setItem("token", "fakeToken123");
      navigate("/dashboard"); // chuyển sang dashboard
    } else {
      setError("Sai email hoặc mật khẩu!");
    }
  } else {
    // Đăng ký
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }

    alert(`Đăng ký thành công! Chào mừng ${formData.fullName}`);
    setIsLogin(true);
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
    });
  }
};


  const toggleForm = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
    });
  };

  return (
    <div className="min-h-full gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-effect rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg
                className="w-8 h-8 text-purple-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {isLogin ? "Đăng nhập" : "Đăng ký"}
            </h2>
            <p className="text-white/80">
              {isLogin ? "Chào mừng bạn trở lại!" : "Tạo tài khoản mới"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <>
                {/* Họ và tên */}
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2 text-left">
                    Họ và tên
                  </label>
                </div>
              </>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-300 input-focus"
                  placeholder="Nhập họ và tên"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-white/90 text-sm font-medium mb-2 text-left">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-300 input-focus"
                placeholder="Nhập email của bạn"
                required
              />
            </div>

            <div>
              <label className="block text-white/90 text-sm font-medium mb-2 text-left">
                Mật khẩu
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-300 input-focus"
                placeholder="Nhập mật khẩu"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2 text-left">
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-300 input-focus"
                  placeholder="Nhập lại mật khẩu"
                  required={!isLogin}
                />
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-purple-600 bg-white/20 border-white/30 rounded focus:ring-purple-500"
                  />
                  <span className="ml-2 text-white/80 text-sm">
                    Ghi nhớ đăng nhập
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setAuthView("forgot")}
                  className="text-white/80 hover:text-white text-sm transition-colors"
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-white text-purple-600 py-3 px-4 rounded-lg font-semibold hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 btn-hover"
            >
              {isLogin ? "Đăng nhập" : "Đăng ký"}
            </button>
          </form>

          {/* Toggle Form */}
          <div className="mt-8 text-center">
            <p className="text-white/80">
              {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
              <button
                onClick={toggleForm}
                className="ml-2 text-white font-semibold hover:underline transition-all duration-300"
              >
                {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
