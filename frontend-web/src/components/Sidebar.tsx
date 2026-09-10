import { Plus, Trash2, X } from 'lucide-react';
import type { ClassNodeData } from './ClassNode';
import type { ClassEdgeData } from './CustomEdge';

type ListKey = 'attributes' | 'methods';

/** Opciones de cardinalidad ofrecidas para las asociaciones. */
const CARDINALITIES = ['1', '0..1', 'N', '0..*'];

const INPUT_CLASS =
  'w-full min-w-0 rounded-lg border border-hairline-strong bg-sunken px-3 py-2 font-mono text-[13px] text-ink ' +
  'outline-none transition-colors placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent-soft';

const FIELD_LABEL =
  'block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint';

type SidebarProps =
  | {
      kind: 'node';
      data: ClassNodeData;
      onChange: (patch: Partial<ClassNodeData>) => void;
      onClose: () => void;
    }
  | {
      kind: 'edge';
      data: ClassEdgeData;
      onChange: (patch: Partial<ClassEdgeData>) => void;
      onClose: () => void;
    };

/**
 * RF6 - Panel de inspección. Muestra el formulario de clase o el de
 * asociación según lo que esté seleccionado en el lienzo.
 */
export function Sidebar(props: SidebarProps) {
  return (
    <aside className="absolute top-0 right-0 z-20 flex h-full w-[300px] flex-col overflow-y-auto border-l border-hairline bg-surface/95 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <h3 className="text-[13px] font-semibold text-ink">
            {props.kind === 'edge' ? 'Inspector · Relación' : 'Inspector · Clase'}
          </h3>
        </div>
        <button
          type="button"
          onClick={props.onClose}
          className="-mr-1 rounded-md p-1 text-ink-muted transition-colors hover:bg-raised hover:text-ink"
          aria-label="Cerrar panel"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-6 p-4">
        {props.kind === 'edge' ? (
          <EdgeForm data={props.data} onChange={props.onChange} />
        ) : (
          <NodeForm data={props.data} onChange={props.onChange} />
        )}
      </div>
    </aside>
  );
}

function CardinalityPicker({
  value,
  onPick,
}: {
  value: string | undefined;
  onPick: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-1 rounded-lg border border-hairline-strong bg-sunken p-1">
      {CARDINALITIES.map((c) => {
        const active = value === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onPick(active ? '' : c)}
            className={`rounded-md py-1.5 font-mono text-[12px] transition-colors ${
              active
                ? 'bg-accent text-white'
                : 'text-ink-muted hover:bg-raised hover:text-ink'
            }`}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}

function EdgeForm({
  data,
  onChange,
}: {
  data: ClassEdgeData;
  onChange: (patch: Partial<ClassEdgeData>) => void;
}) {
  return (
    <>
      <label className="block space-y-1.5">
        <span className={FIELD_LABEL}>Nombre de la relación</span>
        <input
          className={INPUT_CLASS}
          value={data.relationName ?? ''}
          onChange={(e) => onChange({ relationName: e.target.value })}
          placeholder="pertenece_a"
        />
      </label>

      <div className="space-y-1.5">
        <span className={FIELD_LABEL}>Cardinalidad origen</span>
        <CardinalityPicker
          value={data.sourceCardinality}
          onPick={(v) => onChange({ sourceCardinality: v })}
        />
      </div>

      <div className="space-y-1.5">
        <span className={FIELD_LABEL}>Cardinalidad destino</span>
        <CardinalityPicker
          value={data.targetCardinality}
          onPick={(v) => onChange({ targetCardinality: v })}
        />
      </div>
    </>
  );
}

function NodeForm({
  data,
  onChange,
}: {
  data: ClassNodeData;
  onChange: (patch: Partial<ClassNodeData>) => void;
}) {
  const attributes = data.attributes ?? [];
  const methods = data.methods ?? [];

  const setList = (key: ListKey, values: string[]) => {
    onChange({ [key]: values } as Partial<ClassNodeData>);
  };

  const updateItem = (key: ListKey, index: number, value: string) => {
    const next = [...(data[key] ?? [])];
    next[index] = value;
    setList(key, next);
  };

  const addItem = (key: ListKey) => setList(key, [...(data[key] ?? []), '']);

  const removeItem = (key: ListKey, index: number) => {
    setList(
      key,
      (data[key] ?? []).filter((_, i) => i !== index),
    );
  };

  const renderList = (key: ListKey, label: string, items: string[]) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={FIELD_LABEL}>{label}</span>
        <button
          type="button"
          onClick={() => addItem(key)}
          title={`Añadir ${label.toLowerCase()}`}
          className="inline-flex items-center gap-1 rounded-md border border-hairline-strong bg-raised px-2 py-1 text-[11px] font-medium text-ink-soft transition-colors hover:bg-overlay hover:text-ink"
        >
          <Plus size={12} /> Añadir
        </button>
      </div>
      {items.length === 0 && (
        <p className="text-[12px] text-ink-faint italic">
          Sin {label.toLowerCase()}
        </p>
      )}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div className="flex gap-2" key={index}>
            <input
              className={INPUT_CLASS}
              value={item}
              onChange={(e) => updateItem(key, index, e.target.value)}
              placeholder={
                key === 'attributes' ? 'campo: tipo' : 'metodo(): tipo'
              }
            />
            <button
              type="button"
              onClick={() => removeItem(key, index)}
              title="Eliminar"
              className="shrink-0 rounded-lg border border-critical/40 px-2 text-critical transition-colors hover:bg-critical-soft"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <label className="block space-y-1.5">
        <span className={FIELD_LABEL}>Nombre de la clase</span>
        <input
          className={INPUT_CLASS}
          value={data.name ?? ''}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="NombreClase"
        />
      </label>

      <div className="h-px bg-hairline" />

      {renderList('attributes', 'Atributos', attributes)}
      {renderList('methods', 'Métodos', methods)}
    </>
  );
}
