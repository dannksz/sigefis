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
  enderecoEntrega,
}: OrderCardProps) {
  const codigo = `#${id.toString().padStart(6, '0')}`;
  const dataFormatada = new Date(criadoEm).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Pedido Mais Recente</h3>
          <p className="text-sm text-gray-600">
            {codigo} • {dataFormatada}
          </p>
        </div>
        <OrderStatusBadge status={status} />
      </div>

      {/* Itens */}
      <div className="space-y-3 mb-4">
        {itens.slice(0, 3).map((item) => (
          <div key={item.id} className="flex gap-3 items-center">
            {item.produto.imagemUrl ? (
              <img
                src={item.produto.imagemUrl}
                alt={item.produto.nome}
                className="w-16 h-16 object-cover rounded bg-gray-100"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                <Package size={24} className="text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-gray-900">{item.produto.nome}</p>
              <p className="text-sm text-gray-600">Quantidade: {item.quantidade}</p>
            </div>
            <p className="font-semibold text-gray-900">
              {formatCurrency(item.preco * item.quantidade)}
            </p>
          </div>
        ))}
        {itens.length > 3 && (
          <p className="text-sm text-gray-600 text-center">
            +{itens.length - 3} {itens.length - 3 === 1 ? 'item' : 'itens'}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600">Total</span>
          <span className="text-xl font-bold text-green-600">
            {formatCurrency(total)}
          </span>
        </div>
        {enderecoEntrega && (
          <p className="text-sm text-gray-600 mb-3">
            Entrega: {enderecoEntrega}
          </p>
        )}
        <Link
          href={`/perfil/pedidos/${id}`}
          className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Ver Detalhes
        </Link>
      </div>
    </div>
  );
}
