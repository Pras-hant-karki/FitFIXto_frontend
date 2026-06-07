"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ShoppingCart, Heart, Star, CheckCircle2 } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────
interface Product {
  id: number;
  image: string;
  category: string;
  brand: string;
  condition: 'New' | 'Refurbished';
  name: string;
  rating: number;
  reviews: number;
  price: number;
  originalPrice: number;
  discount: number;
  verified: boolean;
}

interface Filters {
  categories: string[];
  priceRange: [number, number];
  conditions: string[];
  brands: string[];
}

// ─── Mock Data ───────────────────────────────────────
const PRODUCTS: Product[] = [
  {
    id: 1,
    image: 'dumbbell.png',
    category: 'Dumbbells',
    brand: 'IronCore',
    condition: 'New',
    name: 'Pro Hex Dumbbell Set 5-50lbs',
    rating: 4.8,
    reviews: 312,
    price: 599,
    originalPrice: 799,
    discount: 25,
    verified: true,
  },
  {
    id: 2,
    image: 'dumbbell.png',
    category: 'Dumbbells',
    brand: 'IronCore',
    condition: 'New',
    name: 'Pro Hex Dumbbell Set 5-50lbs',
    rating: 4.8,
    reviews: 312,
    price: 599,
    originalPrice: 799,
    discount: 25,
    verified: true,
  },
  {
    id: 3,
    image: 'protein.png',
    category: 'Supplements',
    brand: 'PureFuel',
    condition: 'New',
    name: 'Premium Whey Isolate 5lb',
    rating: 4.7,
    reviews: 1204,
    price: 79,
    originalPrice: 99,
    discount: 20,
    verified: true,
  },
  {
    id: 4,
    image: 'dumbbell.png',
    category: 'Dumbbells',
    brand: 'IronCore',
    condition: 'New',
    name: 'Pro Hex Dumbbell Set 5-50lbs',
    rating: 4.8,
    reviews: 312,
    price: 599,
    originalPrice: 799,
    discount: 25,
    verified: true,
  },
  {
    id: 5,
    image: 'dumbbell.png',
    category: 'Dumbbells',
    brand: 'IronCore',
    condition: 'New',
    name: 'Pro Hex Dumbbell Set 5-50lbs',
    rating: 4.8,
    reviews: 312,
    price: 599,
    originalPrice: 799,
    discount: 25,
    verified: true,
  },
  {
    id: 6,
    image: 'dumbbell.png',
    category: 'Dumbbells',
    brand: 'IronCore',
    condition: 'New',
    name: 'Pro Hex Dumbbell Set 5-50lbs',
    rating: 4.8,
    reviews: 312,
    price: 599,
    originalPrice: 799,
    discount: 25,
    verified: true,
  },
];

const CATEGORIES = ['Dumbbells', 'Racks', 'Supplements', 'Cardio', 'Benches', 'Barbells'];
const CONDITIONS = ['New', 'Refurbished'];
const BRANDS = ['IronCore', 'TitanForge', 'PureFuel', 'RunForge'];
const MAX_PRICE = 3000;

// ─── Custom Dual Range Slider ────────────────────────
interface DualRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

const DualRangeSlider: React.FC<DualRangeSliderProps> = ({ min, max, value, onChange }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);

  const getPercentage = useCallback(
    (val: number) => ((val - min) / (max - min)) * 100,
    [min, max]
  );

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return min;
      const rect = trackRef.current.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(min + percentage * (max - min));
    },
    [min, max]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      const newValue = getValueFromPosition(e.clientX);
      if (dragging === 'min') {
        onChange([Math.min(newValue, value[1] - 50), value[1]]);
      } else {
        onChange([value[0], Math.max(newValue, value[0] + 50)]);
      }
    };

    const handleMouseUp = () => setDragging(null);

    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, value, onChange, getValueFromPosition]);

  const minPercent = getPercentage(value[0]);
  const maxPercent = getPercentage(value[1]);

  return (
    <div className="relative w-full h-12 select-none">
      {/* Track Background */}
      <div
        ref={trackRef}
        className="absolute top-1/2 left-0 right-0 h-2 -mt-1 rounded-full bg-gray-200"
      />
      
      {/* Active Track (Black to Red Gradient) */}
      <div
        className="absolute top-1/2 h-2 -mt-1 rounded-full"
        style={{
          left: `${minPercent}%`,
          right: `${100 - maxPercent}%`,
          background: 'linear-gradient(to right, #000000, #dc2626)',
        }}
      />

      {/* Min Handle */}
      <div
        className="absolute top-1/2 w-5 h-5 -mt-2.5 -ml-2.5 rounded-full bg-white border-2 border-black shadow-md cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10"
        style={{ left: `${minPercent}%` }}
        onMouseDown={() => setDragging('min')}
      />
      
      {/* Max Handle */}
      <div
        className="absolute top-1/2 w-5 h-5 -mt-2.5 -ml-2.5 rounded-full bg-white border-2 border-red-600 shadow-md cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10"
        style={{ left: `${maxPercent}%` }}
        onMouseDown={() => setDragging('max')}
      />

      {/* Price Labels */}
      <div className="flex justify-between mt-4 text-sm text-gray-600">
        <span>${value[0]}</span>
        <span>${value[1]}</span>
      </div>
    </div>
  );
};

