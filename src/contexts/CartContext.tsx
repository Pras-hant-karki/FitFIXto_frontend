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
const CART_STORAGE_PREFIX = "fitfixto.cart";
const CartContext = createContext<CartContextValue | undefined>(undefined);

const getCartStorageKey = (userId?: string | null) => `${CART_STORAGE_PREFIX}.${userId || "guest"}`;

const readStoredCart = (userId?: string | null): BackendCart => {
  if (typeof window === "undefined") return emptyCart;

  try {
    const stored = window.localStorage.getItem(getCartStorageKey(userId));
    if (!stored) return emptyCart;

    const parsed = JSON.parse(stored) as BackendCart;
    return Array.isArray(parsed.items) ? parsed : emptyCart;
  } catch {
    return emptyCart;
  }
};

const writeStoredCart = (cart: BackendCart, userId?: string | null) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getCartStorageKey(userId), JSON.stringify(cart));
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading, user, role } = useAuth();
  const [cart, setCart] = useState<BackendCart>(emptyCart);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [cartError, setCartError] = useState("");
  const userId = user?.id ?? null;
  // Customers and trainers both shop, so both own a server-side cart. Admins work only inside
  // the console and never have one, so their session skips the cart API entirely.
  const ownsCart = isAuthenticated && role !== "admin";

  const refreshCart = useCallback(async () => {
    if (isAuthLoading) {
      return readStoredCart(ownsCart ? userId : null);
    }

    if (!ownsCart) {
      const storedCart = readStoredCart(null);
      setCart(storedCart);
      setCartError("");
      return storedCart;
    }

    const storedCart = readStoredCart(userId);
    if (storedCart.items.length > 0) {
      setCart(storedCart);
    }

    setIsCartLoading(true);
    setCartError("");

    try {
      const nextCart = await fetchCart();
      setCart(nextCart);
      writeStoredCart(nextCart, userId);
      return nextCart;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load cart.";
      setCartError(message);
      throw err;
    } finally {
      setIsCartLoading(false);
    }
  }, [ownsCart, isAuthLoading, userId]);

  useEffect(() => {
    if (isAuthLoading) return;
    setCart(readStoredCart(ownsCart ? userId : null));
    refreshCart().catch(() => undefined);
  }, [refreshCart]);

  const addToCart = useCallback(async (productId: string, quantity = 1) => {
    const nextCart = await addCartItem(productId, quantity);
    setCart(nextCart);
    writeStoredCart(nextCart, userId);
    return nextCart;
  }, [userId]);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    const nextCart = await updateCartItemQuantity(productId, quantity);
    setCart(nextCart);
    writeStoredCart(nextCart, userId);
    return nextCart;
  }, [userId]);

  const removeFromCart = useCallback(async (productId: string) => {
    const nextCart = await removeCartItem(productId);
    setCart(nextCart);
    writeStoredCart(nextCart, userId);
    return nextCart;
  }, [userId]);

  const clearUserCart = useCallback(async () => {
    const nextCart = await clearCart();
    setCart(nextCart);
    writeStoredCart(nextCart, userId);
    return nextCart;
  }, [userId]);

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
