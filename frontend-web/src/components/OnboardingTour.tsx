import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  Check,
  LayoutGrid,
  UsersRound,
  X,
} from 'lucide-react';
import { Button } from './ui/Button';

interface Step {
  icon: ReactNode;
  title: string;
  body: ReactNode;
}

const STEPS: Step[] = [
  {
    icon: <LayoutGrid size={20} />,
    title: 'Bienvenido a UML Studio',
    body: (
      <>
        Aquí modelas diagramas de clases UML de forma visual: arrastra
        clases al lienzo, define sus atributos y métodos, y conéctalas con
        relaciones. Cuando tu diagrama esté listo, expórtalo como proyecto
        Spring Boot con un clic desde el editor.
      </>
    ),
  },
  {
    icon: <UsersRound size={20} />,
    title: 'Trabaja en equipo',
    body: (
      <>
        Cada proyecto tiene un código y contraseña de invitación (
        <strong className="text-ink">Nuevo proyecto → Invitar</strong>).
        Compártelos con tus compañeros: desde el dashboard, con{' '}
        <strong className="text-ink">Unirme a cooperativo</strong>, entran
        como colaboradores y ven el mismo diagrama.
      </>
    ),
  },
  {
    icon: <BellRing size={20} />,
    title: 'Cambios y notificaciones en vivo',
    body: (
      <>
        Dentro del editor, los cambios de todos se sincronizan al instante y
        hay un chat de equipo integrado. Si eres el dueño del proyecto, además
        recibirás una notificación en cuanto un colaborador se una o guarde
        cambios en el diagrama, aunque no tengas la pestaña abierta.
      </>
    ),
  },
];

interface OnboardingTourProps {
  open: boolean;
  onClose: () => void;
  onFinish: () => void;
}

/**
 * Guía guiada para usuarios nuevos: 3 pasos fijos, navegación
 * anterior/siguiente y progreso "Paso X de N". Solo "Terminar tutorial" (o
 * "Saltar") persiste en localStorage que ya se vio, vía onFinish -- ver
 * lib/onboarding.ts y HomePage, que es quien controla open/onClose/onFinish
 * (igual que el resto de modales de esta página).
 */
export function OnboardingTour({
  open,
  onClose,
  onFinish,
}: OnboardingTourProps) {
  const [stepIndex, setStepIndex] = useState(0);

  // Siempre arranca en el paso 1 cada vez que se abre (incluido "Ver tutorial" de nuevo).
  useEffect(() => {
    if (open) setStepIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const isFirst = stepIndex === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/75 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="animate-fade-rise w-full max-w-md overflow-hidden rounded-xl border border-hairline-strong bg-surface shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Tutorial de bienvenida"
      >
        <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-hairline-strong bg-raised text-accent-hi">
              {step.icon}
            </span>
            <div>
              <p className="text-[11px] font-medium tracking-wide text-ink-muted uppercase">
                Paso {stepIndex + 1} de {STEPS.length}
              </p>
              <h2 className="text-sm font-semibold text-ink">{step.title}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 shrink-0 rounded-md p-1 text-ink-muted transition-colors hover:bg-raised hover:text-ink"
            aria-label="Saltar tutorial"
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-5">
          <p className="text-[13px] leading-relaxed text-ink-soft">
            {step.body}
          </p>

          {/* Indicador de progreso: un segmento por paso. */}
          <div className="mt-5 flex gap-1.5" aria-hidden="true">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= stepIndex ? 'bg-accent' : 'bg-raised'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-hairline px-5 py-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Saltar tutorial
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStepIndex((i) => i - 1)}
              disabled={isFirst}
              icon={<ArrowLeft size={14} />}
            >
              Anterior
            </Button>
            {isLast ? (
              <Button size="sm" onClick={onFinish} icon={<Check size={14} />}>
                Terminar tutorial
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStepIndex((i) => i + 1)}>
                Siguiente
                <ArrowRight size={14} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
