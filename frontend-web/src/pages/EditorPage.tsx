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
import { Sidebar } from '../components/Sidebar';
import { getProject, saveProjectModel } from '../services/projects';
import { clearSession } from '../services/auth';
import { getErrorMessage } from '../services/http-error';
import './editor.css';

type ClassFlowNode = Node<ClassNodeData>;

// Fuera del componente para no recrear el objeto en cada render.
const nodeTypes = { classNode: ClassNode };

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
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
          setEdges((model.edges ?? []) as Edge[]);
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

  const onConnect = useCallback(
    (conn: Connection) => setEdges((eds) => addEdge(conn, eds)),
    [setEdges],
  );

  const addClass = useCallback(() => {
    setNodes((nds) => [...nds, createClassNode()]);
  }, [setNodes]);

  // RF6: los cambios del panel lateral se reflejan al instante en el nodo.
  const updateSelectedData = useCallback(
    (patch: Partial<ClassNodeData>) => {
      if (!selectedId) return;
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedId
            ? { ...node, data: { ...node.data, ...patch } }
            : node,
        ),
      );
    },
    [selectedId, setNodes],
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
      const cleanEdges = edges.map(({ id: eId, source, target }) => ({
        id: eId,
        source,
        target,
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

  const selectedNode = nodes.find((node) => node.id === selectedId) ?? null;

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
        onNodeClick={(_, node) => setSelectedId(node.id)}
        onPaneClick={() => setSelectedId(null)}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>

      {selectedNode && (
        <Sidebar
          data={selectedNode.data}
          onChange={updateSelectedData}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
