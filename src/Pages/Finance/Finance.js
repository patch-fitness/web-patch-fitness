import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Finance = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to new finance dashboard
    navigate('/finance/dashboard', { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-xl text-gray-600">Đang chuyển hướng...</div>
    </div>
  );
};

export default Finance;

