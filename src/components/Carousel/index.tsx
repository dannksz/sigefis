"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface CarouselItem {
  id: number;
  titulo: string;
  descricao?: string;
  imagemUrl: string;
  linkUrl?: string;
}

export default function Carousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [bannerImages, setBannerImages] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarCarousels();
  }, []);

  const carregarCarousels = async () => {
    try {
      const response = await fetch('/api/carousel');

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.warn('Falha ao carregar carousel:', response.status, errorText);
      } else {
        const data = await response.json().catch(() => []);
        if (Array.isArray(data) && data.length > 0) {
          setBannerImages(data);
          return;
        }
        console.warn('Dados do carousel vazios ou inválidos, usando fallback.');
      }

      setBannerImages([
        {
          id: 1,
          titulo: "Coleção NBA",
          descricao: "Os melhores jerseys da temporada",
          imagemUrl: "/images/Carousel/nba.jpeg",
          linkUrl: "/produtos?liga=NBA"
        },
        {
          id: 2,
          titulo: "Novidades NFL",
          descricao: "Equipamentos oficiais dos times",
          imagemUrl: "/images/Carousel/nfl.jpeg",
          linkUrl: "/produtos?liga=NFL"
        },
        {
          id: 3,
          titulo: "Hockey NHL",
          descricao: "Jerseys autênticos",
          imagemUrl: "/images/Carousel/nhl.jpeg",
          linkUrl: "/produtos?liga=NHL"
        },
        {
          id: 4,
          titulo: "MLS Soccer",
          descricao: "Camisas dos melhores times",
          imagemUrl: "/images/Carousel/mls.jpeg",
          linkUrl: "/produtos?liga=MLS"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  };

  // Auto-scroll do carousel
  useEffect(() => {
    if (bannerImages.length > 1) {
      const interval = setInterval(nextSlide, 5000); // 5 segundos
      return () => clearInterval(interval);
    }
  }, [bannerImages.length]);

  if (loading || !Array.isArray(bannerImages) || bannerImages.length === 0) {
    return (
      <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden bg-gray-100 mb-8">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden bg-gray-100 mb-8">
      <div className="relative w-full h-full">
        {bannerImages.map((slide, index) => {
          const SlideContent = (
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="relative w-full h-full">
                <img
                  src={slide.imagemUrl}
                  alt={slide.titulo}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <div className="text-center text-white px-4">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">{slide.titulo}</h1>
                    {slide.descricao && (
                      <p className="text-xl md:text-2xl">{slide.descricao}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );

          // Se tem linkUrl, envolver com Link
          return slide.linkUrl ? (
            <Link key={slide.id} href={slide.linkUrl} className="cursor-pointer">
              {SlideContent}
            </Link>
          ) : (
            <div key={slide.id}>
              {SlideContent}
            </div>
          );
        })}

        {bannerImages.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-all z-10"
            >
              <ChevronLeft size={24} />
            </button>

            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-all z-10"
            >
              <ChevronRight size={24} />
            </button>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
              {bannerImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
