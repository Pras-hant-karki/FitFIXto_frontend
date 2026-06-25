"use client";

import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { RouteShell } from "@/components/shared";
import { useCart } from "@/contexts";
import { getCartLineTotal, getCartSubtotal } from "@/features/cart";
import { getProductImage } from "@/features/products";

const formatMoney = (value: number) => `Npr ${Math.round(value).toLocaleString()}`;

export default function CartPage() {
  const { cart, isCartLoading, cartError, refreshCart, updateQuantity, removeFromCart } = useCart();
  const [updatingProductId, setUpdatingProductId] = useState("");
  const [actionError, setActionError] = useState("");

  const subtotal = getCartSubtotal(cart);

  const runCartAction = async (productId: string, action: () => Promise<unknown>) => {
    setUpdatingProductId(productId);
    setActionError("");

    try {
      await action();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to update cart.");
    } finally {
      setUpdatingProductId("");
    }
  };

  return (
    <RouteShell
      eyebrow="Shopping"
      title="Cart"
      description="Review selected equipment and services before checkout."
      actionHref={cart.items.length > 0 ? "/checkout" : "/shop"}
      actionLabel={cart.items.length > 0 ? "Continue to Checkout" : "Continue Shopping"}
    >
      {isCartLoading ? (
        <div className="empty-state">
          <strong>Loading cart...</strong>
          <span>Please wait while we fetch your selected products.</span>
        </div>
      ) : cartError ? (
        <div className="empty-state">
          <strong>Unable to load cart.</strong>
          <span>{cartError}</span>
          <button type="button" onClick={() => refreshCart()}>
            Try Again
          </button>
        </div>
      ) : cart.items.length === 0 ? (
        <div className="empty-state">
          <strong>Your cart is empty.</strong>
          <span>Add products from the shop to see them here.</span>
        </div>
      ) : (
        <div className="connected-list">
          {actionError ? <p className="cart-action-error">{actionError}</p> : null}
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
                  {formatMoney(item.priceAtAdded)} each
                </span>
                <div className="cart-quantity-controls" aria-label={`Quantity controls for ${item.productId.name}`}>
                  <button
                    type="button"
                    disabled={updatingProductId === item.productId._id}
                    onClick={() =>
                      runCartAction(item.productId._id, () => updateQuantity(item.productId._id, item.quantity - 1))
                    }
                    aria-label={`Decrease ${item.productId.name} quantity`}
                  >
                    <Minus aria-hidden="true" />
                  </button>
                  <strong>{item.quantity}</strong>
                  <button
                    type="button"
                    disabled={updatingProductId === item.productId._id || item.quantity >= item.productId.stock}
                    onClick={() =>
                      runCartAction(item.productId._id, () => updateQuantity(item.productId._id, item.quantity + 1))
                    }
                    aria-label={`Increase ${item.productId.name} quantity`}
                  >
                    <Plus aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="cart-line-actions">
                <strong>{formatMoney(getCartLineTotal(item))}</strong>
                <button
                  type="button"
                  disabled={updatingProductId === item.productId._id}
                  onClick={() => runCartAction(item.productId._id, () => removeFromCart(item.productId._id))}
                >
                  <Trash2 aria-hidden="true" />
                  Remove
                </button>
              </div>
            </article>
          ))}
          <div className="connected-total">
            <span>Subtotal</span>
            <strong>{formatMoney(subtotal)}</strong>
          </div>
        </div>
      )}
    </RouteShell>
  );
}
