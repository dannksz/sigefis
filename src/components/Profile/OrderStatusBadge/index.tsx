"use client";

type OrderStatusBadgeProps = {
  status: string;
};

const statusConfig = {
  pendente: {
    label: "Pendente",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200"
  },
  processando: {
    label: "Processando",
    color: "bg-blue-100 text-blue-800 border-blue-200"
  },
  enviado: {
    label: "Enviado",
    color: "bg-purple-100 text-purple-800 border-purple-200"
  },
  entregue: {
    label: "Entregue",
    color: "bg-green-100 text-green-800 border-green-200"
  },
  cancelado: {
    label: "Cancelado",
    color: "bg-red-100 text-red-800 border-red-200"
  }
};

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
      {config.label}
    </span>
  );
}
