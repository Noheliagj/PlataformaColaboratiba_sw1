import { useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileDown,
  FileUp,
  ImagePlus,
  Loader2,
  MessageCircle,
  Moon,
  Plus,
  Sparkles,
  Sun,
} from 'lucide-react';
import type { Theme } from '../lib/theme';

interface EditorToolsPanelProps {
  expanded: boolean;
  onToggleExpanded: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  exporting: boolean;
  importingImage: boolean;
  importingXmi: boolean;
  exportingXmi: boolean;
  assistantOpen: boolean;
  chatOpen: boolean;
  onAddClass: () => void;
  onExportSpring: () => void;
  onToggleAssistant: () => void;
  onToggleChat: () => void;
  onImportImage: (file: File) => void;
  onExportXmi: () => void;
  onImportXmi: (file: File) => void;
}

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  expanded: boolean;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ToolButton({ icon, label, expanded, active, disabled, onClick }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-medium transition-colors disabled:opacity-55 ${
        expanded ? '' : 'justify-center'
      } ${
        active
          ? 'border border-accent/40 bg-accent-soft text-accent-hi hover:border-accent/60'
          : 'border border-transparent text-ink-soft hover:bg-raised hover:text-ink'
      }`}
    >
      <span className="grid shrink-0 place-items-center">{icon}</span>
      {expanded && <span className="truncate">{label}</span>}
    </button>
  );
}

function Section({
  title,
  expanded,
  children,
}: {
  title: string;
  expanded: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1 border-t border-hairline px-2 py-2.5 first:border-t-0">
      {expanded && (
        <p className="px-2.5 pb-1 text-[10px] font-semibold tracking-wide text-ink-faint uppercase">
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

/**
 * Panel lateral de herramientas del editor: agrupa todo lo que antes vivía
 * en EditorHeader (modelado, interoperabilidad UML, asistente de IA y
 * apariencia) para que la barra superior quede reducida a lo esencial
 * (volver, presencia, historial, guardar). Colapsable: por defecto muestra
 * solo íconos para no restarle espacio al lienzo.
 */
export function EditorToolsPanel({
  expanded,
  onToggleExpanded,
  theme,
  onToggleTheme,
  exporting,
  importingImage,
  importingXmi,
  exportingXmi,
  assistantOpen,
  chatOpen,
  onAddClass,
  onExportSpring,
  onToggleAssistant,
  onToggleChat,
  onImportImage,
  onExportXmi,
  onImportXmi,
}: EditorToolsPanelProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const xmiInputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === 'dark';

  return (
    <aside
      className={`relative z-20 flex h-full shrink-0 flex-col overflow-y-auto border-r border-hairline bg-surface/95 backdrop-blur-md transition-[width] duration-200 ${
        expanded ? 'w-56' : 'w-14'
      }`}
    >
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

      <div className="flex items-center justify-between gap-2 border-b border-hairline px-2.5 py-2.5">
        {expanded && (
          <span className="truncate text-[12px] font-semibold text-ink">Herramientas</span>
        )}
        <button
          type="button"
          onClick={onToggleExpanded}
          title={expanded ? 'Colapsar panel' : 'Expandir panel'}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-ink-muted transition-colors hover:bg-raised hover:text-ink"
        >
          {expanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      <Section title="Diagrama" expanded={expanded}>
        <ToolButton
          icon={<Plus size={16} />}
          label="Agregar clase"
          expanded={expanded}
          onClick={onAddClass}
        />
        <ToolButton
          icon={exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          label={exporting ? 'Generando…' : 'Exportar Spring Boot'}
          expanded={expanded}
          disabled={exporting}
          onClick={onExportSpring}
        />
      </Section>

      <Section title="Interoperabilidad UML" expanded={expanded}>
        <ToolButton
          icon={
            importingImage ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />
          }
          label={importingImage ? 'Analizando imagen…' : 'Importar desde imagen'}
          expanded={expanded}
          disabled={importingImage}
          onClick={() => imageInputRef.current?.click()}
        />
        <ToolButton
          icon={importingXmi ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
          label={importingXmi ? 'Importando XMI…' : 'Importar XMI'}
          expanded={expanded}
          disabled={importingXmi}
          onClick={() => xmiInputRef.current?.click()}
        />
        <ToolButton
          icon={exportingXmi ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
          label={exportingXmi ? 'Exportando XMI…' : 'Exportar XMI'}
          expanded={expanded}
          disabled={exportingXmi}
          onClick={onExportXmi}
        />
      </Section>

      <Section title="Colaboración" expanded={expanded}>
        <ToolButton
          icon={<MessageCircle size={16} />}
          label="Chat del equipo"
          expanded={expanded}
          active={chatOpen}
          onClick={onToggleChat}
        />
      </Section>

      <Section title="Asistente" expanded={expanded}>
        <ToolButton
          icon={<Sparkles size={16} />}
          label="Asistente de IA"
          expanded={expanded}
          active={assistantOpen}
          onClick={onToggleAssistant}
        />
      </Section>

      <Section title="Apariencia" expanded={expanded}>
        <ToolButton
          icon={isDark ? <Sun size={16} /> : <Moon size={16} />}
          label={isDark ? 'Tema claro' : 'Tema oscuro'}
          expanded={expanded}
          onClick={onToggleTheme}
        />
      </Section>
    </aside>
  );
}
