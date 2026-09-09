import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { FolderPlus, LogOut, Trash2 } from 'lucide-react';
import axios from 'axios';
import { clearSession, getStoredUser } from '../services/auth';
import {
  createProject,
  deleteProject,
  listProjects,
} from '../services/projects';
import type { Project } from '../services/projects';
import { getErrorMessage } from '../services/http-error';
import './home.css';

/** RF3 - Panel de control: listar, crear y eliminar proyectos del usuario. */
export function HomePage() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Si el token caducó o es inválido, cerramos sesión y volvemos al login.
  const handleAuthError = useCallback(
    (err: unknown): boolean => {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        clearSession();
        navigate('/login');
        return true;
      }
      return false;
    },
    [navigate],
  );

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProjects(await listProjects());
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(getErrorMessage(err, 'No se pudieron cargar los proyectos'));
      }
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const created = await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setProjects((prev) => [created, ...prev]);
      setName('');
      setDescription('');
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(getErrorMessage(err, 'No se pudo crear el proyecto'));
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(getErrorMessage(err, 'No se pudo eliminar el proyecto'));
      }
    } finally {
      setDeletingId(null);
    }
  }

  function handleLogout() {
    clearSession();
    navigate('/login');
  }

  return (
    <div className="home-wrap">
      <div className="home-inner">
        <header className="home-header">
          <div>
            <h1>Mis proyectos</h1>
            <span className="who">
              {user.name} — {user.email}
            </span>
          </div>
          <button className="ghost-btn" type="button" onClick={handleLogout}>
            <LogOut size={14} /> Cerrar sesión
          </button>
        </header>

        {error && <div className="error-box">{error}</div>}

        <section className="card">
          <h2>Nuevo proyecto</h2>
          <form className="new-project-form" onSubmit={handleCreate}>
            <input
              type="text"
              placeholder="Nombre del proyecto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <textarea
              placeholder="Descripción (opcional)"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button className="primary-btn" type="submit" disabled={creating}>
              <FolderPlus size={15} />
              {creating ? 'Creando…' : 'Crear proyecto'}
            </button>
          </form>
        </section>

        <section>
          {loading ? (
            <p className="muted">Cargando…</p>
          ) : projects.length === 0 ? (
            <p className="muted">Todavía no tienes proyectos.</p>
          ) : (
            <ul className="project-list">
              {projects.map((project) => (
                <li key={project.id} className="project-item">
                  <div>
                    <div className="name">{project.name}</div>
                    {project.description && (
                      <div className="desc">{project.description}</div>
                    )}
                    <div className="date">
                      {new Date(project.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    className="danger-btn"
                    type="button"
                    onClick={() => handleDelete(project.id)}
                    disabled={deletingId === project.id}
                  >
                    <Trash2 size={14} />
                    {deletingId === project.id ? 'Eliminando…' : 'Eliminar'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
