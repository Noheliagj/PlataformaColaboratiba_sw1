import { LogOut } from 'lucide-react';
import { Brand } from './ui/Brand';
import { Button } from './ui/Button';
import type { AuthUser } from '../services/auth';

interface NavbarProps {
  user: AuthUser;
  onLogout: () => void;
}

/** Barra superior del dashboard: marca, perfil de usuario y cierre de sesión. */
export function Navbar({ user, onLogout }: NavbarProps) {
  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Brand />

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 rounded-full border border-slate-800 bg-slate-900/70 py-1.5 pr-4 pl-1.5 sm:flex">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white">
              {initials || 'U'}
            </span>
            <span className="leading-tight">
              <span className="block text-xs font-medium text-slate-100">
                {user.name}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Sesión activa
              </span>
            </span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={onLogout}
            icon={<LogOut size={14} />}
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    </header>
  );
}
