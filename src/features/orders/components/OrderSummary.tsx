import Link from "next/link";
import { BackendCart, calculateCartTotals } from "@/features/cart";

export type OrderSummaryLineItem = {
  id: string;
  name: string;
  quantity?: number;
  amount: number;
};

export type OrderSummaryTotals = {
  subtotal: number;
  discount: number;
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
  action?: OrderSummaryAction;
  className?: string;
  description?: string;
  descriptionClassName?: string;
  showItems?: boolean;
  totalLabel?: string;
  emptyMessage?: string;
  formatMoney?: (value: number) => string;
};

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
        shipping: totals.shipping,
        tax: totals.tax,
        total: totals.grandTotal,
      }}
    />
  );
}
