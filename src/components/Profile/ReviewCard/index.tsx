"use client";

import { Pencil, Trash2 } from "lucide-react";
import StarRating from "../StarRating";
import { useRouter } from "next/navigation";

type ReviewCardProps = {
  id: number;
  produtoNome: string;
  produtoImagem: string | null;
  nota: number;
  comentario: string | null;
  criadoEm: string;
  onDelete: (id: number) => void;
};

export default function ReviewCard({
  id,
  produtoNome,
  produtoImagem,
  nota,
  comentario,
  criadoEm,
  onDelete
}: ReviewCardProps) {
  const router = useRouter();
  const dataFormatada = new Date(criadoEm).toLocaleDateString('pt-BR');

  const handleEdit = () => {
    router.push(`/perfil/avaliacoes/editar/${id}`);
  };

  return (
    <div className="bg-gray-100 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Imagem do produto */}
        {produtoImagem ? (
          <img
            src={produtoImagem}
            alt={produtoNome}
            className="w-24 h-24 object-cover rounded-lg bg-gray-200"
          />
        ) : (
          <div className="w-24 h-24 bg-gray-300 rounded-lg flex items-center justify-center">
            <span className="text-gray-500 text-xs text-center">Sem imagem</span>
          </div>
        )}

        {/* Conteúdo */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{produtoNome}</h3>
          
          <div className="mb-3">
            <StarRating rating={nota} size={20} showValue={true} />
          </div>

          {comentario && (
            <p className="text-gray-700 mb-3 line-clamp-3">{comentario}</p>
          )}

          <p className="text-sm text-gray-500">Avaliado em {dataFormatada}</p>
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleEdit}
            aria-label="Editar avaliação"
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <Pencil size={20} className="text-blue-600" />
          </button>
          <button
            onClick={() => onDelete(id)}
            aria-label="Deletar avaliação"
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <Trash2 size={20} className="text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
