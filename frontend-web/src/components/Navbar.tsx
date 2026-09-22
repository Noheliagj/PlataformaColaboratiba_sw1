import { HelpCircle, LogOut } from 'lucide-react';
import { Brand } from './ui/Brand';
import { Button } from './ui/Button';
import { ThemeToggle } from './ui/ThemeToggle';
import { useTheme } from '../lib/useTheme';
import type { AuthUser } from '../services/auth';

interface NavbarProps {
  user: AuthUser;
  onLogout: () => void;
  onReplayTour?: () => void;
}

/** Barra superior del dashboard: marca, identidad del usuario y salida. */
export function Navbar({ user, onLogout, onReplayTour }: NavbarProps) {
  const [theme, toggleTheme] = useTheme();
  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Brand showTagline={false} />

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2.5 rounded-lg border border-hairline bg-surface py-1.5 pr-3.5 pl-1.5 sm:flex">
            <span className="grid h-7 w-7 place-items-center rounded-md border border-hairline-strong bg-raised text-[11px] font-semibold text-accent-hi">
              {initials || 'U'}
            </span>
            <span className="leading-tight">
              <span className="block text-[12px] font-medium text-ink">
                {user.name}
              </span>
              <span className="block text-[11px] text-ink-muted">
                {user.email}
              </span>
            </span>
          </div>

          {onReplayTour && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReplayTour}
              icon={<HelpCircle size={16} />}
              aria-label="Ver tutorial"
              title="Ver tutorial"
            />
          )}

          <ThemeToggle theme={theme} onToggle={toggleTheme} />

          <Button
            variant="secondary"
            size="sm"
            onClick={onLogout}
            icon={<LogOut size={14} />}
          >
            <span className="hidden sm:inline">Cerrar sesión</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
