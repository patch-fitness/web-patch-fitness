import React from "react";
import DashboardCard from "@/Pages/Dashboard/DashboardCard";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import AccessAlarmIcon from "@mui/icons-material/AccessAlarm";
import ErrorIcon from "@mui/icons-material/Error";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import ReportIcon from "@mui/icons-material/Report";
import WarningIcon from "@mui/icons-material/Warning";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import GridViewIcon from "@mui/icons-material/GridView";

import { useTheme } from "@/contexts/ThemeContext";

const Dashboard = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const handleOnClickMenu = (func) => {
    sessionStorage.setItem("func", func);
  };

  return (
    <div className={`min-h-screen p-6 lg:p-8 transition-colors duration-300 ${
      isDark ? 'bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950' : 'bg-gradient-to-br from-stone-50 via-primary-50/30 to-stone-100'
    }`}>
      {/* Page Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-xl ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}>
            <GridViewIcon className="text-primary-500" sx={{ fontSize: 28 }} />
          </div>
          <h1 className={`text-3xl lg:text-4xl font-bold ${
            isDark ? 'text-white' : 'text-stone-900'
          }`}>
            Bảng điều khiển
          </h1>
        </div>
        <p className={`text-lg ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
          Tổng quan hệ thống quản lý phòng gym
        </p>
      </div>

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
        {/* Joined Members */}
        <DashboardCard
          to="/members"
          icon={<PeopleAltIcon sx={{ fontSize: 44 }} />}
          title="Thành viên đã tham gia"
          color="#10b981"
          onClick={() => handleOnClickMenu("joinedMembers")}
        />

        {/* Monthly Joined */}
        <DashboardCard
          to="/specific/monthly"
          icon={<SignalCellularAltIcon sx={{ fontSize: 44 }} />}
          title="Tham gia trong tháng"
          color="#8b5cf6"
          onClick={() => handleOnClickMenu("monthlyJoined")}
        />

        {/* Expiring in 3 Days */}
        <DashboardCard
          to="/specific/threeDayExpire"
          icon={<AccessAlarmIcon sx={{ fontSize: 44 }} />}
          title="Hết hạn trong 3 ngày"
          color="#f43f5e"
          onClick={() => handleOnClickMenu("threeDayExpire")}
        />

        {/* Expiring in 4–7 Days */}
        <DashboardCard
          to="/specific/fourToSevenDaysExpire"
          icon={<WarningIcon sx={{ fontSize: 44 }} />}
          title="Hết hạn trong 4–7 ngày"
          color="#f59e0b"
          onClick={() => handleOnClickMenu("fourToSevenDaysExpire")}
        />

        {/* Expired Members */}
        <DashboardCard
          to="/specific/expired"
          icon={<ErrorIcon sx={{ fontSize: 44 }} />}
          title="Thành viên hết hạn"
          color="#ef4444"
          onClick={() => handleOnClickMenu("expired")}
        />

        {/* Inactive Members */}
        <DashboardCard
          to="/specific/inactive"
          icon={<ReportIcon sx={{ fontSize: 44 }} />}
          title="Thành viên không hoạt động"
          color="#eab308"
          onClick={() => handleOnClickMenu("inActiveMembers")}
        />

        {/* Equipment Management */}
        <DashboardCard
          to="/equipment"
          icon={<FitnessCenterIcon sx={{ fontSize: 44 }} />}
          title="Quản lý thiết bị"
          color="#14b8a6"
          onClick={() => handleOnClickMenu("equipment")}
        />

        {/* Finance Management */}
        <DashboardCard
          to="/finance"
          icon={<AccountBalanceWalletIcon sx={{ fontSize: 44 }} />}
          title="Quản lý tài chính"
          color="#ec4899"
          onClick={() => handleOnClickMenu("finance")}
        />
      </div>
    </div>
  );
};

export default Dashboard;
