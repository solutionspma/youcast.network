import type { ReactNode } from 'react';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass';

interface CardProps {
  variant?: CardVariant;
  className?: string;
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-surface-900 border border-surface-800',
  elevated: 'bg-surface-900 border border-surface-800 shadow-2xl shadow-black/30',
  outlined: 'bg-transparent border border-surface-700',
  glass: 'bg-surface-900/60 backdrop-blur-2xl border border-surface-800/50',
};

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({
  variant = 'default',
  className = '',
  children,
  padding = 'md',
  hover = false,
  onClick,
}: CardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={`
        rounded-2xl transition-all duration-300
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${hover ? 'hover:border-surface-600 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/20 cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
