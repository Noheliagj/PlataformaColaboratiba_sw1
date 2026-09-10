import { Plus, Trash2, X } from 'lucide-react';
import type { ClassNodeData } from './ClassNode';
import type { ClassEdgeData } from './CustomEdge';

type ListKey = 'attributes' | 'methods';

/** Opciones de cardinalidad ofrecidas para las asociaciones. */
const CARDINALITIES = ['1', '0..1', 'N', '0..*'];

const INPUT_CLASS =
  'w-full min-w-0 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 ' +
  'outline-none transition-colors placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25';

const FIELD_LABEL =
  'block text-[11px] font-semibold uppercase tracking-wide text-slate-400';

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
 * RF6 - Panel lateral de edición. Muestra el formulario de clase o el de
 * asociación según lo que esté seleccionado en el lienzo.
 */
export function Sidebar(props: SidebarProps) {
  return (
    <aside className="absolute top-0 right-0 z-20 flex h-full w-80 flex-col overflow-y-auto border-l border-slate-800 bg-slate-900/95 backdrop-blur">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">
          {props.kind === 'edge' ? 'Editar relación' : 'Editar clase'}
        </h3>
        <button
          type="button"
          onClick={props.onClose}
          className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          aria-label="Cerrar panel"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-5 p-4">
        {props.kind === 'edge' ? (
          <EdgeForm data={props.data} onChange={props.onChange} />
        ) : (
          <NodeForm data={props.data} onChange={props.onChange} />
        )}
      </div>
    </aside>
  );
}

function EdgeForm({
  data,
  onChange,
}: {
  data: ClassEdgeData;
  onChange: (patch: Partial<ClassEdgeData>) => void;
}) {
  const cardinalitySelect = (
    value: string | undefined,
    onPick: (v: string) => void,
  ) => (
    <select
      className={INPUT_CLASS}
      value={value ?? ''}
      onChange={(e) => onPick(e.target.value)}
    >
      <option value="">(sin especificar)</option>
      {CARDINALITIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );

  return (
    <>
      <label className="block space-y-1.5">
        <span className={FIELD_LABEL}>Nombre de la relación</span>
        <input
          className={INPUT_CLASS}
          value={data.relationName ?? ''}
          onChange={(e) => onChange({ relationName: e.target.value })}
          placeholder="p. ej. pertenece_a"
        />
      </label>

      <label className="block space-y-1.5">
        <span className={FIELD_LABEL}>Cardinalidad origen</span>
        {cardinalitySelect(data.sourceCardinality, (v) =>
          onChange({ sourceCardinality: v }),
        )}
      </label>

      <label className="block space-y-1.5">
        <span className={FIELD_LABEL}>Cardinalidad destino</span>
        {cardinalitySelect(data.targetCardinality, (v) =>
          onChange({ targetCardinality: v }),
        )}
      </label>
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
          className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
        >
          <Plus size={13} /> Añadir
        </button>
      </div>
      {items.length === 0 && (
        <p className="text-xs text-slate-600 italic">
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
                key === 'attributes' ? '- campo: tipo' : '+ metodo(): tipo'
              }
            />
            <button
              type="button"
              onClick={() => removeItem(key, index)}
              title="Eliminar"
              className="shrink-0 rounded-lg border border-rose-900/70 px-2 text-rose-300 transition-colors hover:bg-rose-950/40"
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
        <span className={FIELD_LABEL}>Nombre</span>
        <input
          className={INPUT_CLASS}
          value={data.name ?? ''}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="NombreClase"
        />
      </label>

      {renderList('attributes', 'Atributos', attributes)}
      {renderList('methods', 'Métodos', methods)}
    </>
  );
}
