"use client";

import { ReactNode } from "react";

type AddressCardProps = {
  numero: number;
  logradouro: string;
  numeroEndereco: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  onEdit: () => void;
  onDelete: () => void;
};

export default function AddressCard({
  numero,
  logradouro,
  numeroEndereco,
  complemento,
  bairro,
  cidade,
  uf,
  cep,
  onEdit,
  onDelete
}: AddressCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Endereço {numero}</h3>
        <button
          onClick={onEdit}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
          aria-label="Editar endereço"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      <div className="space-y-1 text-gray-700">
        <p className="font-medium">{logradouro}, {numeroEndereco}</p>
        {complemento && <p>{complemento}</p>}
        <p>{bairro}</p>
        <p>{cidade} - {uf}</p>
        <p>{cep}</p>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 text-sm font-medium"
        >
          Excluir endereço
        </button>
      </div>
    </div>
  );
}
