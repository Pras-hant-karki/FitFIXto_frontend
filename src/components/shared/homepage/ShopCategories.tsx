"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { BackendProduct, fetchProducts, formatCategory, getProductImage, productCategoryTree } from "@/features/products";

type CategoryCard = {
  value: string;
  label: string;
  count: number;
  image: string;
};

const categoryOrder = new Map(productCategoryTree.map((category, index) => [category.value, index]));

const pluralizeProduct = (count: number) => `${count} product${count === 1 ? "" : "s"}`;

export function ShopCategories() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadProducts = async () => {
      try {
        const response = await fetchProducts({ isActive: true, limit: 100, page: 1 });

        if (isActive) {
          setProducts(response?.products || []);
        }
      } catch {
        if (isActive) {
          setProducts([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      isActive = false;
    };
  }, []);

  const categories = useMemo<CategoryCard[]>(() => {
    const grouped = new Map<string, BackendProduct[]>();

    products
      .filter((product) => product.isActive !== false && product.category)
      .forEach((product) => {
        const current = grouped.get(product.category) || [];
        grouped.set(product.category, [...current, product]);
      });

    return Array.from(grouped.entries())
      .map(([category, items]) => {
        const productWithImage = items.find((product) => Boolean(getProductImage(product)));

        return {
          value: category,
          label: formatCategory(category),
          count: items.length,
          image: productWithImage ? getProductImage(productWithImage) : "",
        };
      })
      .sort((left, right) => {
        const leftOrder = categoryOrder.get(left.value) ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = categoryOrder.get(right.value) ?? Number.MAX_SAFE_INTEGER;

        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }

        return left.label.localeCompare(right.label);
      });
  }, [products]);

  const openCategory = (category: CategoryCard) => {
    const shopUrl = `/shop?category=${encodeURIComponent(category.value)}`;

    if (!isAuthenticated && !isAuthLoading) {
      router.push(`/login?redirect=${encodeURIComponent(shopUrl)}`);
      return;
    }

    router.push(shopUrl);
  };

  if (isLoading || categories.length === 0) {
    return null;
  }

  return (
    <section className="home-section section-soft" id="categories">
      <div className="section-inner">
        <div className="section-heading compact">
          <p>Shop The Floor</p>
          <h2>Shop by Category</h2>
        </div>

        <div className="category-grid">
          {categories.map((category) => (
            <button className="category-card" key={category.value} onClick={() => openCategory(category)} type="button">
              {category.image ? <img src={category.image} alt={category.label} /> : <span className="category-card-media-empty" />}
              <span className="category-shade" />
              <strong>{category.label}</strong>
              <small>{pluralizeProduct(category.count)}</small>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
