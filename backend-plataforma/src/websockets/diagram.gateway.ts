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
import { ProjectsService } from '../projects/projects.service';

interface JoinProjectPayload {
  projectId: string;
}

interface DiagramChangePayload {
  projectId: string;
  nodes: unknown[];
  edges: unknown[];
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

  handleDisconnect(socket: Socket): void {
    // Socket.IO abandona todas las rooms automáticamente al desconectar.
    this.logger.debug(`Cliente desconectado: ${socket.id}`);
  }

  /** El cliente entra a la room del proyecto tras validar acceso (RF4/RF10). */
  @SubscribeMessage('join-project')
  async onJoinProject(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: JoinProjectPayload,
  ): Promise<void> {
    const userId = socket.data.userId as string | undefined;
    if (!userId || !body?.projectId) return;

    try {
      await this.projects.getAccessibleOrThrow(userId, body.projectId);
    } catch {
      socket.emit('project-error', {
        message: 'No tienes acceso a este proyecto',
      });
      return;
    }

    await socket.join(this.room(body.projectId));
    socket.emit('joined-project', { projectId: body.projectId });
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
