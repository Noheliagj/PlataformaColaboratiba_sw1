import { useCallback, useEffect, useRef, useState } from 'react';
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
import type { Socket } from 'socket.io-client';
import { AlertCircle } from 'lucide-react';
import axios from 'axios';
import { ClassNode, type ClassNodeData } from '../components/ClassNode';
import { CustomEdge, type ClassEdgeData } from '../components/CustomEdge';
import { Sidebar } from '../components/Sidebar';
import { EditorHeader } from '../components/EditorHeader';
import { HistoryPanel } from '../components/HistoryPanel';
import { ChatIA } from '../components/ChatIA';
import {
  downloadSpringBootProject,
  getProject,
  saveProjectModel,
  type ProjectRole,
} from '../services/projects';
import { clearSession } from '../services/auth';
import { getErrorMessage } from '../services/http-error';
import {
  connectDiagramSocket,
  type DiagramUpdatePayload,
  type PresenceUpdatePayload,
  type PresenceUser,
} from '../services/socket';

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
  const [role, setRole] = useState<ProjectRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // RF10: colaboración en tiempo real vía WebSocket.
  const socketRef = useRef<Socket | null>(null);
  // true justo después de aplicar un cambio remoto: evita reenviarlo como
  // si fuera un cambio local (y así entrar en un eco infinito).
  const applyingRemoteRef = useRef(false);
  // true una vez que el diagrama inicial ya se cargó desde el backend:
  // evita emitir un "cambio" espurio en el primer render.
  const loadedRef = useRef(false);
  const [remoteEditor, setRemoteEditor] = useState<string | null>(null);
  const [presence, setPresence] = useState<PresenceUser[]>([]);

  // RF9: historial de guardados del diagrama.
  const [historyOpen, setHistoryOpen] = useState(false);

  // RF11: asistente de IA.
  const [assistantOpen, setAssistantOpen] = useState(false);

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
        setRole(project.role ?? 'OWNER');
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
        if (!cancelled) {
          setLoading(false);
          // A partir de aquí, cualquier cambio en nodes/edges es del usuario
          // (o remoto) y debe considerarse para el broadcast por WebSocket.
          loadedRef.current = true;
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, setNodes, setEdges, handleAuthError]);

  // RF10: conecta al canal /diagram del proyecto y aplica en vivo los
  // cambios que emitan otros colaboradores.
  useEffect(() => {
    if (!id) return;
    loadedRef.current = false; // se reactiva cuando `load()` termine arriba

    const socket = connectDiagramSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-project', { projectId: id });
    });

    socket.on('connect_error', () => {
      setError(
        'No se pudo conectar la colaboración en tiempo real. Los cambios se siguen guardando, pero no verás las ediciones de otros en vivo.',
      );
    });

    socket.on('project-error', () => {
      setError('No se pudo unir a la colaboración en tiempo real de este proyecto.');
    });

    // RF10: quién tiene el proyecto abierto ahora mismo.
    socket.on('presence-update', (payload: PresenceUpdatePayload) => {
      setPresence(payload.users);
    });

    socket.on('diagram-update', (payload: DiagramUpdatePayload) => {
      applyingRemoteRef.current = true;
      setNodes(payload.nodes as ClassFlowNode[]);
      setEdges(
        (payload.edges as Edge[]).map((edge) => ({
          ...edge,
          type: 'customEdge',
        })),
      );
      setRemoteEditor(payload.fromUserName);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setPresence([]);
    };
  }, [id, setNodes, setEdges]);

  // RF10: retransmite los cambios locales (nodos/aristas/atributos/métodos)
  // al resto de colaboradores conectados a este proyecto, con un pequeño
  // "debounce" para no saturar el socket durante un arrastre.
  useEffect(() => {
    if (applyingRemoteRef.current) {
      // Este cambio vino del propio broadcast remoto: no reenviarlo.
      applyingRemoteRef.current = false;
      return;
    }
    if (!loadedRef.current || !id) return;

    const timer = setTimeout(() => {
      socketRef.current?.emit('diagram-change', { projectId: id, nodes, edges });
    }, 250);
    return () => clearTimeout(timer);
  }, [nodes, edges, id]);

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

  // Oculta el aviso "X está editando…" a los pocos segundos.
  useEffect(() => {
    if (!remoteEditor) return;
    const timer = setTimeout(() => setRemoteEditor(null), 2500);
    return () => clearTimeout(timer);
  }, [remoteEditor]);

  const selectedNode =
    selection?.kind === 'node'
      ? (nodes.find((node) => node.id === selection.id) ?? null)
      : null;
  const selectedEdge =
    selection?.kind === 'edge'
      ? (edges.find((edge) => edge.id === selection.id) ?? null)
      : null;

  const statusMeta = loading
    ? { dot: 'bg-ink-faint', label: 'Cargando…', spin: true }
    : saving
      ? { dot: 'bg-ink-faint', label: 'Guardando…', spin: true }
      : savedAt
        ? { dot: 'bg-positive', label: `Guardado ${savedAt}`, spin: false }
        : { dot: 'bg-ink-faint', label: 'Sin cambios guardados', spin: false };

  return (
    <div className="fixed inset-0 flex flex-col bg-canvas">
      <EditorHeader
        projectName={projectName}
        role={role}
        statusMeta={statusMeta}
        remoteEditor={remoteEditor}
        presence={presence}
        exporting={exporting}
        saving={saving}
        onBack={() => navigate('/')}
        onAddClass={addClass}
        onExportSpring={handleExportSpring}
        onSave={handleSave}
        onOpenHistory={() => setHistoryOpen(true)}
        onToggleAssistant={() => setAssistantOpen((prev) => !prev)}
      />

      {id && (
        <HistoryPanel
          open={historyOpen}
          projectId={id}
          onClose={() => setHistoryOpen(false)}
        />
      )}

      {id && (
        <ChatIA
          open={assistantOpen}
          projectId={id}
          onClose={() => setAssistantOpen(false)}
        />
      )}

      {error && (
        <div className="animate-fade-rise absolute top-14 left-1/2 z-30 flex -translate-x-1/2 items-start gap-2 rounded-lg border border-critical/45 bg-critical-soft px-3 py-2.5 text-[13px] text-critical shadow-lg backdrop-blur-md">
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
          <Background color="#1b1c20" gap={22} size={1} />
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
