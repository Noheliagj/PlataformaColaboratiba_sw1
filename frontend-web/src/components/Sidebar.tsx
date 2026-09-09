import { Plus, Trash2, X } from 'lucide-react';
import type { ClassNodeData } from './ClassNode';
import type { ClassEdgeData } from './CustomEdge';

type ListKey = 'attributes' | 'methods';

/** Opciones de cardinalidad ofrecidas para las asociaciones. */
const CARDINALITIES = ['1', '0..1', 'N', '0..*'];

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
    <aside className="sidebar">
      <div className="sidebar-head">
        <h3>{props.kind === 'edge' ? 'Editar relación' : 'Editar clase'}</h3>
        <button type="button" className="sidebar-icon-btn" onClick={props.onClose}>
          <X size={16} />
        </button>
      </div>

      {props.kind === 'edge' ? (
        <EdgeForm data={props.data} onChange={props.onChange} />
      ) : (
        <NodeForm data={props.data} onChange={props.onChange} />
      )}
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
    <select value={value ?? ''} onChange={(e) => onPick(e.target.value)}>
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
      <label className="sidebar-field">
        <span>Nombre de la relación</span>
        <input
          value={data.relationName ?? ''}
          onChange={(e) => onChange({ relationName: e.target.value })}
          placeholder="p. ej. pertenece_a"
        />
      </label>

      <label className="sidebar-field">
        <span>Cardinalidad origen</span>
        {cardinalitySelect(data.sourceCardinality, (v) =>
          onChange({ sourceCardinality: v }),
        )}
      </label>

      <label className="sidebar-field">
        <span>Cardinalidad destino</span>
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
    <div className="sidebar-section">
      <div className="sidebar-section-head">
        <span>{label}</span>
        <button
          type="button"
          className="sidebar-icon-btn"
          onClick={() => addItem(key)}
          title={`Añadir ${label.toLowerCase()}`}
        >
          <Plus size={14} />
        </button>
      </div>
      {items.length === 0 && (
        <p className="sidebar-empty">Sin {label.toLowerCase()}</p>
      )}
      {items.map((item, index) => (
        <div className="sidebar-row" key={index}>
          <input
            value={item}
            onChange={(e) => updateItem(key, index, e.target.value)}
            placeholder={
              key === 'attributes' ? '- campo: tipo' : '+ metodo(): tipo'
            }
          />
          <button
            type="button"
            className="sidebar-icon-btn danger"
            onClick={() => removeItem(key, index)}
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <label className="sidebar-field">
        <span>Nombre</span>
        <input
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
