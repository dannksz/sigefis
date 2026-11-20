"use client";

import { useState } from "react";

type ProductFiltersProps = {
  onFilterChange: (filter: string) => void;
  activeFilter: string;
};

const leagues = [
  { id: "all", name: "Todas", color: "bg-gray-100 text-gray-800" },
  { id: "NBA", name: "NBA", color: "bg-orange-100 text-orange-800" },
  { id: "NFL", name: "NFL", color: "bg-green-100 text-green-800" },
  { id: "NHL", name: "NHL", color: "bg-blue-100 text-blue-800" },
  { id: "MLS", name: "MLS", color: "bg-red-100 text-red-800" },
];

export default function ProductFilters({ onFilterChange, activeFilter }: ProductFiltersProps) {
  return (
    <div className="flex gap-4 text-sm mb-6">
      {leagues.map((league) => (
        <button
          key={league.id}
          onClick={() => onFilterChange(league.id)}
          className={`px-4 py-2 border rounded hover:bg-gray-100 transition-colors ${
            activeFilter === league.id 
              ? "bg-blue-600 text-white border-blue-600" 
              : "border-gray-300"
          }`}
        >
          {league.name}
        </button>
      ))}
    </div>
  );
}