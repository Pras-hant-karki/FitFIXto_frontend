"use client";

import { useEffect, useState } from "react";
import { RouteShell } from "@/components/shared";
import { BackendCart, fetchCart, getCartLineTotal, getCartSubtotal } from "@/features/cart";
import { getProductImage } from "@/features/products";

export default function CartPage() {
  const [cart, setCart] = useState<BackendCart>({ items: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCart = async () => {
      setIsLoading(true);
      setError("");

      try {
        const nextCart = await fetchCart();
        setCart(nextCart);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load cart.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, []);

  const subtotal = getCartSubtotal(cart);

  return (
    <RouteShell
      eyebrow="Shopping"
      title="Cart"
      description="Review selected equipment and services before checkout."
      actionHref={cart.items.length > 0 ? "/checkout" : "/shop"}
      actionLabel={cart.items.length > 0 ? "Continue to Checkout" : "Continue Shopping"}
    >
      {isLoading ? (
        <div className="empty-state">
          <strong>Loading cart...</strong>
          <span>Please wait while we fetch your selected products.</span>
        </div>
      ) : error ? (
        <div className="empty-state">
          <strong>Unable to load cart.</strong>
          <span>{error}</span>
        </div>
      ) : cart.items.length === 0 ? (
        <div className="empty-state">
          <strong>Your cart is empty.</strong>
          <span>Add products from the shop to see them here.</span>
        </div>
      ) : (
        <div className="connected-list">
          {cart.items.map((item) => (
            <article className="connected-list-item" key={item.productId._id}>
              {getProductImage(item.productId) ? (
                <img src={getProductImage(item.productId)} alt={item.productId.name} />
              ) : (
                <div className="connected-no-image">No image</div>
              )}
              <div>
                <strong>{item.productId.name}</strong>
                <span>
                  Qty {item.quantity} x ${item.priceAtAdded}
                </span>
              </div>
              <strong>${getCartLineTotal(item).toFixed(2)}</strong>
            </article>
          ))}
          <div className="connected-total">
            <span>Subtotal</span>
            <strong>${subtotal.toFixed(2)}</strong>
          </div>
        </div>
      )}
    </RouteShell>
  );
}
