import { api } from './api';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
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

/** RF3: POST /projects */
export async function createProject(
  payload: CreateProjectPayload,
): Promise<Project> {
  const { data } = await api.post<Project>('/projects', payload);
  return data;
}

/** RF3: DELETE /projects/:id */
export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
}
