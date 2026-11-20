"use client";
import React, { useState, useEffect } from 'react';
import StarRating from '../StarRating';
import ReviewItem from '../ReviewItem';
import ReviewForm from '../ReviewForm';
import { Star } from 'lucide-react';

interface Review {
  id: number;
  nota: number;
  comentario: string;
  criadoEm: string;
  usuario: {
    nome: string;
  };
}

interface ReviewSectionProps {
  produtoId: number;
}

export default function ReviewSection({ produtoId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: [0, 0, 0, 0, 0] // índice 0 = 1 estrela, índice 4 = 5 estrelas
  });

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/avaliacoes?produtoId=${produtoId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (reviewsData: Review[]) => {
    const total = reviewsData.length;
    if (total === 0) {
      setStats({
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: [0, 0, 0, 0, 0]
      });
      return;
    }

    const sum = reviewsData.reduce((acc, review) => acc + review.nota, 0);
    const average = sum / total;

    const distribution = [0, 0, 0, 0, 0];
    reviewsData.forEach(review => {
      const starIndex = Math.floor(review.nota) - 1;
      if (starIndex >= 0 && starIndex < 5) {
        distribution[starIndex]++;
      }
    });

    setStats({
      totalReviews: total,
      averageRating: average,
      ratingDistribution: distribution
    });
  };

  useEffect(() => {
    fetchReviews();
  }, [produtoId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Avaliações</h2>
      
      {/* Estatísticas */}
      {stats.totalReviews > 0 && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Média geral */}
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {stats.averageRating.toFixed(1)}
              </div>
              <StarRating rating={stats.averageRating} readonly size="lg" />
              <p className="text-gray-600 mt-2">
                {stats.totalReviews} avaliação{stats.totalReviews !== 1 ? 'ões' : ''}
              </p>
            </div>

            {/* Distribuição das estrelas */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(star => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 w-8">
                    {star} <Star className="w-3 h-3 inline" />
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 rounded-full h-2 transition-all"
                      style={{ 
                        width: `${stats.totalReviews > 0 
                          ? (stats.ratingDistribution[star - 1] / stats.totalReviews) * 100 
                          : 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">
                    {stats.ratingDistribution[star - 1]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Formulário de nova avaliação */}
      <div className="mb-8">
        <ReviewForm 
          produtoId={produtoId} 
          onReviewSubmitted={fetchReviews}
        />
      </div>

      {/* Lista de avaliações */}
      <div>
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Seja o primeiro a avaliar este produto!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">
              Comentários dos clientes
            </h3>
            {reviews.map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}