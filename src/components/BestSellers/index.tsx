import ProductCard from "@/components/ProductCard";
import React from "react";

type Product = {
  id: number;
  nome: string;
  preco?: number | string;
  imagemUrl?: string;
  sale?: boolean;
  desconto?: number;
  time?: {
    nome?: string;
    liga?: { sigla?: string };
  };
};

const fallbackProducts: Product[] = [
  { id: 1, nome: 'Chicago Bulls - Michael Jordan #23', preco: 499.9, imagemUrl: '/images/prodImages/jordan_bulls_23_1996.jpg', sale: true, desconto: 15 },
  { id: 2, nome: 'Los Angeles Lakers - LeBron James #6', preco: 549.9, imagemUrl: '/images/prodImages/lebron_lakers_6_2024.jpg', sale: true, desconto: 10 },
  { id: 3, nome: 'Golden State Warriors - S. Curry #30', preco: 529.9, imagemUrl: '/images/prodImages/curry_30_2024.jpg' },
  { id: 4, nome: 'New York Rangers - Wayne Gretzky #99', preco: 599.9, imagemUrl: '/images/prodImages/gretzky_99_1996.jpg' },
  { id: 5, nome: 'Los Angeles Kings - Anze Kopitar #11', preco: 489.9, imagemUrl: '/images/prodImages/kane_88_2023.jpg' },
  { id: 6, nome: 'Kansas City Chiefs - Patrick Mahomes #15', preco: 519.9, imagemUrl: '/images/prodImages/mahomes_15_2024.jpg', sale: true, desconto: 12 },
  { id: 7, nome: 'Inter Miami - Lionel Messi #10', preco: 459.9, imagemUrl: '/images/prodImages/messi_intermiami_10_2024.jpg' }
];

function normalizePrice(value?: number | string) {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  const normalized = String(value)
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default async function BestSellers() {
  let products: Product[] = fallbackProducts;

  try {
    const response = await fetch('/api/produtos?limit=7', {
      cache: 'no-store'
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data?.produtos) && data.produtos.length > 0) {
        products = data.produtos.map((product: any) => ({
          id: product.id,
          nome: product.nome,
          preco: normalizePrice(product.preco),
          imagemUrl: product.imagemUrl || product.imagem || '/images/prodImages/placeholder.svg',
          sale: Boolean(product.sale),
          desconto: product.desconto || 0,
          time: product.time
        }));
      }
    }
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
  }

  return (
    <section className="py-10">
      <div className="w-full max-w-[1750px] px-4 mx-auto">
        <div className="flex justify-center">
          <div className="inline-grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-6 justify-items-center">
            {products.map((product: Product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  nome: product.nome,
                  preco: normalizePrice(product.preco),
                  imagemUrl: product.imagemUrl || '/images/prodImages/placeholder.svg',
                  sale: Boolean(product.sale),
                  desconto: product.desconto || 0,
                  liga: product.time?.liga?.sigla || 'NBA',
                  time: product.time,
                  esporte: 'Basquete'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
