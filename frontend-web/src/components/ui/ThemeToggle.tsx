import { Moon, Sun } from 'lucide-react';
import type { Theme } from '../../lib/theme';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
  className?: string;
}

/** Switch Dark/Light: mismo lenguaje visual (hairline + raised) en ambos temas. */
export function ThemeToggle({ theme, onToggle, className = '' }: ThemeToggleProps) {
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={onToggle}
      title={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      aria-label="Cambiar tema"
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-hairline-strong bg-raised text-ink-soft transition-colors hover:bg-overlay hover:text-ink ${className}`}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
