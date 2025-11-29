import "./App.css";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import Dashboard from "@/Pages/Dashboard/Dashboard";
import Home from "@/Pages/Home/Home";
import Members from "@/Pages/Members/Members";
import Trainers from "@/Pages/Trainers/Trainers";
import GeneralUser from "@/Pages/GeneralUser/GeneralUser";
import MemberDetail from "@/Pages/MemberDetail/MemberDetail";
import TrainerDetail from "@/Pages/TrainerDetail/TrainerDetail";
import Equipment from "@/Pages/Equipment/Equipment";
import EquipmentDetail from "@/Pages/EquipmentDetail/EquipmentDetail";
import Finance from "@/Pages/Finance/Finance";
import FinanceDashboard from "@/Pages/Finance/FinanceDashboard";
import TransactionList from "@/Pages/Finance/TransactionList";
import AddExpense from "@/Pages/Finance/AddExpense";
import PTCommissionSettings from "@/Pages/Finance/PTCommissionSettings";
import CreateSubscription from "@/Pages/Subscriptions/CreateSubscription";
import TrainerScheduleOverview from "@/Pages/Subscriptions/TrainerScheduleOverview";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Help from "@/components/Help/Help";
import { useTheme } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle/ThemeToggle";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLogin(!!token);

    if (token && location.pathname === "/") {
      navigate("/dashboard", { replace: true });
    } else if (!token && location.pathname !== "/") {
      navigate("/", { replace: true });
    }
  }, [location.pathname, navigate]);

  if (isLogin === null) {
    return (
      <div className={`flex items-center justify-center h-screen ${
        isDark ? 'bg-stone-950 text-white' : 'bg-stone-50 text-stone-900'
      }`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
          <span className="text-lg font-medium">Đang tải...</span>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLogin(false);
    navigate("/");
    toast.success("Đăng xuất thành công!");
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-stone-950' 
        : 'bg-stone-100'
    }`}>
      {/* Sidebar */}
      {isLogin && location.pathname !== "/" && <Sidebar onLogout={handleLogout} />}

      {/* Main Content */}
      <div className="flex-1 relative overflow-auto">
        {/* Theme Toggle Button */}
        {isLogin && location.pathname !== "/" && (
          <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
          </div>
        )}

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/member/:id" element={<MemberDetail />} />
          <Route path="/trainers" element={<Trainers />} />
          <Route path="/trainers/:id" element={<TrainerDetail />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/equipment/:id" element={<EquipmentDetail />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/finance/dashboard" element={<FinanceDashboard />} />
          <Route path="/finance/transactions" element={<TransactionList />} />
          <Route path="/finance/add-expense" element={<AddExpense />} />
          <Route path="/finance/pt-commission" element={<PTCommissionSettings />} />
          <Route path="/subscriptions/create" element={<CreateSubscription />} />
          <Route path="/trainers/schedule-overview" element={<TrainerScheduleOverview />} />
          <Route path="/specific/:page" element={<GeneralUser />} />
        </Routes>
      </div>

      {/* Toast Container */}
      {isLogin && (
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={isDark ? 'dark' : 'light'}
          toastClassName={`!rounded-xl !shadow-lg ${
            isDark ? '!bg-stone-800 !text-white' : '!bg-white !text-stone-900'
          }`}
          progressClassName="!bg-primary-500"
        />
      )}

      {/* Help Button */}
      {isLogin && location.pathname !== "/" && <Help />}
    </div>
  );
}

export default App;
