import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { UsersService } from '../users/users.service';
import { DiagramModel, ProjectsService } from '../projects/projects.service';

interface JoinProjectPayload {
  projectId: string;
}

interface DiagramChangePayload {
  projectId: string;
  nodes: unknown[];
  edges: unknown[];
}

/** Chat en tiempo real: mensaje entrante del cliente (evento `send-message`). */
interface SendMessagePayload {
  projectId: string;
  content: string;
}

/** RF10: quién está conectado ahora mismo a la sala de un proyecto. */
interface PresenceUser {
  userId: string;
  userName: string;
}

/**
 * RF10: colaboración en tiempo real sobre el diagrama.
 *
 * Cada proyecto es una "room" de Socket.IO (`diagram:{projectId}`) dentro
 * del namespace `/diagram` — el equivalente, sin agregar un broker externo
 * (regla 2/3 de CONTEXT.md), a publicar/suscribir en un tópico
 * `/topic/diagram/{projectId}`: todo cliente unido a la room recibe los
 * cambios que emiten los demás.
 *
 * El gateway NO persiste el diagrama: solo reenvía el cambio en vivo. El
 * guardado real sigue pasando por `PUT /projects/:id/model` (RF5/RF9), tal
 * como ya lo hace el botón "Guardar" del editor.
 *
 * También lleva la presencia (quién está conectado a cada proyecto ahora
 * mismo) en un mapa en memoria — un solo proceso Node, sin Redis ni
 * adaptador externo (no hace falta para el alcance de este proyecto).
 */
