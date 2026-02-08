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
  default: 'bg-surface-800 border border-surface-700',
  elevated: 'bg-surface-800 border border-surface-700 shadow-xl shadow-black/20',
  outlined: 'bg-transparent border border-surface-600',
  glass: 'bg-surface-800/50 backdrop-blur-xl border border-surface-700/50',
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
        rounded-xl transition-all duration-200
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${hover ? 'hover:border-surface-500 hover:shadow-lg hover:shadow-black/10 hover:-translate-y-0.5 cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
