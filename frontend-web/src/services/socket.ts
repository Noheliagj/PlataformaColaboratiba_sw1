import { io, Socket } from 'socket.io-client';
import type { Edge, Node } from '@xyflow/react';
import { API_URL } from './api';

/** Payload que viaja por el canal en tiempo real del diagrama (RF10). */
export interface DiagramUpdatePayload {
  nodes: Node[];
  edges: Edge[];
  fromUserId: string;
  fromUserName: string;
}

/** RF10: usuario conectado ahora mismo a la sala del proyecto. */
export interface PresenceUser {
  userId: string;
  userName: string;
}

export interface PresenceUpdatePayload {
  users: PresenceUser[];
}

/**
 * Abre la conexión al namespace `/diagram` del backend (equivalente al
 * tópico `/topic/diagram/{projectId}`, ver DiagramGateway) autenticada con
 * el mismo JWT que usa la API REST.
 */
export function connectDiagramSocket(): Socket {
  const token = localStorage.getItem('token');
  return io(`${API_URL}/diagram`, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
}
