import { BackendCart, BackendCartItem } from "./api";

export const CART_TAX_RATE = 0.02;
export const DEFAULT_SHIPPING_AMOUNT = 0;

const roundMoney = (value: number) => Math.round(value * 100) / 100;

export const getCartItemMrp = (item: BackendCartItem) => {
  const discount = item.productId.discountPercentage || 0;

  if (discount <= 0 || discount >= 100) {
    return item.priceAtAdded;
  }

  return roundMoney(item.priceAtAdded / (1 - discount / 100));
};

export const getCartItemMrpTotal = (item: BackendCartItem) =>
  roundMoney(getCartItemMrp(item) * item.quantity);

export const getCartItemDiscount = (item: BackendCartItem) =>
  roundMoney(Math.max(0, getCartItemMrp(item) - item.priceAtAdded) * item.quantity);

export const calculateCartTotals = (cart: BackendCart, shipping = DEFAULT_SHIPPING_AMOUNT) => {
  const subtotal = roundMoney(cart.items.reduce((sum, item) => sum + getCartItemMrpTotal(item), 0));
  const discount = roundMoney(cart.items.reduce((sum, item) => sum + getCartItemDiscount(item), 0));
  const tax = roundMoney(subtotal * CART_TAX_RATE);
  const grandTotal = roundMoney(Math.max(0, subtotal - discount) + shipping + tax);

  return {
    subtotal,
    discount,
    shipping: roundMoney(shipping),
    tax,
    grandTotal,
  };
};
