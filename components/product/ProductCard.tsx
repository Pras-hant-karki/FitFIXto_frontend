'use client';

import { Product } from '@/types';
import { Card } from '@/components/common';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  return (
    <Card className="flex flex-col">
      <div className="relative h-48 bg-gray-200 dark:bg-zinc-800 rounded-md mb-4 overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
        {product.discount && (
          <div className="absolute top-3 right-3 bg-red-900 text-white px-3 py-1 rounded-full text-sm font-bold">
            {product.discount}% off
          </div>
        )}
      </div>

      <h3 className="font-bold text-lg mb-2 line-clamp-2">{product.name}</h3>
      
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1">
          {[...Array(Math.round(product.rating))].map((_, i) => (
            <span key={i} className="text-yellow-500">★</span>
          ))}
        </div>
        <span className="text-sm text-gray-500 dark:text-zinc-400">({product.reviewCount})</span>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="font-black text-xl">${product.price}</span>
          {product.originalPrice && (
            <span className="text-sm text-gray-500 dark:text-zinc-400 line-through">
              ${product.originalPrice}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => onAddToCart?.(product)}
        className="mt-auto w-full bg-white dark:bg-zinc-800 text-black dark:text-white border border-gray-200 dark:border-zinc-600 py-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 transition font-bold"
      >
        Add to Cart
      </button>
    </Card>
  );
};
