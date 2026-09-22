import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ProjectsModule } from '../projects/projects.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DiagramGateway } from './diagram.gateway';

/**
 * RF10: gateway de colaboración en tiempo real sobre el diagrama.
 * NotificationsModule para retransmitir por socket, al dueño conectado, las
 * notificaciones que dispara NotificationsService (ver DiagramGateway).
 */
@Module({
  imports: [AuthModule, UsersModule, ProjectsModule, NotificationsModule],
  providers: [DiagramGateway],
  // Se exporta para que IaModule (RF11) pueda retransmitir por WebSocket
  // los cambios que aplique el asistente de IA.
  exports: [DiagramGateway],
})
export class WebsocketsModule {}
