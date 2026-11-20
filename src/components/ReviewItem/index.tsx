import React from 'react';
import StarRating from '../StarRating';

interface ReviewItemProps {
  review: {
    id: number;
    nota: number;
    comentario: string;
    criadoEm: string;
    usuario: {
      nome: string;
    };
  };
}

export default function ReviewItem({ review }: ReviewItemProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="border-b border-gray-200 pb-4 mb-4 last:border-b-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {review.usuario.nome.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{review.usuario.nome}</p>
            <p className="text-sm text-gray-500">{formatDate(review.criadoEm)}</p>
          </div>
        </div>
        <StarRating rating={review.nota} readonly size="sm" />
      </div>
      {review.comentario && (
        <p className="text-gray-700 mt-2 leading-relaxed">
          {review.comentario}
        </p>
      )}
    </div>
  );
}