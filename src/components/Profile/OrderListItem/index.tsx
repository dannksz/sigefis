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
  };
};

type OrderListItemProps = {
  id: number;
  status: string;
  total: number;
  criadoEm: string;
  itens: OrderItem[];
};

export default function OrderListItem({
  id,
  status,
  total,
  criadoEm,
  itens
}: OrderListItemProps) {
  const router = useRouter();
  const firstProduct = itens[0]?.produto?.nome || "Produto";
  const itemCount = itens.reduce((acc, item) => acc + item.quantidade, 0);
  
  // Formatar data
  const dataFormatada = new Date(criadoEm).toLocaleDateString('pt-BR');

  // Código do pedido formatado
  const codigo = `#${id.toString().padStart(6, '0')}`;

  const handleViewDetails = () => {
    router.push(`/perfil/pedidos/${id}`);
  };

  return (
    <div className="grid grid-cols-6 gap-4 items-center bg-gray-100 p-4 rounded-lg hover:bg-gray-200 transition-colors">
      {/* ID */}
      <div className="font-medium text-gray-900">
        #{id}
      </div>

      {/* PRODUTO */}
      <div className="col-span-2 text-gray-800">
        {firstProduct}
        {itens.length > 1 && (
          <span className="text-sm text-gray-600 ml-2">
            +{itens.length - 1} item(ns)
          </span>
        )}
      </div>

      {/* STATUS */}
      <div>
        <OrderStatusBadge status={status} />
      </div>

      {/* QUANTIDADE */}
      <div className="text-center text-gray-700">
        {itemCount}
      </div>

      {/* DATA + AÇÕES */}
      <div className="flex items-center justify-between">
        <span className="text-gray-700">{dataFormatada}</span>
        <button
          onClick={handleViewDetails}
          aria-label="Ver detalhes do pedido"
          className="p-2 hover:bg-gray-300 rounded-full transition-colors"
        >
          <Info size={20} className="text-blue-600" />
        </button>
      </div>
    </div>
  );
}
