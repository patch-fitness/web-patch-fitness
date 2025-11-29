import { useState } from "react";
import AuthTabs from "@/components/AuthForm/AuthTabs";
import ForgotForm from "@/components/AuthForm/ForgotForm";
import OTPForm from "@/components/AuthForm/OTPForm";
import SuccessScreen from "@/components/AuthForm/SuccessScreen";

export default function AuthForm() {
  const [authView, setAuthView] = useState("authTabs"); 
  // authTabs = chứa login/signup
  // forgot, otp, success = các màn riêng

  const renderView = () => {
    switch (authView) {
      case "authTabs":
        return <AuthTabs setAuthView={setAuthView} />;
      case "forgot":
        return <ForgotForm setAuthView={setAuthView} />;
      case "otp":
        return <OTPForm setAuthView={setAuthView} />;
      case "success":
        return <SuccessScreen setAuthView={setAuthView} />;
      default:
        return null;
    }
  };

  return (
    <div className="">
        {renderView()}
     </div>

  );
}
