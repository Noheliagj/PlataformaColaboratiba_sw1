import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  addEdge,
  Background,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  AlertCircle,
  ArrowLeft,
  Download,
  Loader2,
  Plus,
  Save,
} from 'lucide-react';
import axios from 'axios';
import { ClassNode, type ClassNodeData } from '../components/ClassNode';
import { CustomEdge, type ClassEdgeData } from '../components/CustomEdge';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/ui/Button';
import {
  downloadSpringBootProject,
  getProject,
  saveProjectModel,
} from '../services/projects';
import { clearSession } from '../services/auth';
import { getErrorMessage } from '../services/http-error';

type ClassFlowNode = Node<ClassNodeData>;

// Fuera del componente para no recrear los objetos en cada render.
const nodeTypes = { classNode: ClassNode };
const edgeTypes = { customEdge: CustomEdge };

type Selection =
  | { kind: 'node'; id: string }
  | { kind: 'edge'; id: string }
  | null;

function createClassNode(): ClassFlowNode {
  return {
    id: crypto.randomUUID(),
    type: 'classNode',
    position: { x: 120 + Math.random() * 260, y: 100 + Math.random() * 220 },
    data: { name: 'NuevaClase', attributes: [], methods: [] },
  };
}

/** RF5/RF6 - Lienzo de modelado de clases: edición + persistencia. */
export function EditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [nodes, setNodes, onNodesChange] = useNodesState<ClassFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selection, setSelection] = useState<Selection>(null);

  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Al entrar: carga el proyecto y su diagrama (si existe).
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const project = await getProject(id);
        if (cancelled) return;
        setProjectName(project.name);
        const model = project.modelData;
        if (model?.nodes?.length) {
          setNodes(model.nodes as ClassFlowNode[]);
          // Fuerza 'customEdge' en aristas persistidas antes de RF6 (o sin
          // tipo), para que sus etiquetas se rendericen en el lienzo.
          setEdges(
            ((model.edges ?? []) as Edge[]).map((edge) => ({
              ...edge,
              type: 'customEdge',
            })),
          );
        }
      } catch (err) {
        if (!cancelled && !handleAuthError(err)) {
          setError(getErrorMessage(err, 'No se pudo cargar el proyecto'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, setNodes, setEdges, handleAuthError]);

  // Las nuevas asociaciones usan el tipo 'customEdge'.
  const onConnect = useCallback(
    (conn: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...conn,
            id: `edge-${crypto.randomUUID()}`,
            type: 'customEdge',
            data: {} as ClassEdgeData,
          },
          eds,
        ),
      ),
    [setEdges],
  );

  const addClass = useCallback(() => {
    setNodes((nds) => [...nds, createClassNode()]);
  }, [setNodes]);

  // RF6: cambios del panel lateral sobre la CLASE seleccionada, en vivo.
  const updateSelectedNode = useCallback(
    (patch: Partial<ClassNodeData>) => {
      if (selection?.kind !== 'node') return;
      const targetId = selection.id;
      setNodes((nds) =>
        nds.map((node) =>
          node.id === targetId
            ? { ...node, data: { ...node.data, ...patch } }
            : node,
        ),
      );
    },
    [selection, setNodes],
  );

  // RF6: cambios del panel lateral sobre la ASOCIACIÓN seleccionada, en vivo.
  const updateSelectedEdge = useCallback(
    (patch: Partial<ClassEdgeData>) => {
      if (selection?.kind !== 'edge') return;
      const targetId = selection.id;
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === targetId
            ? { ...edge, data: { ...(edge.data ?? {}), ...patch } }
            : edge,
        ),
      );
    },
    [selection, setEdges],
  );

  // RF5: guarda el estado actual (solo lo esencial) en el backend.
  const handleSave = useCallback(async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const cleanNodes = nodes.map(({ id: nId, type, position, data }) => ({
        id: nId,
        type,
        position,
        data,
      })) as Node[];
      const cleanEdges = edges.map(({ id: eId, source, target, type, data }) => ({
        id: eId,
        source,
        target,
        type,
        data,
      })) as Edge[];
      await saveProjectModel(id, { nodes: cleanNodes, edges: cleanEdges });
      setSavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(getErrorMessage(err, 'No se pudo guardar el diagrama'));
      }
    } finally {
      setSaving(false);
    }
  }, [id, nodes, edges, handleAuthError]);

  // RF7: descarga el backend Spring Boot generado a partir del diagrama.
  const handleExportSpring = useCallback(async () => {
    if (!id) return;
    setExporting(true);
    setError(null);
    try {
      await downloadSpringBootProject(id, projectName || 'proyecto');
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(
          getErrorMessage(err, 'No se pudo generar el backend Spring Boot'),
        );
      }
    } finally {
      setExporting(false);
    }
  }, [id, projectName, handleAuthError]);

  const selectedNode =
    selection?.kind === 'node'
      ? (nodes.find((node) => node.id === selection.id) ?? null)
      : null;
  const selectedEdge =
    selection?.kind === 'edge'
      ? (edges.find((edge) => edge.id === selection.id) ?? null)
      : null;

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-950">
      {/* Barra superior del editor */}
      <header className="z-20 flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/90 px-4 py-2.5 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700/70"
          >
            <ArrowLeft size={14} /> Dashboard
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-white">
              {projectName || 'Editor UML'}
            </h1>
            <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
              {loading ? (
                <>
                  <Loader2 size={11} className="animate-spin" /> Cargando…
                </>
              ) : saving ? (
                <>
                  <Loader2 size={11} className="animate-spin" /> Guardando…
                </>
              ) : savedAt ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Guardado {savedAt}
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                  Sin cambios guardados
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={addClass}
            icon={<Plus size={15} />}
          >
            <span className="hidden sm:inline">Agregar clase</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportSpring}
            loading={exporting}
            icon={!exporting && <Download size={15} />}
          >
            <span className="hidden md:inline">
              {exporting ? 'Generando…' : 'Exportar Spring Boot'}
            </span>
            <span className="md:hidden">Spring</span>
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            loading={saving}
            icon={!saving && <Save size={15} />}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </header>

      {error && (
        <div className="absolute top-16 left-1/2 z-30 flex -translate-x-1/2 items-start gap-2 rounded-lg border border-rose-900/60 bg-rose-950/90 px-3 py-2.5 text-sm text-rose-200 shadow-xl">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span className="max-w-xs">{error}</span>
        </div>
      )}

      {/* Lienzo */}
      <div className="relative flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: 'customEdge' }}
          onNodeClick={(_, node) => setSelection({ kind: 'node', id: node.id })}
          onEdgeClick={(_, edge) => setSelection({ kind: 'edge', id: edge.id })}
          onPaneClick={() => setSelection(null)}
          colorMode="dark"
          fitView
        >
          <Background color="#1e293b" gap={20} />
          <Controls />
        </ReactFlow>

        {selectedNode && (
          <Sidebar
            kind="node"
            data={selectedNode.data}
            onChange={updateSelectedNode}
            onClose={() => setSelection(null)}
          />
        )}

        {selectedEdge && (
          <Sidebar
            kind="edge"
            data={(selectedEdge.data ?? {}) as ClassEdgeData}
            onChange={updateSelectedEdge}
            onClose={() => setSelection(null)}
          />
        )}
      </div>
    </div>
  );
}
