import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

/** Datos de una asociación entre clases (se guardan en edge.data). */
export type ClassEdgeData = {
  relationName?: string;
  sourceCardinality?: string;
  targetCardinality?: string;
};

const LABEL_CLASS =
  'absolute select-none whitespace-nowrap rounded-md border border-slate-700 ' +
  'bg-slate-900 px-1.5 py-0.5 text-[11px] font-medium text-slate-200 shadow-sm ' +
  'pointer-events-auto';

const CARD_CLASS =
  'absolute select-none whitespace-nowrap rounded-md border border-slate-600 ' +
  'bg-slate-700 px-1.5 py-0.5 font-mono text-[11px] text-slate-100 shadow-sm ' +
  'pointer-events-auto';

/**
 * RF6 - Arista con hasta tres etiquetas opcionales:
 *  - nombre de la relación (centro)
 *  - cardinalidad de origen (cerca del nodo inicio)
 *  - cardinalidad de destino (cerca del nodo fin)
 */
export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  selected,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const { relationName, sourceCardinality, targetCardinality } = (data ??
    {}) as ClassEdgeData;

  // Cardinalidades: un 18% hacia el interior desde cada extremo.
  const srcX = sourceX + (targetX - sourceX) * 0.18;
  const srcY = sourceY + (targetY - sourceY) * 0.18;
  const tgtX = sourceX + (targetX - sourceX) * 0.82;
  const tgtY = sourceY + (targetY - sourceY) * 0.82;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: selected ? '#818cf8' : '#94a3b8',
          strokeWidth: selected ? 2 : 1.5,
        }}
      />
      <EdgeLabelRenderer>
        {relationName && (
          <div
            className={LABEL_CLASS}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {relationName}
          </div>
        )}
        {sourceCardinality && (
          <div
            className={CARD_CLASS}
            style={{
              transform: `translate(-50%, -50%) translate(${srcX}px, ${srcY}px)`,
            }}
          >
            {sourceCardinality}
          </div>
        )}
        {targetCardinality && (
          <div
            className={CARD_CLASS}
            style={{
              transform: `translate(-50%, -50%) translate(${tgtX}px, ${tgtY}px)`,
            }}
          >
            {targetCardinality}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
