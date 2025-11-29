import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";

const DashboardCard = ({ to, icon, title, color, onClick }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl p-6 text-center transition-all duration-300 transform hover:-translate-y-2 ${
        isDark
          ? 'bg-stone-800/60 backdrop-blur-sm border border-stone-700/50 hover:border-stone-600 hover:shadow-xl hover:shadow-black/20'
          : 'bg-white/80 backdrop-blur-sm border border-stone-200/50 hover:border-stone-300 hover:shadow-xl hover:shadow-stone-200/50'
      }`}
    >
      {/* Gradient accent line at top */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 opacity-80 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}90)` }}
      />
      
      {/* Background glow effect on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle at center, ${color}, transparent 70%)` }}
      />

      {/* Icon */}
      <div 
        className="mb-4 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg"
        style={{ color }}
      >
        {icon}
      </div>

      {/* Title */}
      <p className={`text-base font-semibold transition-colors ${
        isDark ? 'text-stone-200' : 'text-stone-800'
      }`}>
        {title}
      </p>

      {/* Animated underline */}
      <div 
        className="mt-4 h-0.5 w-0 group-hover:w-16 transition-all duration-300 mx-auto rounded-full"
        style={{ backgroundColor: color }}
      />
    </Link>
  );
};

export default DashboardCard;
