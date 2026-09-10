import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  FolderPlus,
  Clock,
  Trash2,
} from 'lucide-react';
import axios from 'axios';
import { clearSession, getStoredUser } from '../services/auth';
import {
  createProject,
  deleteProject,
  listProjects,
} from '../services/projects';
import type { Project } from '../services/projects';
import { getErrorMessage } from '../services/http-error';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

/** RF3 - Panel de control: listar, crear y eliminar proyectos del usuario. */
export function HomePage() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
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

  function openModal() {
    setName('');
    setDescription('');
    setError(null);
    setModalOpen(true);
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
      setModalOpen(false);
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

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Mis proyectos</h1>
            <p className="mt-1 text-sm text-slate-400">
              {projects.length === 0
                ? 'Crea tu primer diagrama de clases.'
                : `${projects.length} ${
                    projects.length === 1 ? 'proyecto' : 'proyectos'
                  } en tu espacio de trabajo.`}
            </p>
          </div>
          <Button onClick={openModal} icon={<FolderPlus size={16} />}>
            Nuevo Proyecto
          </Button>
        </div>

        {error && !modalOpen && (
          <div className="mt-6 flex items-start gap-2 rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-2.5 text-sm text-rose-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Estado de carga */}
        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-800/70 text-slate-400">
              <FolderPlus size={26} />
            </span>
            <h2 className="mt-4 text-base font-medium text-slate-200">
              Todavía no tienes proyectos
            </h2>
            <p className="mt-1 max-w-sm text-sm text-slate-400">
              Empieza creando un proyecto para modelar tus clases y generar el
              backend Spring Boot.
            </p>
            <Button
              onClick={openModal}
              icon={<FolderPlus size={16} />}
              className="mt-5"
            >
              Nuevo Proyecto
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <article
                key={project.id}
                className="group flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20 transition-colors hover:border-indigo-600/60"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate text-base font-semibold text-white">
                    {project.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleDelete(project.id)}
                    disabled={deletingId === project.id}
                    className="shrink-0 rounded-md p-1.5 text-slate-500 transition-colors hover:bg-rose-950/40 hover:text-rose-400 disabled:opacity-50"
                    title="Eliminar proyecto"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm text-slate-400">
                  {project.description || 'Sin descripción.'}
                </p>

                <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock size={13} />
                  Actualizado {formatDate(project.updatedAt)}
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/projects/${project.id}/editor`)}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-200 transition-colors group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"
                >
                  Abrir en el editor
                  <ArrowRight size={15} />
                </button>
              </article>
            ))}
          </div>
        )}
      </main>

      <Modal
        open={modalOpen}
        title="Nuevo proyecto"
        onClose={() => !creating && setModalOpen(false)}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-2.5 text-sm text-rose-300">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="project-name"
              className="block text-xs font-medium text-slate-300"
            >
              Nombre del proyecto
            </label>
            <input
              id="project-name"
              type="text"
              autoFocus
              placeholder="p. ej. Sistema de ventas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="project-desc"
              className="block text-xs font-medium text-slate-300"
            >
              Descripción <span className="text-slate-500">(opcional)</span>
            </label>
            <textarea
              id="project-desc"
              rows={3}
              placeholder="Breve descripción del proyecto"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalOpen(false)}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={creating}
              disabled={!name.trim()}
              icon={<FolderPlus size={16} />}
            >
              {creating ? 'Creando…' : 'Crear proyecto'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
