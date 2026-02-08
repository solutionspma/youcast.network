'use client';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export default function Toggle({ checked, onChange, label, description, disabled, size = 'md' }: ToggleProps) {
  const dims = size === 'sm' ? { track: 'w-9 h-5', thumb: 'h-3.5 w-3.5', translate: 'translate-x-4' } : { track: 'w-11 h-6', thumb: 'h-4 w-4', translate: 'translate-x-5' };

  return (
    <label className={`flex items-center gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex shrink-0 ${dims.track} rounded-full transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-2 focus:ring-offset-surface-900
          ${checked ? 'bg-brand-600' : 'bg-surface-600'}
        `}
      >
        <span
          className={`
            inline-block ${dims.thumb} rounded-full bg-white shadow transform transition-transform duration-200
            ${checked ? dims.translate : 'translate-x-1'} mt-[3px]
          `}
        />
      </button>
      {(label || description) && (
        <div>
          {label && <span className="text-sm font-medium text-white">{label}</span>}
          {description && <p className="text-xs text-surface-400 mt-0.5">{description}</p>}
        </div>
      )}
    </label>
  );
}
