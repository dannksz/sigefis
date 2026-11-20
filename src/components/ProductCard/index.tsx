import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";

type ProductCardProps = {
  product: {
    id: number | string;
    nome: string;
    preco: number | string;
    imagemUrl?: string;
    sale?: boolean;
    desconto?: number;
    time?: {
      nome: string;
      liga?: {
        nome: string;
        sigla: string;
      };
    };
    esporte?: string;
    liga?: string;
  };
};

export default function ProductCard({ product }: ProductCardProps) {
  const imagePath = product.imagemUrl || '/images/produto-placeholder.jpg';
  
  const precoOriginal = typeof product.preco === 'number' 
    ? product.preco 
    : parseFloat(product.preco?.toString() || '0');
  
  const desconto = product.desconto || 0;
  const precoComDesconto = product.sale && desconto > 0 
    ? precoOriginal * (1 - desconto / 100) 
    : precoOriginal;
    
  const precoDisplay = `R$ ${precoComDesconto.toFixed(2)}`;
  const precoOriginalDisplay = product.sale && desconto > 0 
    ? `R$ ${precoOriginal.toFixed(2)}`
    : null;

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
      <Link href={`/produtos/${product.id}`} className="flex-grow flex flex-col">
        <div className="aspect-square bg-gray-200 rounded-t-lg relative overflow-hidden">
          <Image
            src={imagePath}
            alt={product.nome}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            unoptimized
          />
          {product.sale && (
            <div className="absolute top-2 right-2">
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border border-red-600 animate-pulse">
                {desconto > 0 ? `🔥 ${desconto}% OFF` : '🔥 PROMOÇÃO'}
              </span>
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <p className="text-[1.005rem] font-bold text-gray-600 mb-1 line-clamp-2 min-h-[3rem]">{product.nome}</p>
          <p className="text-gray-600 mb-1">
            {product.time?.liga?.sigla || product.liga || product.esporte || 'N/A'}
          </p>
          <p className="text-xs text-gray-600 mb-2">Original</p>
          <div className="mt-auto">
            {product.sale && desconto > 0 ? (
              <div className="space-y-1">
                <p className="text-sm text-gray-500 line-through">{precoOriginalDisplay}</p>
                <p className="font-bold text-red-600 text-lg">{precoDisplay}</p>
                <p className="text-xs text-green-600 font-medium">Economia de {desconto}%!</p>
              </div>
            ) : (
              <p className="font-bold text-gray-800">{precoDisplay}</p>
            )}
          </div>
        </div>
      </Link>
      
      {/* Botão Comprar */}
      <div className="p-4 pt-0">
        <Link href={`/produtos/${product.id}`}>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
            <ShoppingCart className="w-4 h-4" />
            Comprar
          </button>
        </Link>
      </div>
    </div>
  );
}