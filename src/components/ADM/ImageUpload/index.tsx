"use client";
import { useState, useRef } from "react";
import { FileText, Upload, X } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  label: string;
  onChange: (file: File | null) => void;
  value?: File | null;
  accept?: string;
  maxBytes?: number;
  hint?: string;
  disabled?: boolean;
}

export default function ImageUpload({ label, onChange, value, accept = "image/*", maxBytes, hint, disabled }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selected, setSelected] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const file = value === undefined ? selected : value;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.currentTarget.value = "";
  };

  const processFile = (file: File) => {
    const allowed = accept.split(",").some((rule) => {
      const type = rule.trim().toLowerCase();
      if (type.startsWith(".")) return file.name.toLowerCase().endsWith(type);
      if (type.endsWith("/*")) return file.type.startsWith(type.slice(0, -1));
      return file.type === type;
    });
    if (!allowed || !file.size || (maxBytes !== undefined && file.size > maxBytes)) {
      setError(!allowed ? "Formato de arquivo não aceito." : !file.size ? "O arquivo está vazio." : "O arquivo excede o tamanho permitido.");
      return;
    }
    setError("");
    setSelected(file);
    onChange(file);
    setPreview(null);
    if (!file.type.startsWith("image/")) return;
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
    if (file && !disabled) {
      processFile(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setSelected(null);
    setError("");
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      {!file ? (
        <button
          type="button"
          disabled={disabled}
          aria-label={`Escolher ${label.toLowerCase()}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full border-2 border-dashed rounded-lg bg-white p-6 text-center cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isDragging 
              ? 'border-primary-dark bg-primary/10'
              : 'border-gray-300 hover:border-primary-dark'
          }`}
        >
          <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-700 mb-1">Escolher arquivo</p>
          <p className="text-xs text-gray-500">ou arraste o arquivo até aqui</p>
          {hint && <p className="mt-2 text-xs text-gray-600">{hint}</p>}
        </button>
      ) : (
        <div className="relative border-2 border-gray-300 rounded-lg p-4">
          <button
            type="button"
            disabled={disabled}
            aria-label="Remover arquivo selecionado"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
          {preview && file.type.startsWith("image/") ? <Image
            src={preview}
            alt="Prévia do arquivo selecionado"
            width={480}
            height={192}
            unoptimized
            className="w-full h-48 object-contain rounded"
          /> : <FileText className="mb-2 size-7 text-gray-500" aria-hidden="true" />}
          <p className="break-all pr-8 text-sm font-medium">{file.name}</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleFileChange}
        className="hidden"
      />
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
    </div>
  );
}
