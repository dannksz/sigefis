"use client";

type OrderStatusBadgeProps = {
  status: string;
};

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; bg: string }> = {
      PENDENTE: {
        label: "Pendente",
        color: "text-yellow-700",
        bg: "bg-yellow-100 border-yellow-300"
      },
      CONFIRMADO: {
        label: "Confirmado",
        color: "text-blue-700",
        bg: "bg-blue-100 border-blue-300"
      },
      PREPARANDO: {
        label: "Preparando",
        color: "text-orange-700",
        bg: "bg-orange-100 border-orange-300"
      },
      ENVIADO: {
        label: "Enviado",
        color: "text-purple-700",
        bg: "bg-purple-100 border-purple-300"
      },
      ENTREGUE: {
        label: "Entregue",
        color: "text-green-700",
        bg: "bg-green-100 border-green-300"
      },
      CANCELADO: {
        label: "Cancelado",
        color: "text-red-700",
        bg: "bg-red-100 border-red-300"
      }
    };

    return statusMap[status.toUpperCase()] || {
      label: status,
      color: "text-gray-700",
      bg: "bg-gray-100 border-gray-300"
    };
  };

  const statusInfo = getStatusInfo(status);

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusInfo.bg} ${statusInfo.color}`}
    >
      {statusInfo.label}
    </span>
  );
}
