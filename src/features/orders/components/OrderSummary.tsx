import Link from "next/link";
import { BackendCart, BackendCartItem, calculateCartTotals } from "@/features/cart";
import { DiscountData, DiscountProduct } from "@/features/discounts";

export type OrderSummaryLineItem = {
  id: string;
  name: string;
  quantity?: number;
  amount: number;
};

export type OrderSummaryTotals = {
  subtotal: number;
  discount: number;
  promotionDiscount?: number;
  shipping: number;
  tax: number;
  total: number;
};

type OrderSummaryAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
};

type OrderSummaryProps = {
  items: OrderSummaryLineItem[];
  totals: OrderSummaryTotals;
  action?: OrderSummaryAction;
  className?: string;
  description?: string;
  descriptionClassName?: string;
  showItems?: boolean;
  totalLabel?: string;
  emptyMessage?: string;
  formatMoney?: (value: number) => string;
};

type CartOrderSummaryProps = {
  cart: BackendCart;
  selectedProductIds?: string[];
  shipping?: number;
  publicDiscounts?: DiscountData | null;
  action?: OrderSummaryAction;
  className?: string;
  description?: string;
  descriptionClassName?: string;
  showItems?: boolean;
  totalLabel?: string;
  emptyMessage?: string;
  formatMoney?: (value: number) => string;
};

const roundMoney = (v: number) => Math.round(v * 100) / 100;

function calcPromotionSavings(items: BackendCartItem[], discounts: DiscountData | null | undefined): number {
  if (!discounts) return 0;
  let savings = 0;

  const fs = discounts.flashSale;
  if (fs?.isActive) {
    const fsIds = (fs.productIds as Array<string | DiscountProduct>).map((p) => (typeof p === "string" ? p : p._id));
    const appliesToAll = fsIds.length === 0;
    const pct = fs.discountPercentage / 100;
    items.forEach((item) => {
      if (appliesToAll || fsIds.includes(item.productId._id)) {
        savings += item.priceAtAdded * item.quantity * pct;
      }
    });
  }

  if (discounts.bundles?.length) {
    const cartIds = new Set(items.map((i) => i.productId._id));
    discounts.bundles
      .filter((b) => b.isActive)
      .forEach((bundle) => {
        const bundleIds = bundle.productIds.map((p) => p._id);
        if (!bundleIds.every((id) => cartIds.has(id))) return;
        const bundleSubtotal = items
          .filter((item) => bundleIds.includes(item.productId._id))
          .reduce((sum, item) => sum + item.priceAtAdded * item.quantity, 0);
        savings += bundleSubtotal * (bundle.discountPercentage / 100);
      });
  }

  return roundMoney(savings);
}

const defaultFormatMoney = (value: number) =>
  `Npr ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function OrderSummary({
  items,
  totals,
  action,
  className = "",
  description,
  descriptionClassName,
  showItems = true,
  totalLabel = "Total",
  emptyMessage = "No items selected.",
  formatMoney = defaultFormatMoney,
}: OrderSummaryProps) {
  const rootClassName = ["order-summary", className].filter(Boolean).join(" ");
  const actionLabel = action?.isLoading ? "Please wait..." : action?.label;

  return (
    <aside className={rootClassName} aria-label="Order summary">
      <h2>Order Summary</h2>
      {description ? <p className={descriptionClassName || "order-summary-description"}>{description}</p> : null}

      {showItems ? (
        <div className="order-summary-items">
          {items.length === 0 ? (
            <p>{emptyMessage}</p>
          ) : (
            items.map((item) => (
              <div key={item.id}>
                <span>
                  {item.name}
                  {item.quantity ? ` x ${item.quantity}` : ""}
                </span>
                <strong>{formatMoney(item.amount)}</strong>
              </div>
            ))
          )}
        </div>
      ) : null}

      <div className="order-summary-lines">
        <div>
          <span>Subtotal</span>
          <strong>{formatMoney(totals.subtotal)}</strong>
        </div>
        <div>
          <span>Discount</span>
          <strong>{totals.discount > 0 ? `- ${formatMoney(totals.discount)}` : formatMoney(0)}</strong>
        </div>
        {totals.promotionDiscount && totals.promotionDiscount > 0 ? (
          <div>
            <span>Promotions</span>
            <strong>- {formatMoney(totals.promotionDiscount)}</strong>
          </div>
        ) : null}
        <div>
          <span>Shipping</span>
          <strong>{totals.shipping > 0 ? formatMoney(totals.shipping) : "FREE"}</strong>
        </div>
        <div>
          <span>Tax (2% MRP)</span>
          <strong>{formatMoney(totals.tax)}</strong>
        </div>
      </div>

      <div className="order-summary-total">
        <span>{totalLabel}</span>
        <strong>{formatMoney(totals.total)}</strong>
      </div>

      {action ? (
        action.href ? (
          <Link className="order-summary-action" href={action.disabled ? "#" : action.href} aria-disabled={action.disabled}>
            {actionLabel}
          </Link>
        ) : (
          <button className="order-summary-action" type="button" onClick={action.onClick} disabled={action.disabled || action.isLoading}>
            {actionLabel}
          </button>
        )
      ) : null}
    </aside>
  );
}

export function CartOrderSummary({
  cart,
  selectedProductIds = [],
  shipping = 0,
  publicDiscounts,
  action,
  className,
  description,
  descriptionClassName,
  showItems,
  totalLabel,
  emptyMessage,
  formatMoney = defaultFormatMoney,
}: CartOrderSummaryProps) {
  const selectedItems = selectedProductIds.length
    ? cart.items.filter((item) => selectedProductIds.includes(item.productId._id))
    : cart.items;
  const selectedCart = { ...cart, items: selectedItems };
  const totals = calculateCartTotals(selectedCart, shipping);
  const promotionDiscount = calcPromotionSavings(selectedItems, publicDiscounts);
  const summaryItems = selectedItems.map((item) => ({
    id: item.productId._id,
    name: item.productId.name,
    quantity: item.quantity,
    amount: item.priceAtAdded * item.quantity,
  }));

  return (
    <OrderSummary
      action={action}
      className={className}
      description={description}
      descriptionClassName={descriptionClassName}
      emptyMessage={emptyMessage}
      formatMoney={formatMoney}
      items={summaryItems}
      showItems={showItems}
      totalLabel={totalLabel}
      totals={{
        subtotal: totals.subtotal,
        discount: totals.discount,
        promotionDiscount: promotionDiscount > 0 ? promotionDiscount : undefined,
        shipping: totals.shipping,
        tax: totals.tax,
        total: roundMoney(Math.max(0, totals.grandTotal - promotionDiscount)),
      }}
    />
  );
}
