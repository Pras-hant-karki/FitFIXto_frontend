'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
}

export const Card = ({ children, className = '', href, onClick }: CardProps) => {
  const baseStyles = 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg p-6 transition-all duration-300 hover:shadow-lg';

  const content = <div className={`${baseStyles} ${className}`}>{children}</div>;

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left cursor-pointer">
        {content}
      </button>
    );
  }

  return content;
};
