"use client";

import { Package } from "lucide-react";
import Link from "next/link";
import OrderStatusBadge from "./OrderStatusBadge";

type OrderItem = {
  id: number;
  quantidade: number;
  preco: number;
  produto: {
    nome: string;
    imagemUrl: string | null;
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
  itens,
}: OrderListItemProps) {
  const codigo = `#${id.toString().padStart(6, '0')}`;
  const dataFormatada = new Date(criadoEm).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const totalQuantidade = itens.reduce((acc, item) => acc + item.quantidade, 0);
  const primeiroItem = itens[0];

  return (
    <Link
      href={`/perfil/pedidos/${id}`}
      className="grid grid-cols-6 gap-4 px-4 py-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
    >
      <div className="font-medium text-gray-900">{codigo}</div>
      
      <div className="col-span-2 flex items-center gap-3">
        {primeiroItem?.produto.imagemUrl ? (
          <img
            src={primeiroItem.produto.imagemUrl}
            alt={primeiroItem.produto.nome}
            className="w-10 h-10 object-cover rounded bg-gray-100"
          />
        ) : (
          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
            <Package size={16} className="text-gray-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {primeiroItem?.produto.nome || "Produto"}
          </p>
          {itens.length > 1 && (
            <p className="text-xs text-gray-500">
              +{itens.length - 1} {itens.length - 1 === 1 ? 'item' : 'itens'}
            </p>
          )}
        </div>
      </div>
      
      <div>
        <OrderStatusBadge status={status} />
      </div>
      
      <div className="text-center font-medium text-gray-900">
        {totalQuantidade}
      </div>
      
      <div className="text-gray-600">{dataFormatada}</div>
    </Link>
  );
}
