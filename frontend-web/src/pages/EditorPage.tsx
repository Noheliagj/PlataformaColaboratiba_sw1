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
import { ArrowLeft, Plus, Save } from 'lucide-react';
import axios from 'axios';
import { ClassNode, type ClassNodeData } from '../components/ClassNode';
import { CustomEdge, type ClassEdgeData } from '../components/CustomEdge';
import { Sidebar } from '../components/Sidebar';
import { getProject, saveProjectModel } from '../services/projects';
import { clearSession } from '../services/auth';
import { getErrorMessage } from '../services/http-error';
import './editor.css';

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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
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

  const selectedNode =
    selection?.kind === 'node'
      ? (nodes.find((node) => node.id === selection.id) ?? null)
      : null;
  const selectedEdge =
    selection?.kind === 'edge'
      ? (edges.find((edge) => edge.id === selection.id) ?? null)
      : null;

  return (
    <div className="editor-page">
      <div className="editor-topbar">
        <button
          className="editor-back-btn"
          type="button"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={14} /> Volver
        </button>
        <span className="editor-title">
          Editor · proyecto {id}
          {loading && ' · cargando…'}
          {!loading && !saving && savedAt && ` · guardado ${savedAt}`}
        </span>
      </div>

      <div className="editor-toolbar">
        <button type="button" className="editor-fab" onClick={addClass}>
          <Plus size={15} /> Agregar Clase
        </button>
        <button
          type="button"
          className="editor-fab primary"
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={15} /> {saving ? 'Guardando…' : 'Guardar Diagrama'}
        </button>
      </div>

      {error && <div className="editor-error">{error}</div>}

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
        fitView
      >
        <Background />
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
  );
}