// ─── Filter Checkbox ─────────────────────────────────
interface FilterCheckboxProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

const FilterCheckbox: React.FC<FilterCheckboxProps> = ({ label, checked, onChange }) => (
  <label className="flex items-center space-x-3 cursor-pointer group">
    <div
      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
        checked
          ? 'bg-black border-black'
          : 'border-gray-300 group-hover:border-gray-400'
      }`}
      onClick={onChange}
    >
      {checked && <CheckCircle2 className="w-3 h-3 text-white" />}
    </div>
    <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
  </label>
);

// ─── Product Card ────────────────────────────────────
const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
  <div className="bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
    {/* Image Area */}
    <div className="relative h-56 bg-gray-50">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-full object-cover"
      />
      
      {/* Verified Badge */}
      {product.verified && (
        <div className="absolute top-3 left-3 flex items-center space-x-1 bg-black text-white text-xs font-bold px-2 py-1 rounded">
          <CheckCircle2 className="w-3 h-3" />
          <span>VERIFIED</span>
        </div>
      )}
      
      {/* Discount Badge */}
      <div className="absolute top-3 left-24 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
        -{product.discount}%
      </div>
      
      {/* Wishlist */}
      <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-100 transition-colors">
        <Heart className="w-4 h-4 text-gray-600" />
      </button>
    </div>

    {/* Content */}
    <div className="p-4">
      <div className="text-xs text-gray-500 mb-1">
        {product.category} · {product.brand}
      </div>
      
      <h3 className="font-semibold text-gray-900 mb-2 leading-tight">
        {product.name}
      </h3>
      
      {/* Rating */}
      <div className="flex items-center space-x-1 mb-3">
        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
        <span className="text-sm font-semibold text-gray-900">{product.rating}</span>
        <span className="text-sm text-gray-500">({product.reviews})</span>
      </div>
      
      {/* Price */}
      <div className="flex items-baseline space-x-2 mb-4">
        <span className="text-xl font-bold text-gray-900">${product.price}</span>
        <span className="text-sm text-gray-400 line-through">${product.originalPrice}</span>
      </div>
      
      {/* Add to Cart */}
      <button className="w-full bg-black text-white py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-800 transition-colors font-medium">
        <ShoppingCart className="w-4 h-4" />
        <span>Add to Cart</span>
      </button>
    </div>
  </div>
);

// ─── Main Shop Component ─────────────────────────────
const Shop: React.FC = () => {
  const [filters, setFilters] = useState<Filters>({
    categories: [],
    priceRange: [0, MAX_PRICE],
    conditions: [],
    brands: [],
  });

  const toggleFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => {
      const current = prev[key] as string[];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  // Filter products
  const filteredProducts = PRODUCTS.filter((product) => {
    if (filters.categories.length > 0 && !filters.categories.includes(product.category))
      return false;
    if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1])
      return false;
    if (filters.conditions.length > 0 && !filters.conditions.includes(product.condition))
      return false;
    if (filters.brands.length > 0 && !filters.brands.includes(product.brand))
      return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Shop Your Needs</h1>
          <p className="text-sm text-gray-500">
            Showing {filteredProducts.length} of {PRODUCTS.length} products
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="space-y-8">
              {/* Category Filter */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Category</h3>
                <div className="space-y-3">
                  {CATEGORIES.map((cat) => (
                    <FilterCheckbox
                      key={cat}
                      label={cat}
                      checked={filters.categories.includes(cat)}
                      onChange={() => toggleFilter('categories', cat)}
                    />
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Price Range</h3>
                <DualRangeSlider
                  min={0}
                  max={MAX_PRICE}
                  value={filters.priceRange}
                  onChange={(range) => setFilters((prev) => ({ ...prev, priceRange: range }))}
                />
                <p className="text-xs text-gray-500 mt-2">Up to ${MAX_PRICE}</p>
              </div>

              {/* Condition Filter */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Condition</h3>
                <div className="space-y-3">
                  {CONDITIONS.map((cond) => (
                    <FilterCheckbox
                      key={cond}
                      label={cond}
                      checked={filters.conditions.includes(cond)}
                      onChange={() => toggleFilter('conditions', cond)}
                    />
                  ))}
                </div>
              </div>

              {/* Brand Filter */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Brand</h3>
                <div className="space-y-3">
                  {BRANDS.map((brand) => (
                    <FilterCheckbox
                      key={brand}
                      label={brand}
                      checked={filters.brands.includes(brand)}
                      onChange={() => toggleFilter('brands', brand)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <main className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">No products match your filters.</p>
                <button
                  onClick={() =>
                    setFilters({
                      categories: [],
                      priceRange: [0, MAX_PRICE],
                      conditions: [],
                      brands: [],
                    })
                  }
                  className="mt-4 text-black font-semibold hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Shop;
