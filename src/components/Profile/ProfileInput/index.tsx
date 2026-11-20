"use client";

import { ReactNode } from "react";

type ProfileInputProps = {
  label: string;
  name: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
};

export default function ProfileInput({ 
  label, 
  name, 
  value, 
  onChange, 
  type = "text", 
  required = false,
  readOnly = false,
  icon,
  disabled = false
}: ProfileInputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          readOnly={readOnly}
          disabled={disabled}
          className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            icon ? "pl-10" : ""
          } ${
            readOnly || disabled ? "bg-gray-50 text-gray-600" : "bg-white"
          }`}
        />
      </div>
    </div>
  );
}
