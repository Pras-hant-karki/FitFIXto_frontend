"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/contexts";
import { getCartLineTotal } from "@/features/cart";
import { CartOrderSummary } from "@/features/orders";
import { formatCategory, getProductImage } from "@/features/products";
import { DiscountData, fetchPublicDiscounts } from "@/features/discounts";

const formatMoney = (value: number) => `Npr ${Math.round(value).toLocaleString()}`;
const formatSummaryMoney = (value: number) =>
  `Npr ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CartPage() {
  const { cart, cartCount, isCartLoading, cartError, refreshCart, updateQuantity, removeFromCart } = useCart();
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [updatingProductId, setUpdatingProductId] = useState("");
  const [actionError, setActionError] = useState("");
  const [discounts, setDiscounts] = useState<DiscountData | null>(null);

  useEffect(() => {
    fetchPublicDiscounts().then(setDiscounts).catch(() => {});
  }, []);

  useEffect(() => {
    setSelectedProductIds((current) => {
      const cartProductIds = cart.items.map((item) => item.productId._id);
      const retainedIds = current.filter((id) => cartProductIds.includes(id));
      const missingIds = cartProductIds.filter((id) => !current.includes(id));

      return [...retainedIds, ...missingIds];
    });
  }, [cart.items]);

  const selectedItems = useMemo(
    () => cart.items.filter((item) => selectedProductIds.includes(item.productId._id)),
    [cart.items, selectedProductIds]
  );
  const selectedCount = selectedItems.reduce((total, item) => total + item.quantity, 0);
  const checkoutHref = selectedProductIds.length
    ? `/checkout?items=${encodeURIComponent(selectedProductIds.join(","))}`
    : "/checkout";

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]
    );
  };

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
    <main className="cart-page">
      <header className="cart-page-header">
        <h1>Your Cart</h1>
        <p>
          {isCartLoading
            ? "Loading items..."
            : `${cartCount} ${cartCount === 1 ? "item" : "items"}`}
        </p>
      </header>

      {isCartLoading ? (
        <section className="cart-state-card">
          <strong>Loading cart...</strong>
          <span>Please wait while we fetch your selected products.</span>
        </section>
      ) : cartError ? (
        <section className="cart-state-card">
          <strong>Unable to load cart.</strong>
          <span>{cartError}</span>
          <button type="button" onClick={() => refreshCart()}>
            Try Again
          </button>
        </section>
      ) : cart.items.length === 0 ? (
        <section className="cart-state-card">
          <strong>Your cart is empty.</strong>
          <span>Add products from the shop to see them here.</span>
          <Link href="/shop">Continue Shopping</Link>
        </section>
      ) : (
        <div className="cart-layout">
          <section className="cart-items-list" aria-label="Cart items">
            {actionError ? <p className="cart-action-error">{actionError}</p> : null}
            {cart.items.map((item) => {
              const productImage = getProductImage(item.productId);
              const isUpdating = updatingProductId === item.productId._id;

              return (
                <article className="cart-item-card" key={item.productId._id}>
                  <label className="cart-select-item" aria-label={`Select ${item.productId.name} for checkout`}>
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(item.productId._id)}
                      onChange={() => toggleProductSelection(item.productId._id)}
                    />
                  </label>
                  <Link href={`/products/${item.productId._id}`} className="cart-item-image">
                    {productImage ? (
                      <img src={productImage} alt={item.productId.name} />
                    ) : (
                      <span>No image</span>
                    )}
                  </Link>

                  <div className="cart-item-main">
                    <p>{formatCategory(item.productId.category)}</p>
                    <Link href={`/products/${item.productId._id}`}>{item.productId.name}</Link>
                    <div className="cart-item-actions">
                      <div className="cart-quantity-controls" aria-label={`Quantity controls for ${item.productId.name}`}>
                        <button
                          type="button"
                          disabled={isUpdating}
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
                          disabled={isUpdating || item.quantity >= item.productId.stock}
                          onClick={() =>
                            runCartAction(item.productId._id, () => updateQuantity(item.productId._id, item.quantity + 1))
                          }
                          aria-label={`Increase ${item.productId.name} quantity`}
                        >
                          <Plus aria-hidden="true" />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="cart-remove-button"
                        disabled={isUpdating}
                        onClick={() => runCartAction(item.productId._id, () => removeFromCart(item.productId._id))}
                      >
                        <Trash2 aria-hidden="true" />
                        Remove
                      </button>
                    </div>
                  </div>

                  <strong className="cart-item-price">{formatMoney(getCartLineTotal(item))}</strong>
                </article>
              );
            })}
          </section>

          <CartOrderSummary
            action={{
              label: selectedItems.length > 0 ? "Proceed to Checkout" : "Select items to checkout",
              href: checkoutHref,
              disabled: selectedItems.length === 0,
            }}
            cart={cart}
            className="cart-summary"
            description={`${selectedCount} selected ${selectedCount === 1 ? "item" : "items"}`}
            descriptionClassName="cart-selected-count"
            formatMoney={formatSummaryMoney}
            selectedProductIds={selectedProductIds}
            showItems={false}
            totalLabel="Grand Total"
            publicDiscounts={discounts}
          />
        </div>
      )}
    </main>
  );
}
