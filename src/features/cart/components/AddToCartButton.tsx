"use client";

import { ButtonHTMLAttributes, MouseEvent, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useAuth, useCart, useToast } from "@/contexts";
import { BackendCart } from "../api";

type AddToCartButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "disabled"> & {
  productId: string;
  quantity?: number;
  stock?: number;
  label?: string;
  successLabel?: string;
  loadingLabel?: string;
  outOfStockLabel?: string;
  showIcon?: boolean;
  stopPropagation?: boolean;
  disabled?: boolean;
  onAdded?: (cart: BackendCart) => void;
};

export function AddToCartButton({
  productId,
  quantity = 1,
  stock,
  label = "Add to Cart",
  successLabel = "Added",
  loadingLabel = "Adding...",
  outOfStockLabel = "Out of stock",
  showIcon = true,
  stopPropagation = false,
  disabled = false,
  onAdded,
  children,
  type = "button",
  ...buttonProps
}: AddToCartButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const isOutOfStock = stock !== undefined && stock <= 0;
  const isDisabled = disabled || isAuthLoading || isOutOfStock || status === "loading";
  const buttonLabel = isOutOfStock
    ? outOfStockLabel
    : status === "loading"
      ? loadingLabel
      : status === "success"
        ? successLabel
        : status === "error"
          ? "Try again"
          : label;

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      event.stopPropagation();
    }

    if (isDisabled) return;

    if (!isAuthenticated) {
      const redirect = typeof window !== "undefined" ? `${pathname}${window.location.search}` : pathname;
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    setStatus("loading");

    try {
      const cart = await addToCart(productId, quantity);
      setStatus("success");
      toast.success("Added to cart");
      onAdded?.(cart);
      window.setTimeout(() => setStatus("idle"), 1400);
    } catch (err) {
      setStatus("error");
      toast.error(err instanceof Error ? err.message : "Could not add to cart");
    }
  };

  const { className: passedClassName, ...restButtonProps } = buttonProps;
  const mergedClassName = [
    "cart-button",
    status === "success" ? "added" : "",
    passedClassName || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...restButtonProps}
      className={mergedClassName}
      type={type}
      disabled={isDisabled}
      onClick={handleClick}
      aria-live="polite"
    >
      {children || (
        <>
          {showIcon ? <ShoppingCart className="h-4 w-4" aria-hidden="true" /> : null}
          <span>{buttonLabel}</span>
        </>
      )}
    </button>
  );
}
