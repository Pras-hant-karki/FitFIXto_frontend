"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useReducer,
  useMemo,
} from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  action?: ToastAction;
  duration: number; // ms; 0 = persistent
}

export interface ToastOptions {
  description?: string;
  action?: ToastAction;
  /** Override auto-dismiss duration in ms. Pass 0 for persistent. */
  duration?: number;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 3000,
  info: 4000,
  warning: 5000,
  error: 5000,
};

const MAX_VISIBLE = 3;
const EXIT_DURATION = 240; // ms – must match CSS animation

// ─── Context ──────────────────────────────────────────────────────────────────

interface ToastContextValue {
  toasts: ToastItem[];
  exitingIds: Set<string>;
  dismiss: (id: string) => void;
  toast: {
    success: (title: string, options?: ToastOptions) => string;
    error: (title: string, options?: ToastOptions) => string;
    warning: (title: string, options?: ToastOptions) => string;
    info: (title: string, options?: ToastOptions) => string;
  };
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// ─── Reducer ──────────────────────────────────────────────────────────────────

type Action = { type: "ADD"; item: ToastItem } | { type: "REMOVE"; id: string };

function toastReducer(state: ToastItem[], action: Action): ToastItem[] {
  if (action.type === "ADD") {
    const next = [...state, action.item];
    return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
  }
  if (action.type === "REMOVE") return state.filter((t) => t.id !== action.id);
  return state;
}

let counter = 0;
const genId = () => `t${++counter}-${Date.now()}`;

// ─── Individual Toast Card ─────────────────────────────────────────────────────

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

interface ToastCardProps {
  toast: ToastItem;
  exiting: boolean;
  onDismiss: (id: string) => void;
}

function ToastCard({ toast, exiting, onDismiss }: ToastCardProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(0);
  const Icon = ICONS[toast.type];

  const handleDismiss = useCallback(() => onDismiss(toast.id), [onDismiss, toast.id]);

  // Auto-dismiss timer
  useEffect(() => {
    if (toast.duration === 0 || exiting) return;
    const id = setTimeout(handleDismiss, toast.duration);
    return () => clearTimeout(id);
  }, [handleDismiss, toast.duration, exiting]);

  // Keyboard support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") handleDismiss();
  };

  // Touch swipe-to-dismiss
  const handlePointerDown = (e: React.PointerEvent) => {
    startXRef.current = e.clientX;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const delta = e.clientX - startXRef.current;
    if (delta > 0) setSwipeX(delta);
  };
  const handlePointerUp = () => {
    setDragging(false);
    if (swipeX > 72) {
      handleDismiss();
    } else {
      setSwipeX(0);
    }
  };

  const swipeStyle =
    swipeX > 0
      ? {
          transform: `translateX(${swipeX}px)`,
          opacity: Math.max(0, 1 - swipeX / 180),
          transition: dragging ? "none" : undefined,
        }
      : undefined;

  return (
    <div
      className={`toast toast--${toast.type}${exiting ? " toast--out" : " toast--in"}${dragging ? " toast--drag" : ""}`}
      style={swipeStyle}
      role={toast.type === "error" ? "alert" : "status"}
      aria-atomic="true"
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      tabIndex={-1}
    >
      <span className="toast__icon" aria-hidden="true">
        <Icon size={17} />
      </span>
      <div className="toast__body">
        <p className="toast__title">{toast.title}</p>
        {toast.description && <p className="toast__desc">{toast.description}</p>}
        {toast.action && (
          <button
            type="button"
            className="toast__action-btn"
            onClick={() => {
              toast.action!.onClick();
              handleDismiss();
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        className="toast__close"
        aria-label="Dismiss notification"
        onClick={handleDismiss}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <X size={13} aria-hidden="true" />
      </button>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());

  const dismiss = useCallback((id: string) => {
    setExitingIds((prev) => new Set([...prev, id]));
    setTimeout(() => {
      dispatch({ type: "REMOVE", id });
      setExitingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, EXIT_DURATION);
  }, []);

  const add = useCallback(
    (type: ToastType, title: string, options?: ToastOptions): string => {
      const id = genId();
      const duration =
        options?.duration !== undefined ? options.duration : DEFAULT_DURATIONS[type];
      dispatch({
        type: "ADD",
        item: { id, type, title, description: options?.description, action: options?.action, duration },
      });
      return id;
    },
    []
  );

  const toast = useMemo(
    () => ({
      success: (title: string, o?: ToastOptions) => add("success", title, o),
      error: (title: string, o?: ToastOptions) => add("error", title, o),
      warning: (title: string, o?: ToastOptions) => add("warning", title, o),
      info: (title: string, o?: ToastOptions) => add("info", title, o),
    }),
    [add]
  );

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, exitingIds, dismiss, toast }),
    [toasts, exitingIds, dismiss, toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast container — always in DOM for aria-live regions */}
      <div
        className="toast-container"
        aria-label="Notifications"
        aria-relevant="additions"
      >
        {toasts.map((t) => (
          <ToastCard
            key={t.id}
            toast={t}
            exiting={exitingIds.has(t.id)}
            onDismiss={dismiss}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
