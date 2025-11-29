import React from "react";
import { Search } from "lucide-react"; // icon hiện đại

const SearchBar = ({ value, onChange, placeholder = "Tìm kiếm..." }) => {
  return (
    <div className="flex items-center w-full max-w-md bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-400 transition-all duration-300">
      <Search className="text-white/70 mr-3 w-5 h-5" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-white placeholder-white/60 focus:outline-none"
      />
    </div>
  );
};

export default SearchBar;
