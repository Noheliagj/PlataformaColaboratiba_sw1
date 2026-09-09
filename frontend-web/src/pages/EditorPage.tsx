import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Background,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import type { Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft } from 'lucide-react';
import { ClassNode } from '../components/ClassNode';
import './editor.css';

// Fuera del componente para no recrear el objeto en cada render.
const nodeTypes = { classNode: ClassNode };

// Nodos de ejemplo solo para ver el lienzo; sin persistencia todavía.
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'classNode',
    position: { x: 120, y: 100 },
    data: {
      name: 'Usuario',
      attributes: ['- id: string', '- email: string'],
      methods: ['+ login(): void'],
    },
  },
  {
    id: '2',
    type: 'classNode',
    position: { x: 480, y: 260 },
    data: {
      name: 'Proyecto',
      attributes: ['- id: string', '- nombre: string'],
      methods: ['+ crear(): void', '+ eliminar(): void'],
    },
  },
];

const initialEdges: Edge[] = [];

/** RF4 - Lienzo de modelado de clases (pantalla completa). */
export function EditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const goBack = useCallback(() => navigate('/'), [navigate]);

  return (
    <div className="editor-page">
      <div className="editor-topbar">
        <button className="editor-back-btn" type="button" onClick={goBack}>
          <ArrowLeft size={14} /> Volver
        </button>
        <span className="editor-title">Editor · proyecto {id}</span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
