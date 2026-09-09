import type { Edge, Node } from '@xyflow/react';
import { api } from './api';

/** Estado del diagrama que se guarda en Project.modelData. */
export interface DiagramModel {
  nodes: Node[];
  edges: Edge[];
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  modelData?: DiagramModel | null;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
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
