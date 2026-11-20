"use client";

import { useState } from "react";

type ProductSearchProps = {
  onSearch: (query: string) => void;
};

export default function ProductSearch({ onSearch }: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <div className="flex justify-end mb-8">
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Nova pesquisa"
          className="px-4 py-2 border border-gray-300 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button 
          type="submit"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          🔍
        </button>
      </form>
    </div>
  );
}