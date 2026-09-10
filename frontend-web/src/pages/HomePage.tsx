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

const FIELD_CLASS =
  'w-full rounded-lg border border-hairline-strong bg-sunken px-3 py-2.5 text-sm text-ink ' +
  'outline-none transition-colors placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent-soft';

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

  const firstName = user.name.split(' ')[0];

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar user={user} onLogout={handleLogout} />

      {/* Cabecera de la vista */}
      <div className="bg-halo relative border-b border-hairline">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-50" />
        <main className="relative mx-auto max-w-6xl px-5 pt-9 pb-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[12px] font-medium tracking-wide text-ink-muted uppercase">
                Espacio de trabajo
              </p>
              <h1 className="mt-1.5 text-[22px] font-semibold text-ink">
                Hola, {firstName}
              </h1>
              <p className="mt-1 text-sm text-ink-muted">
                {projects.length === 0
                  ? 'Aún no tienes proyectos. Crea tu primer diagrama de clases.'
                  : `${projects.length} ${
                      projects.length === 1 ? 'proyecto' : 'proyectos'
                    } en tu espacio de trabajo.`}
              </p>
            </div>
            <Button onClick={openModal} icon={<FolderPlus size={16} />}>
              Nuevo proyecto
            </Button>
          </div>
        </main>
      </div>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {error && !modalOpen && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-critical/40 bg-critical-soft px-3 py-2.5 text-[13px] text-critical">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[168px] animate-pulse rounded-xl border border-hairline bg-surface"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-hairline-strong bg-surface px-6 py-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl border border-hairline-strong bg-raised text-accent-hi">
              <FolderPlus size={24} />
            </span>
            <h2 className="mt-4 text-[15px] font-medium text-ink">
              Todavía no tienes proyectos
            </h2>
            <p className="mt-1.5 max-w-sm text-[13px] text-ink-muted">
              Crea un proyecto para modelar tus clases, derivar el modelo de
              base de datos y generar el backend Spring Boot.
            </p>
            <Button
              onClick={openModal}
              icon={<FolderPlus size={16} />}
              className="mt-5"
            >
              Nuevo proyecto
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <article
                key={project.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-hairline bg-surface p-5 transition-colors hover:border-hairline-strong"
              >
                <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate text-[15px] font-semibold text-ink">
                    {project.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleDelete(project.id)}
                    disabled={deletingId === project.id}
                    className="-mt-1 -mr-1 shrink-0 rounded-md p-1.5 text-ink-faint transition-colors hover:bg-critical-soft hover:text-critical disabled:opacity-50"
                    title="Eliminar proyecto"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-[13px] text-ink-muted">
                  {project.description || 'Sin descripción.'}
                </p>

                <div className="mt-4 flex items-center gap-1.5 text-[11px] text-ink-faint">
                  <Clock size={13} />
                  Actualizado {formatDate(project.updatedAt)}
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/projects/${project.id}/editor`)}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-hairline-strong bg-raised px-4 py-2 text-[13px] font-medium text-ink-soft transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-white"
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
        description="Nombra tu proyecto para empezar a modelar."
        onClose={() => !creating && setModalOpen(false)}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-critical/40 bg-critical-soft px-3 py-2.5 text-[13px] text-critical">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="project-name"
              className="block text-[12px] font-medium text-ink-soft"
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
              className={FIELD_CLASS}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="project-desc"
              className="block text-[12px] font-medium text-ink-soft"
            >
              Descripción <span className="text-ink-faint">(opcional)</span>
            </label>
            <textarea
              id="project-desc"
              rows={3}
              placeholder="Breve descripción del proyecto"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${FIELD_CLASS} resize-none`}
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
              icon={!creating && <FolderPlus size={16} />}
            >
              {creating ? 'Creando…' : 'Crear proyecto'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
