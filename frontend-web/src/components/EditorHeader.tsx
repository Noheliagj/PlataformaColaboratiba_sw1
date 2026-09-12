import { useRef } from 'react';
import {
  ArrowLeft,
  Download,
  FileDown,
  FileUp,
  History,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Users,
} from 'lucide-react';
import type { ProjectRole } from '../services/projects';
import type { PresenceUser } from '../services/socket';
import { Button } from './ui/Button';
import { ThemeToggle } from './ui/ThemeToggle';
import type { Theme } from '../lib/theme';

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
  exporting: boolean;
  saving: boolean;
  importingImage: boolean;
  importingXmi: boolean;
  exportingXmi: boolean;
  theme: Theme;
  onToggleTheme: () => void;
  onBack: () => void;
  onAddClass: () => void;
  onExportSpring: () => void;
  onSave: () => void;
  onOpenHistory: () => void;
  onToggleAssistant: () => void;
  onImportImage: (file: File) => void;
  onExportXmi: () => void;
  onImportXmi: (file: File) => void;
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

/** RF9/RF10 - Barra superior del editor: navegación, estado, colaboración en vivo y acciones. */
export function EditorHeader({
  projectName,
  role,
  statusMeta,
  remoteEditor,
  presence,
  exporting,
  saving,
  importingImage,
  importingXmi,
  exportingXmi,
  theme,
  onToggleTheme,
  onBack,
  onAddClass,
  onExportSpring,
  onSave,
  onOpenHistory,
  onToggleAssistant,
  onImportImage,
  onExportXmi,
  onImportXmi,
}: EditorHeaderProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const xmiInputRef = useRef<HTMLInputElement>(null);

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

        <ThemeToggle theme={theme} onToggle={onToggleTheme} />

        <div className="flex items-center rounded-lg border border-hairline-strong bg-raised p-0.5">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportImage(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={importingImage}
            title="Importar diagrama desde una imagen (IA / Vision)"
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:bg-overlay hover:text-ink disabled:opacity-55"
          >
            {importingImage ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <ImagePlus size={15} />
            )}
            <span className="hidden xl:inline">
              {importingImage ? 'Analizando…' : 'Importar imagen'}
            </span>
          </button>
          <span className="mx-0.5 h-4 w-px bg-hairline-strong" />
          <input
            ref={xmiInputRef}
            type="file"
            accept=".xmi,.xml,text/xml,application/xml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportXmi(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => xmiInputRef.current?.click()}
            disabled={importingXmi}
            title="Importar XMI 2.1 (Enterprise Architect u otra herramienta UML)"
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:bg-overlay hover:text-ink disabled:opacity-55"
          >
            {importingXmi ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <FileUp size={15} />
            )}
            <span className="hidden xl:inline">
              {importingXmi ? 'Importando…' : 'Importar XMI'}
            </span>
          </button>
          <span className="mx-0.5 h-4 w-px bg-hairline-strong" />
          <button
            type="button"
            onClick={onExportXmi}
            disabled={exportingXmi}
            title="Exportar el diagrama a XMI 2.1"
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:bg-overlay hover:text-ink disabled:opacity-55"
          >
            {exportingXmi ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <FileDown size={15} />
            )}
            <span className="hidden xl:inline">
              {exportingXmi ? 'Exportando…' : 'Exportar XMI'}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenHistory}
          title="Historial de cambios"
          className="inline-flex items-center gap-1.5 rounded-lg border border-hairline-strong bg-raised px-2.5 py-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:bg-overlay hover:text-ink"
        >
          <History size={14} />
          <span className="hidden lg:inline">Historial</span>
        </button>

        <button
          type="button"
          onClick={onToggleAssistant}
          title="Asistente de IA"
          className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent-soft px-2.5 py-1.5 text-[12px] font-medium text-accent-hi transition-colors hover:border-accent/60"
        >
          <Sparkles size={14} />
          <span className="hidden lg:inline">Asistente IA</span>
        </button>

        <div className="flex items-center rounded-lg border border-hairline-strong bg-raised p-0.5">
          <button
            type="button"
            onClick={onAddClass}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:bg-overlay hover:text-ink"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Agregar clase</span>
          </button>
          <span className="mx-0.5 h-4 w-px bg-hairline-strong" />
          <button
            type="button"
            onClick={onExportSpring}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:bg-overlay hover:text-ink disabled:opacity-55"
          >
            {exporting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Download size={15} />
            )}
            <span className="hidden md:inline">
              {exporting ? 'Generando…' : 'Exportar Spring Boot'}
            </span>
            <span className="md:hidden">Spring</span>
          </button>
        </div>

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
