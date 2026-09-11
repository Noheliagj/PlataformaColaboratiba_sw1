import type { Edge, Node } from '@xyflow/react';
import { api } from './api';

/** Estado del diagrama que se guarda en Project.modelData. */
export interface DiagramModel {
  nodes: Node[];
  edges: Edge[];
}

/** RF4/RF10: rol del usuario actual dentro del proyecto. */
export type ProjectRole = 'OWNER' | 'COLLABORATOR';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  modelData?: DiagramModel | null;
  /** Presente en las respuestas de GET /projects y GET /projects/:id. */
  role?: ProjectRole;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
}

export interface InviteInfo {
  inviteCode: string;
  invitePassword: string;
}

export interface JoinProjectPayload {
  code: string;
  password: string;
}

export interface JoinProjectResult {
  id: string;
  name: string;
  role: ProjectRole;
}

/** RF9: una entrada del historial de guardados del diagrama. */
export interface ProjectActivity {
  id: string;
  action: string;
  createdAt: string;
  user: { id: string; name: string };
}

/** RF3: GET /projects — solo los del usuario autenticado. */
export async function listProjects(): Promise<Project[]> {
  const { data } = await api.get<Project[]>('/projects');
  return data;
}

/** RF5: GET /projects/:id — proyecto individual con su modelData. */
export async function getProject(id: string): Promise<Project> {
  const { data } = await api.get<Project>(`/projects/${id}`);
  return data;
}

/** RF3: POST /projects */
export async function createProject(
  payload: CreateProjectPayload,
): Promise<Project> {
  const { data } = await api.post<Project>('/projects', payload);
  return data;
}

/** RF5/RF6: PUT /projects/:id/model — guarda nodes + edges del diagrama. */
export async function saveProjectModel(
  id: string,
  model: DiagramModel,
): Promise<void> {
  await api.put(`/projects/${id}/model`, model);
}

/** RF3: DELETE /projects/:id */
export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
}

/** RF4: GET /projects/:id/invite — código + contraseña (solo el dueño). */
export async function getInviteInfo(id: string): Promise<InviteInfo> {
  const { data } = await api.get<InviteInfo>(`/projects/${id}/invite`);
  return data;
}

/** RF4/RF10: POST /projects/join — unirse a un proyecto ajeno como colaborador. */
export async function joinProject(
  payload: JoinProjectPayload,
): Promise<JoinProjectResult> {
  const { data } = await api.post<JoinProjectResult>('/projects/join', payload);
  return data;
}

/** RF9: GET /projects/:id/history — quién guardó el diagrama y cuándo. */
export async function getProjectHistory(id: string): Promise<ProjectActivity[]> {
  const { data } = await api.get<ProjectActivity[]>(`/projects/${id}/history`);
  return data;
}

/**
 * RF7: GET /projects/:id/generate/spring — descarga el backend Spring Boot
 * generado a partir del diagrama (nodes + edges) como un .zip binario.
 */
export async function downloadSpringBootProject(
  id: string,
  projectName: string,
): Promise<void> {
  const { data } = await api.get<ArrayBuffer>(`/projects/${id}/generate/spring`, {
    responseType: 'arraybuffer',
  });
  const blob = new Blob([data], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugify(projectName)}-spring.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Debe coincidir con el slug que usa el backend para nombrar el .zip. */
function slugify(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'proyecto';
}
