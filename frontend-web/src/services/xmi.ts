import type { Edge, Node } from '@xyflow/react';
import { api } from './api';

export interface XmiImportResult {
  modelData: { nodes: Node[]; edges: Edge[] };
  importedClasses: number;
}

/** RF12: GET /projects/:id/xmi/export — descarga el diagrama como .xmi (XMI 2.1). */
export async function exportProjectXmi(
  id: string,
  projectName: string,
): Promise<void> {
  const { data } = await api.get<ArrayBuffer>(`/projects/${id}/xmi/export`, {
    responseType: 'arraybuffer',
  });
  const blob = new Blob([data], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugify(projectName)}.xmi`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * RF13: POST /projects/:id/xmi/import — importa un .xmi (Enterprise Architect
 * u otra herramienta UML) y reemplaza el diagrama actual, que el usuario
 * puede editar antes de "Guardar".
 */
export async function importProjectXmi(
  id: string,
  file: File,
): Promise<XmiImportResult> {
  const form = new FormData();
  form.append('file', file);
  // Ver comentario equivalente en services/ai.ts: no fijar 'Content-Type' a
  // mano, el navegador debe generar el boundary del multipart.
  const { data } = await api.post<XmiImportResult>(
    `/projects/${id}/xmi/import`,
    form,
    { headers: { 'Content-Type': undefined } },
  );
  return data;
}

const DIACRITICS_RANGE = new RegExp(
  '[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']',
  'g',
);

/** Debe coincidir con el slug que usa el backend para nombrar el .xmi. */
function slugify(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(DIACRITICS_RANGE, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'proyecto';
}
