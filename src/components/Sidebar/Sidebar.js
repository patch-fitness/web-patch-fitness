import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import SportsIcon from "@mui/icons-material/Sports";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { useLocation } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";

const menuItems = [
  { icon: DashboardIcon, label: "Bảng điều khiển", path: "/dashboard" },
  { icon: PeopleIcon, label: "Thành viên", path: "/members" },
  { icon: SportsIcon, label: "Huấn luyện viên", path: "/trainers" },
  { icon: FitnessCenterIcon, label: "Thiết bị", path: "/equipment" },
  { icon: AccountBalanceWalletIcon, label: "Tài chính", path: "/finance" },
];

const Sidebar = ({ userName = "Người dùng" }) => {
  const [userAvatar, setUserAvatar] = useState("/people.png");
  const [activeMenu, setActiveMenu] = useState("Bảng điều khiển");
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    const currentItem = menuItems.find((item) =>
      location.pathname.startsWith(item.path)
    );
    if (currentItem) {
      setActiveMenu(currentItem.label);
    }
  }, [location.pathname, navigate]);

  if (!localStorage.getItem("token")) return null;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUserAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleClick = (item) => {
    setActiveMenu(item.label);
    navigate(item.path);
  };

  return (
    <div className={`w-72 min-h-screen p-5 flex flex-col justify-between transition-all duration-300 ${
      isDark 
        ? 'bg-stone-900/95 backdrop-blur-xl border-r border-stone-800' 
        : 'bg-white/95 backdrop-blur-xl border-r border-stone-200 shadow-lg'
    }`}>
      {/* User Profile */}
      <div>
        <div className="text-center mb-8">
          <div
            className={`relative w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
              isDark 
                ? 'bg-gradient-to-br from-primary-500 to-accent-500 p-0.5' 
                : 'bg-gradient-to-br from-primary-400 to-accent-400 p-0.5'
            }`}
            onClick={() => document.getElementById("avatar-upload").click()}
          >
            <div className={`w-full h-full rounded-[14px] overflow-hidden ${isDark ? 'bg-stone-900' : 'bg-white'}`}>
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <svg
                    className={`w-12 h-12 ${isDark ? 'text-stone-600' : 'text-stone-300'}`}
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
              )}
            </div>
          </div>

          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          <h3 className={`text-lg font-bold transition-colors ${
            isDark ? 'text-white' : 'text-stone-900'
          }`}>
            {getGreeting()}!
          </h3>
          <p className={`text-sm font-medium transition-colors ${
            isDark ? 'text-primary-400' : 'text-primary-600'
          }`}>admin</p>
          <p className={`text-xs mt-1 transition-colors ${
            isDark ? 'text-stone-500' : 'text-stone-500'
          }`}>
            Chúc bạn một ngày tốt lành ✨
          </p>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          {menuItems.map((item, idx) => {
            const IconComponent = item.icon;
            const isActive = activeMenu === item.label;
            return (
              <button
                key={idx}
                onClick={() => handleClick(item)}
                className={`group flex items-center px-4 py-3 rounded-xl w-full text-left transition-all duration-200 ${
                  isActive
                    ? isDark
                      ? "bg-gradient-to-r from-primary-500/20 to-accent-500/10 text-primary-400 border-l-[3px] border-primary-500"
                      : "bg-gradient-to-r from-primary-50 to-accent-50 text-primary-700 border-l-[3px] border-primary-500"
                    : isDark
                    ? "text-stone-400 hover:text-white hover:bg-stone-800/50"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                }`}
              >
                <IconComponent 
                  className={`mr-3 transition-all duration-200 ${
                    isActive 
                      ? 'text-primary-500' 
                      : isDark ? 'text-stone-500 group-hover:text-primary-400' : 'text-stone-400 group-hover:text-primary-500'
                  }`}
                  sx={{ fontSize: 22 }}
                />
                <span className={`font-medium text-sm ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Button */}
      <div className={`mt-6 pt-6 border-t transition-colors ${
        isDark ? 'border-stone-800' : 'border-stone-200'
      }`}>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
            isDark
              ? 'text-stone-400 hover:text-rose-400 hover:bg-rose-500/10'
              : 'text-stone-600 hover:text-rose-600 hover:bg-rose-50'
          }`}
        >
          <LogoutIcon className="mr-3" sx={{ fontSize: 20 }} />
          <span className="font-medium text-sm">Đăng xuất</span>
        </button>
        
        {/* Branding */}
        <div className={`mt-6 text-center text-xs ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>
          <p className="font-semibold">PATCH FITNESS</p>
          <p>v2.0 • 2025</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
