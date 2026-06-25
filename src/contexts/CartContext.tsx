"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  addCartItem,
  BackendCart,
  clearCart,
  fetchCart,
  removeCartItem,
  updateCartItemQuantity,
} from "@/features/cart/api";

type CartContextValue = {
  cart: BackendCart;
  cartCount: number;
  isCartLoading: boolean;
  cartError: string;
  refreshCart: () => Promise<BackendCart>;
  addToCart: (productId: string, quantity?: number) => Promise<BackendCart>;
  updateQuantity: (productId: string, quantity: number) => Promise<BackendCart>;
  removeFromCart: (productId: string) => Promise<BackendCart>;
  clearUserCart: () => Promise<BackendCart>;
};

const emptyCart: BackendCart = { items: [] };
const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<BackendCart>(emptyCart);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [cartError, setCartError] = useState("");

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(emptyCart);
      setCartError("");
      return emptyCart;
    }

    setIsCartLoading(true);
    setCartError("");

    try {
      const nextCart = await fetchCart();
      setCart(nextCart);
      return nextCart;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load cart.";
      setCartError(message);
      throw err;
    } finally {
      setIsCartLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart().catch(() => setCart(emptyCart));
  }, [refreshCart]);

  const addToCart = useCallback(async (productId: string, quantity = 1) => {
    const nextCart = await addCartItem(productId, quantity);
    setCart(nextCart);
    return nextCart;
  }, []);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    const nextCart = await updateCartItemQuantity(productId, quantity);
    setCart(nextCart);
    return nextCart;
  }, []);

  const removeFromCart = useCallback(async (productId: string) => {
    const nextCart = await removeCartItem(productId);
    setCart(nextCart);
    return nextCart;
  }, []);

  const clearUserCart = useCallback(async () => {
    const nextCart = await clearCart();
    setCart(nextCart);
    return nextCart;
  }, []);

  const cartCount = useMemo(
    () => cart.items.reduce((total, item) => total + item.quantity, 0),
    [cart.items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      cartCount,
      isCartLoading,
      cartError,
      refreshCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearUserCart,
    }),
    [addToCart, cart, cartCount, cartError, clearUserCart, isCartLoading, refreshCart, removeFromCart, updateQuantity]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
