import type { Edge, Node } from '@xyflow/react';
import { api } from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatResult {
  reply: string;
  actions: string[];
}

/** RF11: POST /projects/:id/ai/chat — comando en lenguaje natural sobre el diagrama. */
export async function sendAiMessage(
  projectId: string,
  message: string,
  history: ChatMessage[],
): Promise<AiChatResult> {
  const { data } = await api.post<AiChatResult>(`/projects/${projectId}/ai/chat`, {
    message,
    history,
  });
  return data;
}

export interface AiImportImageResult {
  modelData: { nodes: Node[]; edges: Edge[] };
  summary: string;
}

/**
 * Importación de diagramas por imagen (Vision): sube una foto/captura de un
 * diagrama de clases y la IA extrae su estructura, reemplazando el diagrama
 * actual (que el usuario puede seguir editando antes de "Guardar").
 */
export async function importDiagramFromImage(
  projectId: string,
  file: File,
): Promise<AiImportImageResult> {
  const form = new FormData();
  form.append('file', file);
  // No fijar 'Content-Type' a mano: con FormData, el navegador debe generar
  // el header completo con su "boundary" (si se fija "multipart/form-data"
  // a secas, sin boundary, el backend no puede parsear el cuerpo). Se anula
  // el 'application/json' por defecto de la instancia de axios para que lo
  // calcule el navegador.
  const { data } = await api.post<AiImportImageResult>(
    `/projects/${projectId}/ai/import-image`,
    form,
    { headers: { 'Content-Type': undefined } },
  );
  return data;
}
