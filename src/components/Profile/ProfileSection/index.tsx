"use client";

import { ReactNode } from "react";
import { Edit2 } from "lucide-react";

type ProfileSectionProps = {
  title: string;
  children: ReactNode;
  onEdit?: () => void;
  showEdit?: boolean;
};

export default function ProfileSection({ 
  title, 
  children, 
  onEdit,
  showEdit = false
}: ProfileSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {showEdit && onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Editar
          </button>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}
