"use client";

import Link from "next/link";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { addCartItem } from "@/features/cart";
import { formatCategory, getProductImage } from "@/features/products";
import { useAuth, useWishlist } from "@/contexts";
import type { BackendWishlistItem } from "@/features/wishlist";

const WishlistProductCard = ({
  item,
  onRemove,
}: {
  item: BackendWishlistItem;
  onRemove: (productId: string) => Promise<void>;
}) => {
  const product = item.productId;

  if (!product?._id) {
    return null;
  }

  const handleAddToCart = async () => {
    await addCartItem(product._id, 1);
  };

  return (
    <article className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <Link href={`/products/${product._id}`} className="block h-72 bg-gray-100">
        {getProductImage(product) ? (
          <img src={getProductImage(product)} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="product-no-image">No image</div>
        )}
      </Link>

      <div className="p-5">
        <p className="text-sm font-medium text-gray-500">{formatCategory(product.category)}</p>
        <Link href={`/products/${product._id}`} className="mt-2 block text-xl font-black text-gray-950 hover:underline">
          {product.name}
        </Link>
        <p className="mt-5 text-2xl font-black text-gray-950">Npr {product.price}</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex h-12 items-center justify-center gap-2 rounded-md bg-[#020011] text-sm font-black text-white transition hover:bg-gray-800"
          >
            <ShoppingCart className="h-4 w-4" />
            Add
          </button>
          <button
            type="button"
            onClick={() => onRemove(product._id)}
            className="flex h-12 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white text-sm font-black text-gray-950 transition hover:bg-gray-50"
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </button>
        </div>
      </div>
    </article>
  );
};

export default function WishlistPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { wishlist, wishlistCount, isWishlistLoading, removeFromWishlist } = useWishlist();
  const isLoading = isAuthLoading || isWishlistLoading;

  const handleRemove = async (productId: string) => {
    await removeFromWishlist(productId);
  };

  if (!isAuthenticated && !isAuthLoading) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-4xl font-black text-gray-950">Your Wishlist</h1>
        <p className="mt-3 text-lg font-bold text-gray-500">Sign in to see your saved items.</p>
        <div className="mt-10 rounded-xl border border-gray-200 bg-white px-6 py-24 text-center">
          <Heart className="mx-auto h-16 w-16 text-gray-500" />
          <h2 className="mt-6 text-2xl font-black text-gray-950">Your wishlist is waiting</h2>
          <p className="mt-4 text-lg text-gray-500">Login to save your favourite gear and find it again later.</p>
          <Link href="/login" className="mt-8 inline-flex rounded-md bg-[#020011] px-8 py-4 text-lg font-bold text-white">
            Login
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-4xl font-black text-gray-950">Your Wishlist</h1>
      <p className="mt-3 text-lg font-bold text-gray-500">
        {isLoading ? "Loading saved items..." : `${wishlistCount} saved ${wishlistCount === 1 ? "item" : "items"}`}
      </p>

      {!isLoading && wishlistCount === 0 ? (
        <div className="mt-10 rounded-xl border border-gray-200 bg-white px-6 py-24 text-center">
          <Heart className="mx-auto h-16 w-16 text-gray-500" />
          <h2 className="mt-6 text-2xl font-black text-gray-950">Your wishlist is empty</h2>
          <p className="mt-4 text-lg text-gray-500">Save your favourite gear and we'll keep it ready.</p>
          <Link href="/shop" className="mt-8 inline-flex rounded-md bg-[#020011] px-8 py-4 text-lg font-bold text-white">
            Start Shopping
          </Link>
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-10 rounded-xl border border-gray-200 bg-white px-6 py-16 text-center text-lg font-bold text-gray-500">
          Loading wishlist...
        </div>
      ) : null}

      {!isLoading && wishlistCount > 0 ? (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wishlist.items.map((item) => (
            <WishlistProductCard key={item.productId._id} item={item} onRemove={handleRemove} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
