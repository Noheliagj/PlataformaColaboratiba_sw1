import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ProjectsModule } from '../projects/projects.module';
import { DiagramGateway } from './diagram.gateway';

/** RF10: gateway de colaboración en tiempo real sobre el diagrama. */
@Module({
  imports: [AuthModule, UsersModule, ProjectsModule],
  providers: [DiagramGateway],
  // Se exporta para que IaModule (RF11) pueda retransmitir por WebSocket
  // los cambios que aplique el asistente de IA.
  exports: [DiagramGateway],
})
export class WebsocketsModule {}
