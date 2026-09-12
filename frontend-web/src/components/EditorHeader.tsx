import { ArrowLeft, History, Loader2, Save, Users } from 'lucide-react';
import type { ProjectRole } from '../services/projects';
import type { PresenceUser } from '../services/socket';
import { Button } from './ui/Button';

export interface StatusMeta {
  dot: string;
  label: string;
  spin: boolean;
}

interface EditorHeaderProps {
  projectName: string;
  role: ProjectRole | null;
  statusMeta: StatusMeta;
  remoteEditor: string | null;
  presence: PresenceUser[];
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
  onOpenHistory: () => void;
}

/** Hash simple y determinístico: mismo usuario -> mismo color de avatar. */
function colorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return `hsl(${hash % 360}, 65%, 45%)`;
}

function initialsFor(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  );
}

const MAX_VISIBLE_AVATARS = 4;

/** RF10: avatares/iniciales de quién tiene el proyecto abierto ahora mismo. */
function PresenceAvatars({ users }: { users: PresenceUser[] }) {
  if (users.length === 0) return null;

  const visible = users.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = users.length - visible.length;

  return (
    <div
      className="flex items-center -space-x-2"
      title={users.map((u) => u.userName).join(', ')}
    >
      {visible.map((user) => (
        <span
          key={user.userId}
          className="grid h-6 w-6 place-items-center rounded-full border-2 border-surface text-[10px] font-semibold text-white shadow-sm"
          style={{ backgroundColor: colorForUser(user.userId) }}
          title={user.userName}
        >
          {initialsFor(user.userName)}
        </span>
      ))}
      {overflow > 0 && (
        <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-surface bg-raised text-[10px] font-semibold text-ink-soft">
          +{overflow}
        </span>
      )}
    </div>
  );
}

/**
 * RF9/RF10 - Barra superior del editor: solo lo esencial (volver, presencia,
 * historial, guardar). El resto de acciones (modelado, XMI, Vision, asistente
 * de IA, tema) vive en EditorToolsPanel para no saturar esta barra.
 */
export function EditorHeader({
  projectName,
  role,
  statusMeta,
  remoteEditor,
  presence,
  saving,
  onBack,
  onSave,
  onOpenHistory,
}: EditorHeaderProps) {
  return (
    <header className="z-20 flex items-center justify-between gap-4 border-b border-hairline bg-surface/90 px-3 py-2 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-hairline-strong bg-raised px-2.5 py-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:bg-overlay hover:text-ink"
        >
          <ArrowLeft size={14} /> Proyectos
        </button>

        <span className="h-5 w-px bg-hairline-strong" />

        <div className="flex min-w-0 items-center gap-2.5">
          <h1 className="truncate text-[13px] font-semibold text-ink">
            {projectName || 'Editor UML'}
          </h1>
          <span className="hidden items-center gap-1.5 rounded-full border border-hairline bg-raised px-2 py-0.5 text-[11px] text-ink-muted sm:inline-flex">
            {statusMeta.spin ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
            )}
            {statusMeta.label}
          </span>
          {role === 'COLLABORATOR' && (
            <span className="hidden items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-hi sm:inline-flex">
              <Users size={11} />
              Colaborador
            </span>
          )}
        </div>
      </div>

      {remoteEditor && (
        <span className="animate-fade-rise hidden items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent-hi md:inline-flex">
          <Users size={12} />
          {remoteEditor} está editando…
        </span>
      )}

      <div className="flex shrink-0 items-center gap-2">
        <PresenceAvatars users={presence} />

        <button
          type="button"
          onClick={onOpenHistory}
          title="Historial de cambios"
          className="inline-flex items-center gap-1.5 rounded-lg border border-hairline-strong bg-raised px-2.5 py-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:bg-overlay hover:text-ink"
        >
          <History size={14} />
          <span className="hidden lg:inline">Historial</span>
        </button>

        <Button
          size="sm"
          onClick={onSave}
          loading={saving}
          icon={!saving && <Save size={15} />}
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </header>
  );
}