@WebSocketGateway({
  namespace: '/diagram',
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class DiagramGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(DiagramGateway.name);

  // projectId -> (socketId -> usuario). Un mismo usuario puede aparecer más
  // de una vez si tiene el proyecto abierto en dos pestañas/dispositivos.
  private readonly presenceByProject = new Map<
    string,
    Map<string, PresenceUser>
  >();

  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersService,
    private readonly projects: ProjectsService,
  ) {}

  /**
   * Autentica el handshake con el mismo JWT que usa la API REST (RF2), como
   * middleware de Socket.IO: se ejecuta y se espera (`await`) ANTES de que
   * el servidor dispare "connection" y el cliente reciba "connect". Si se
   * hiciera en `handleConnection` (que también es async) habría una carrera:
   * el cliente podría emitir "join-project" antes de que `socket.data.userId`
   * quedara asignado, y el mensaje se perdería en silencio.
   */
  afterInit(server: Server): void {
    server.use((socket: Socket, next: (err?: Error) => void) => {
      void (async () => {
        try {
          const token = this.extractToken(socket);
          if (!token) throw new Error('Falta el token');

          const payload = this.jwt.verify<JwtPayload>(token);
          const user = await this.users.findById(payload.sub);
          if (!user) throw new Error('Usuario no encontrado');

          socket.data.userId = user.id;
          socket.data.userName = user.name;
          next();
        } catch {
          next(new Error('No autorizado'));
        }
      })();
    });
  }

  /** RF10: al desconectar, sale de la presencia del proyecto que tenía abierto. */
  handleDisconnect(socket: Socket): void {
    const projectId = socket.data.projectId as string | undefined;
    if (!projectId) return;

    const room = this.presenceByProject.get(projectId);
    room?.delete(socket.id);
    if (room && room.size === 0) this.presenceByProject.delete(projectId);

    this.broadcastPresence(projectId);
  }

  /** El cliente entra a la room del proyecto tras validar acceso (RF4/RF10). */
  @SubscribeMessage('join-project')
  async onJoinProject(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: JoinProjectPayload,
  ): Promise<void> {
    const userId = socket.data.userId as string | undefined;
    const userName = socket.data.userName as string | undefined;
    if (!userId || !userName || !body?.projectId) return;

    try {
      await this.projects.getAccessibleOrThrow(userId, body.projectId);
    } catch {
      socket.emit('project-error', {
        message: 'No tienes acceso a este proyecto',
      });
      return;
    }

    socket.data.projectId = body.projectId;
    await socket.join(this.room(body.projectId));

    if (!this.presenceByProject.has(body.projectId)) {
      this.presenceByProject.set(body.projectId, new Map());
    }
    this.presenceByProject
      .get(body.projectId)!
      .set(socket.id, { userId, userName });

    socket.emit('joined-project', { projectId: body.projectId });
    this.broadcastPresence(body.projectId);
  }

  /**
   * Reenvía nodos/aristas/atributos/métodos cambiados al resto de la sala.
   * No incluye al emisor (`socket.to`, no `server.to`) para que cada cliente
   * no reciba de vuelta su propio cambio.
   */
  @SubscribeMessage('diagram-change')
  onDiagramChange(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: DiagramChangePayload,
  ): void {
    if (!body?.projectId) return;
    socket.to(this.room(body.projectId)).emit('diagram-update', {
      nodes: body.nodes,
      edges: body.edges,
      fromUserId: socket.data.userId,
      fromUserName: socket.data.userName,
    });
  }

  /**
   * Chat en tiempo real: persiste el mensaje (para el historial de
   * GET /projects/:id/messages) y lo retransmite a toda la sala, incluido
   * quien lo envió (`server.to`, no `socket.to`) para que todos los
   * clientes pinten el mensaje a partir del mismo evento, con el `id` y el
   * `createdAt` que le asignó la base de datos.
   */
  @SubscribeMessage('send-message')
  async onSendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: SendMessagePayload,
  ): Promise<void> {
    const userId = socket.data.userId as string | undefined;
    const userName = socket.data.userName as string | undefined;
    const projectId = socket.data.projectId as string | undefined;
    const content = body?.content?.trim();
    // Exige haberse unido primero a la room (join-project) con ESTE
    // projectId: evita que un socket mande mensajes a un proyecto distinto
    // del que ya validó, sin pagar otra consulta de acceso por mensaje.
    if (!userId || !userName || !projectId || projectId !== body?.projectId) {
      return;
    }
    if (!content) return;

    try {
      const message = await this.projects.createChatMessage(
        userId,
        projectId,
        content,
      );
      this.server.to(this.room(projectId)).emit('chat-message', message);
    } catch {
      socket.emit('project-error', {
        message: 'No se pudo enviar el mensaje',
      });
    }
  }

  /**
   * RF11: el asistente de IA (src/ia) llama esto tras aplicar un cambio, para
   * que se vea en vivo en el lienzo de todos los que tienen el proyecto
   * abierto — incluido quien le escribió al asistente, ya que el cambio no
   * vino de ningún socket suyo (a diferencia de `diagram-change`, acá se usa
   * `server.to` y no `socket.to`: no hay emisor al que excluir).
   */
  broadcastDiagramUpdate(
    projectId: string,
    model: DiagramModel,
    from: { userId: string; userName: string },
  ): void {
    this.server.to(this.room(projectId)).emit('diagram-update', {
      nodes: model.nodes,
      edges: model.edges,
      fromUserId: from.userId,
      fromUserName: from.userName,
    });
  }

  /** RF10: emite a toda la sala quién está conectado ahora mismo (sin duplicar por usuario). */
  private broadcastPresence(projectId: string): void {
    const room = this.presenceByProject.get(projectId);
    const byUserId = new Map<string, PresenceUser>();
    for (const user of room?.values() ?? []) {
      byUserId.set(user.userId, user);
    }
    this.server.to(this.room(projectId)).emit('presence-update', {
      users: [...byUserId.values()],
    });
  }

  private room(projectId: string): string {
    return `diagram:${projectId}`;
  }

  private extractToken(socket: Socket): string | null {
    const fromAuth = socket.handshake.auth?.token as string | undefined;
    if (fromAuth) return fromAuth;
    const header = socket.handshake.headers.authorization;
    if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length);
    return null;
  }
}
