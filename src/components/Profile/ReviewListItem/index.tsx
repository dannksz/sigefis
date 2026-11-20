"use client";

import StarRating from "../StarRating";

type ReviewListItemProps = {
  id: number;
  produtoNome: string;
  nota: number;
  criadoEm: string;
  comentario: string | null;
};

export default function ReviewListItem({
  id,
  produtoNome,
  nota,
  criadoEm,
  comentario
}: ReviewListItemProps) {
  const dataFormatada = new Date(criadoEm).toLocaleDateString('pt-BR');

  return (
    <div className="bg-gray-100 p-4 rounded-lg hover:bg-gray-200 transition-colors">
      <div className="grid grid-cols-4 gap-4 items-center">
        {/* ID */}
        <div className="font-medium text-gray-900">
          #{id}
        </div>

        {/* PRODUTO */}
        <div className="text-gray-800">
          {produtoNome}
        </div>

        {/* AVALIAÇÃO */}
        <div>
          <StarRating rating={nota} size={18} showValue={false} />
        </div>

        {/* AVALIADO EM */}
        <div className="text-gray-700">
          {dataFormatada}
        </div>
      </div>

      {/* AVALIAÇÃO ESCRITA */}
      {comentario && (
        <div className="mt-3 pt-3 border-t border-gray-300">
          <p className="text-sm font-semibold text-gray-900 mb-1">AVALIAÇÃO ESCRITA</p>
          <p className="text-gray-700">{comentario}</p>
        </div>
      )}
    </div>
  );
}
