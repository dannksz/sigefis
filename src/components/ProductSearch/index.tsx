"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

type ProductSearchProps = {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
};

export default function ProductSearch({ 
  onSearch, 
  placeholder = "Pesquisar produtos...", 
  className = "" 
}: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Busca em tempo real - dispara a cada mudança no input
  useEffect(() => {
    onSearch(searchQuery);
  }, [searchQuery, onSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
        />
        {searchQuery && (
          <button 
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}