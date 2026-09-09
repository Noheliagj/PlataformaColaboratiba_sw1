import { Plus, Trash2, X } from 'lucide-react';
import type { ClassNodeData } from './ClassNode';

type ListKey = 'attributes' | 'methods';

interface SidebarProps {
  data: ClassNodeData;
  onChange: (patch: Partial<ClassNodeData>) => void;
  onClose: () => void;
}

/**
 * RF6 - Panel lateral de edición de la clase seleccionada.
 * Cada cambio llama a onChange, que actualiza el nodo en tiempo real.
 */
export function Sidebar({ data, onChange, onClose }: SidebarProps) {
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

  const renderList = (key: ListKey, label: string) => (
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
      {(data[key] ?? []).length === 0 && (
        <p className="sidebar-empty">Sin {label.toLowerCase()}</p>
      )}
      {(key === 'attributes' ? attributes : methods).map((item, index) => (
        <div className="sidebar-row" key={index}>
          <input
            value={item}
            onChange={(e) => updateItem(key, index, e.target.value)}
            placeholder={key === 'attributes' ? '- campo: tipo' : '+ metodo(): tipo'}
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
    <aside className="sidebar">
      <div className="sidebar-head">
        <h3>Editar clase</h3>
        <button type="button" className="sidebar-icon-btn" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <label className="sidebar-field">
        <span>Nombre</span>
        <input
          value={data.name ?? ''}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="NombreClase"
        />
      </label>

      {renderList('attributes', 'Atributos')}
      {renderList('methods', 'Métodos')}
    </aside>
  );
}
