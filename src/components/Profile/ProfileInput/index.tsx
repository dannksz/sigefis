"use client";

import { useId, type ComponentProps, type ReactNode } from "react";

type ProfileInputProps = {
  label: string;
  name: string;
  value?: string;
  defaultValue?: string;
  formatter?: (value: string) => string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
} & Pick<ComponentProps<"input">, "autoComplete" | "maxLength" | "minLength" | "inputMode">;

export default function ProfileInput({ 
  label, 
  name, 
  value, 
  defaultValue,
  formatter,
  onChange, 
  type = "text", 
  required = false,
  readOnly = false,
  icon,
  disabled = false,
  ...attributes
}: ProfileInputProps) {
  const id = useId();
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          {...attributes}
          id={id}
          type={type}
          name={name}
          value={value}
          defaultValue={defaultValue}
          onChange={(event) => {
            if (formatter) event.currentTarget.value = formatter(event.currentTarget.value);
            onChange?.(event);
          }}
          required={required}
          readOnly={readOnly}
          disabled={disabled}
          className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus-visible:outline-2 focus-visible:outline-primary-dark transition-colors ${
            icon ? "pl-10" : ""
          } ${
            readOnly || disabled ? "bg-gray-50 text-gray-600" : "bg-white"
          }`}
        />
      </div>
    </div>
  );
}
