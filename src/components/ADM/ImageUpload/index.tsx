"use client";
import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";

interface ImageUploadProps {
  label: string;
  onChange: (file: File | null) => void;
  value?: File | null;
}

export default function ImageUpload({ label, onChange, value }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    onChange(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      {!preview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-500'
          }`}
        >
          <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-700 mb-1">Escolher arquivo</p>
          <p className="text-xs text-gray-500">ou arraste o arquivo até aqui</p>
          <p className="text-xs text-gray-400 mt-2">Nenhum arquivo enviado</p>
        </div>
      ) : (
        <div className="relative border-2 border-gray-300 rounded-lg p-4">
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-contain rounded"
          />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
