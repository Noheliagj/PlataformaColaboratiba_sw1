import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import './class-node.css';

/** Datos que llevará cada nodo de clase (edición pendiente para RF6). */
export interface ClassNodeData {
  name?: string;
  attributes?: string[];
  methods?: string[];
}

/**
 * RF4 - Nodo personalizado con la forma de una clase UML:
 * cabecera (nombre) + sección de atributos + sección de métodos.
 * Solo cascarón visual, todavía sin edición.
 */
export function ClassNode({ data }: NodeProps) {
  const { name, attributes, methods } = data as ClassNodeData;

  return (
    <div className="class-node">
      <Handle type="target" position={Position.Top} />

      <div className="class-node__name">{name ?? 'NuevaClase'}</div>

      <ul className="class-node__section">
        {attributes && attributes.length > 0 ? (
          attributes.map((attr, i) => <li key={i}>{attr}</li>)
        ) : (
          <li className="class-node__empty">sin atributos</li>
        )}
      </ul>

      <ul className="class-node__section">
        {methods && methods.length > 0 ? (
          methods.map((method, i) => <li key={i}>{method}</li>)
        ) : (
          <li className="class-node__empty">sin métodos</li>
        )}
      </ul>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
