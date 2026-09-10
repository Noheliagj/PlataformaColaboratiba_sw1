import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

/** Datos que lleva cada nodo de clase. `type` (no `interface`) para que
 *  sea compatible con el genérico Node<T> de React Flow. */
export type ClassNodeData = {
  name?: string;
  attributes?: string[];
  methods?: string[];
};

const HANDLE_CLASS =
  '!h-2.5 !w-2.5 !rounded-full !border-2 !border-slate-950 !bg-indigo-500';

/**
 * RF4 - Nodo personalizado con la forma de una clase UML:
 * cabecera (nombre) + sección de atributos + sección de métodos.
 */
export function ClassNode({ data, selected }: NodeProps) {
  const { name, attributes, methods } = data as ClassNodeData;

  return (
    <div
      className={`min-w-[200px] overflow-hidden rounded-lg border bg-slate-900 font-sans text-xs text-slate-200 shadow-xl shadow-black/40 transition-colors ${
        selected ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-700'
      }`}
    >
      <Handle type="target" position={Position.Top} className={HANDLE_CLASS} />

      <div className="border-b border-slate-700 bg-slate-800 px-3 py-2 text-center text-[13px] font-semibold tracking-wide text-white">
        {name ?? 'NuevaClase'}
      </div>

      <ul className="space-y-1 px-3 py-2 font-mono">
        {attributes && attributes.length > 0 ? (
          attributes.map((attr, i) => (
            <li key={i} className="whitespace-nowrap text-slate-300">
              {attr}
            </li>
          ))
        ) : (
          <li className="text-slate-600 italic">sin atributos</li>
        )}
      </ul>

      <ul className="space-y-1 border-t border-slate-700 px-3 py-2 font-mono">
        {methods && methods.length > 0 ? (
          methods.map((method, i) => (
            <li key={i} className="whitespace-nowrap text-slate-300">
              {method}
            </li>
          ))
        ) : (
          <li className="text-slate-600 italic">sin métodos</li>
        )}
      </ul>

      <Handle type="source" position={Position.Bottom} className={HANDLE_CLASS} />
    </div>
  );
}
