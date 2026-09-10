import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

/** Datos de una asociación entre clases (se guardan en edge.data). */
export type ClassEdgeData = {
  relationName?: string;
  sourceCardinality?: string;
  targetCardinality?: string;
};

const LABEL_CLASS =
  'absolute select-none whitespace-nowrap rounded-md border border-hairline-strong ' +
  'bg-surface px-1.5 py-0.5 text-[10px] font-medium text-ink shadow-[0_4px_12px_-4px_rgba(0,0,0,0.6)] ' +
  'pointer-events-auto';

const CARD_CLASS =
  'absolute select-none whitespace-nowrap rounded border border-hairline-strong ' +
  'bg-raised px-1 py-px font-mono text-[10px] text-ink-soft ' +
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
          stroke: selected ? '#7c86e6' : '#6b6d78',
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
