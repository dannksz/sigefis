"use client";
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/useToast';
import StarRating from '../StarRating';
import { Send } from 'lucide-react';

interface ReviewFormProps {
  produtoId: number;
  onReviewSubmitted: () => void;
}

export default function ReviewForm({ produtoId, onReviewSubmitted }: ReviewFormProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      setError('Você precisa estar logado para avaliar');
      return;
    }

    if (rating === 0) {
      setError('Por favor, selecione uma avaliação');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/avaliacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuarioId: session.user.id,
          produtoId,
          nota: rating,
          comentario: comentario.trim() || null
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar avaliação');
      }

      // Limpar formulário
      setRating(0);
      setComentario('');
      onReviewSubmitted();
      
      showToast('Avaliação enviada com sucesso!', 'success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg text-center">
        <p className="text-gray-600">
          <a href="/login" className="text-primary hover:underline">
            Faça login
          </a> para avaliar este produto
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-semibold text-gray-900 mb-4">Avaliar produto</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sua avaliação:
        </label>
        <StarRating 
          rating={rating} 
          onRatingChange={setRating} 
          size="lg" 
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comentário (opcional):
        </label>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
          rows={3}
          placeholder="Conte sua experiência com este produto..."
          maxLength={500}
        />
        <p className="text-xs text-gray-500 mt-1">
          {comentario.length}/500 caracteres
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || rating === 0}
        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Send className="w-4 h-4" />
        {loading ? 'Enviando...' : 'Enviar Avaliação'}
      </button>
    </form>
  );
}