import { getNodesBounds, getViewportForBounds } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import { toPng } from 'html-to-image';

const IMAGE_WIDTH = 1600;
const IMAGE_HEIGHT = 1200;
const PADDING = 0.1;

/**
 * Descarga el lienzo actual del diagrama como PNG. PNG (no JPEG) porque el
 * diagrama es texto + líneas sobre fondo sólido -- la compresión con
 * pérdida de JPEG deja artefactos visibles justo alrededor de esos bordes,
 * y PNG además preserva el fondo con su color exacto del tema.
 *
 * Sigue el patrón recomendado por React Flow para exportar el lienzo:
 * calcular el viewport (x, y, zoom) que encuadra todos los nodos con
 * `getNodesBounds` + `getViewportForBounds`, aplicarlo como transform al
 * elemento `.react-flow__viewport` y rasterizarlo con html-to-image (no
 * captura controles/minimapa porque quedan fuera de ese elemento).
 */
export async function downloadDiagramAsPng(
  nodes: Node[],
  fileName: string,
): Promise<void> {
  if (nodes.length === 0) {
    throw new Error('Agrega al menos una clase al diagrama antes de exportarlo.');
  }

  const viewportEl = document.querySelector<HTMLElement>(
    '.react-flow__viewport',
  );
  if (!viewportEl) {
    throw new Error('No se encontró el lienzo del diagrama.');
  }

  const bounds = getNodesBounds(nodes);
  const { x, y, zoom } = getViewportForBounds(
    bounds,
    IMAGE_WIDTH,
    IMAGE_HEIGHT,
    0.2,
    2,
    PADDING,
  );

  const backgroundColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-canvas')
    .trim();

  const dataUrl = await toPng(viewportEl, {
    backgroundColor: backgroundColor || '#08090a',
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    pixelRatio: 2,
    style: {
      width: `${IMAGE_WIDTH}px`,
      height: `${IMAGE_HEIGHT}px`,
      transform: `translate(${x}px, ${y}px) scale(${zoom})`,
    },
  });

  const link = document.createElement('a');
  link.download = `${fileName || 'diagrama'}.png`;
  link.href = dataUrl;
  link.click();
}
