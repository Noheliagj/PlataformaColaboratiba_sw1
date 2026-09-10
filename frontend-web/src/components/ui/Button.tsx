import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium leading-none ' +
  'whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/55 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-canvas disabled:opacity-55 disabled:pointer-events-none select-none ' +
  'active:translate-y-px';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-white shadow-sm hover:bg-accent-hi ' +
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]',
  secondary:
    'bg-raised text-ink-soft border border-hairline-strong hover:bg-overlay hover:text-ink',
  ghost: 'text-ink-muted hover:bg-raised hover:text-ink',
  danger:
    'bg-transparent text-critical border border-critical/40 hover:bg-critical-soft hover:border-critical/60',
};

const SIZES: Record<Size, string> = {
  sm: 'text-[13px] px-3 py-1.5',
  md: 'text-sm px-4 py-2.5',
};

/** Botón reutilizable con variantes, tamaños y estado de carga. */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner size={size === 'sm' ? 14 : 16} /> : icon}
      {children}
    </button>
  );
}
