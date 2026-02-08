interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  status?: 'online' | 'offline' | 'live';
}

const sizeClasses = {
  xs: 'w-6 h-6 text-2xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-xl',
};

const statusClasses = {
  online: 'bg-emerald-500',
  offline: 'bg-surface-500',
  live: 'bg-red-500 animate-pulse-live',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({ src, alt, size = 'md', className = '', status }: AvatarProps) {
  return (
    <div className={`relative inline-flex ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`${sizeClasses[size]} rounded-full object-cover bg-surface-700`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-brand-600 flex items-center justify-center font-semibold text-white`}
        >
          {getInitials(alt)}
        </div>
      )}
      {status && (
        <span
          className={`absolute bottom-0 right-0 block w-3 h-3 rounded-full ring-2 ring-surface-900 ${statusClasses[status]}`}
        />
      )}
    </div>
  );
}
