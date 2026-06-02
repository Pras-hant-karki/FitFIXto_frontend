'use client';

import { ReactNode } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  isLoading?: boolean;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled = false,
  children,
  ...props
}: ButtonProps) => {
  const baseStyles = 'font-bold rounded transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-red-900 text-white hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-700',
    secondary: 'bg-white text-black dark:bg-zinc-800 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-600',
    outline: 'border-2 border-black dark:border-white text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {isLoading && <span className="animate-spin">⏳</span>}
      {children}
    </button>
  );
};
