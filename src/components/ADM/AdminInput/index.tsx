type AdminInputProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  step?: string;
};

export default function AdminInput({ 
  label, 
  name, 
  value, 
  onChange, 
  type = "text", 
  required = true,
  step
}: AdminInputProps) {
  return (
    <div className="relative w-full">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        step={step}
        className="peer w-full border-2 border-gray-300 rounded-lg bg-white px-4 py-3 text-gray-900 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none hover:border-gray-400"
        placeholder=" "
      />
      <label 
        className="absolute -top-3 left-3 bg-white px-2 text-sm font-medium text-gray-600 transition-all duration-200"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    </div>
  );
}
