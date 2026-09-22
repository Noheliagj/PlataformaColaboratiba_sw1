import { useEffect, useState } from 'react';
import { AlertCircle, Clock3, Save } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Spinner } from './ui/Spinner';
import { getProjectHistory } from '../services/projects';
import type { ProjectActivity } from '../services/projects';
import { getErrorMessage } from '../services/http-error';

const ACTION_LABELS: Record<string, string> = {
  SAVE_DIAGRAM: 'guardó el diagrama',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface HistoryPanelProps {
  open: boolean;
  projectId: string;
  onClose: () => void;
}

/** RF9 - Historial: quién guardó/modificó el diagrama y cuándo. */
export function HistoryPanel({ open, projectId, onClose }: HistoryPanelProps) {
  const [entries, setEntries] = useState<ProjectActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reinicia loading/error al abrir (o cambiar de proyecto) durante el
  // render, no en el efecto: evita el setState síncrono justo al entrar al
  // efecto y el render extra que provoca.
  const openKey = open ? projectId : null;
  const [lastOpenKey, setLastOpenKey] = useState(openKey);
  if (openKey !== lastOpenKey) {
    setLastOpenKey(openKey);
    if (openKey) {
      setLoading(true);
      setError(null);
    }
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    getProjectHistory(projectId)
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err, 'No se pudo cargar el historial'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  return (
    <Modal
      open={open}
      title="Historial de cambios"
      description="Quién guardó el diagrama y cuándo."
      onClose={onClose}
    >
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size={20} />
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-lg border border-critical/40 bg-critical-soft px-3 py-2.5 text-[13px] text-critical">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : entries.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-ink-muted">
          Todavía no hay guardados registrados.
        </p>
      ) : (
        <ul className="max-h-80 space-y-1 overflow-y-auto">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-start gap-2.5 rounded-lg px-2 py-2 text-[13px] text-ink-soft hover:bg-raised"
            >
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-hairline-strong bg-raised text-ink-muted">
                <Save size={12} />
              </span>
              <div className="min-w-0">
                <p className="truncate">
                  <span className="font-medium text-ink">{entry.user.name}</span>{' '}
                  {ACTION_LABELS[entry.action] ?? entry.action}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-faint">
                  <Clock3 size={11} />
                  {formatDateTime(entry.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
