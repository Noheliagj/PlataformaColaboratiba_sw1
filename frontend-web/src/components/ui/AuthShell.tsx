import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Brand } from './Brand';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../../lib/useTheme';

const HIGHLIGHTS = [
  'Diagramas de clases colaborativos en tiempo real',
  'Modelo de base de datos derivado automáticamente',
  'Generación de backend Spring Boot en un clic',
];

/**
 * Marco compartido de las pantallas de acceso: panel de marca a la
 * izquierda (solo escritorio) y contenido del formulario a la derecha.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  const [theme, toggleTheme] = useTheme();

  return (
    <div className="relative grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <ThemeToggle
        theme={theme}
        onToggle={toggleTheme}
        className="absolute top-5 right-5 z-10"
      />
      {/* Panel de marca */}
      <aside className="bg-halo relative hidden flex-col justify-between overflow-hidden border-r border-hairline bg-sunken p-12 lg:flex">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative">
          <Link to="/" className="inline-block">
            <Brand size="lg" />
          </Link>
        </div>

        <div className="relative max-w-md space-y-8">
          <h2 className="text-[26px] leading-tight font-semibold text-ink">
            Del diagrama al backend, sin fricción.
          </h2>
          <ul className="space-y-3.5">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-ink-soft">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border border-hairline-strong bg-raised text-accent-hi">
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    className="h-3 w-3"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 8.5 6.5 12 13 4.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[12px] text-ink-faint">
          Plataforma académica de ingeniería de software · 2026
        </p>
      </aside>

      {/* Panel del formulario */}
      <main className="relative flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 lg:hidden" />
        <div className="animate-fade-rise relative w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden">
            <Brand size="lg" />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
