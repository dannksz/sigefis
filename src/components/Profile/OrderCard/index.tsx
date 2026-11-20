"use client";

import { Info } from "lucide-react";
import OrderStatusBadge from "../OrderStatusBadge";
import { useRouter } from "next/navigation";

type OrderItem = {
  id: number;
  quantidade: number;
  preco: number;
  produto: {
    nome: string;
    imagemUrl: string | null;
  };
};

type OrderCardProps = {
  id: number;
  status: string;
  total: number;
  criadoEm: string;
  itens: OrderItem[];
  enderecoEntrega?: string;
};

export default function OrderCard({
  id,
  status,
  total,
  criadoEm,
  itens,
  enderecoEntrega
}: OrderCardProps) {
  const router = useRouter();
  const firstItem = itens[0];
  const itemCount = itens.reduce((acc, item) => acc + item.quantidade, 0);
  
  // Formatar data
  const dataFormatada = new Date(criadoEm).toLocaleDateString('pt-BR');

  // Código do pedido formatado
  const codigo = `#${id.toString().padStart(6, '0')}`;

  return (
    <div className="bg-gray-100 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">Pedido mais recente:</h3>
          <p className="text-lg font-medium text-gray-800 mb-4">
            {firstItem?.produto.nome || "Produto"}
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Status</p>
              <OrderStatusBadge status={status} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Quantidade</p>
              <p className="text-gray-700">{itemCount}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Código</p>
              <p className="text-gray-700">{codigo}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Data</p>
              <p className="text-gray-700">{dataFormatada}</p>
            </div>
          </div>

          {enderecoEntrega && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-900">Entregue em</p>
              <p className="text-gray-700">{enderecoEntrega}</p>
            </div>
          )}
        </div>

        {/* Imagem do produto */}
        <div className="ml-6">
          {firstItem?.produto.imagemUrl ? (
            <img
              src={firstItem.produto.imagemUrl}
              alt={firstItem.produto.nome}
              className="w-48 h-48 object-cover rounded-lg bg-gray-200"
            />
          ) : (
            <div className="w-48 h-48 bg-gray-300 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">Sem imagem</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
