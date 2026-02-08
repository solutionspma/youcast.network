import { type ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-500 hover:bg-brand-400 text-white active:bg-brand-600 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30',
  secondary:
    'bg-surface-800 hover:bg-surface-700 text-white border border-surface-700 hover:border-surface-600',
  ghost:
    'bg-transparent hover:bg-surface-800/50 text-surface-400 hover:text-white',
  danger:
    'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20',
  outline:
    'bg-transparent border border-surface-700 text-surface-300 hover:bg-surface-800/50 hover:text-white hover:border-surface-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-[13px] rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-2.5 text-sm rounded-xl',
  xl: 'px-7 py-3 text-base rounded-xl',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center justify-center gap-2 font-medium font-display
          transition-all duration-200 ease-out
          focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-2 focus:ring-offset-surface-950
          disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          leftIcon
        )}
        {children}
        {rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
