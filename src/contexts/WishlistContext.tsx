"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  addWishlistItem,
  BackendWishlist,
  fetchWishlist,
  removeWishlistItem,
} from "@/features/wishlist";

type WishlistContextValue = {
  wishlist: BackendWishlist;
  wishlistCount: number;
  wishlistProductIds: Set<string>;
  isWishlistLoading: boolean;
  refreshWishlist: () => Promise<BackendWishlist>;
  toggleWishlistItem: (productId: string) => Promise<BackendWishlist>;
  removeFromWishlist: (productId: string) => Promise<BackendWishlist>;
};

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

const emptyWishlist: BackendWishlist = { items: [] };

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState<BackendWishlist>(emptyWishlist);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlist(emptyWishlist);
      return emptyWishlist;
    }

    setIsWishlistLoading(true);

    try {
      const nextWishlist = await fetchWishlist();
      setWishlist(nextWishlist);
      return nextWishlist;
    } finally {
      setIsWishlistLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshWishlist().catch(() => setWishlist(emptyWishlist));
  }, [refreshWishlist]);

  const wishlistProductIds = useMemo(
    () => new Set(wishlist.items.map((item) => item.productId?._id).filter(Boolean)),
    [wishlist.items]
  );

  const toggleWishlistItem = useCallback(
    async (productId: string) => {
      const nextWishlist = wishlistProductIds.has(productId)
        ? await removeWishlistItem(productId)
        : await addWishlistItem(productId);

      setWishlist(nextWishlist);
      return nextWishlist;
    },
    [wishlistProductIds]
  );

  const removeFromWishlist = useCallback(async (productId: string) => {
    const nextWishlist = await removeWishlistItem(productId);
    setWishlist(nextWishlist);
    return nextWishlist;
  }, []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      wishlist,
      wishlistCount: wishlist.items.length,
      wishlistProductIds,
      isWishlistLoading,
      refreshWishlist,
      toggleWishlistItem,
      removeFromWishlist,
    }),
    [isWishlistLoading, refreshWishlist, removeFromWishlist, toggleWishlistItem, wishlist, wishlistProductIds]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }

  return context;
}
