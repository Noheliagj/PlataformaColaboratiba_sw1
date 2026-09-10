import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

/** Diálogo modal centrado con overlay y cierre por Escape / clic exterior. */
export function Modal({
  open,
  title,
  description,
  onClose,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/75 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="animate-fade-rise w-full max-w-md overflow-hidden rounded-xl border border-hairline-strong bg-surface shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-ink">{title}</h2>
            {description && (
              <p className="text-[12px] text-ink-muted">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 shrink-0 rounded-md p-1 text-ink-muted transition-colors hover:bg-raised hover:text-ink"
            aria-label="Cerrar"
          >
            <X size={17} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
