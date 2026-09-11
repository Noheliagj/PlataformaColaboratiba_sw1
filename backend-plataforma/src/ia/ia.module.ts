import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { WebsocketsModule } from '../websockets/websockets.module';
import { IaController } from './ia.controller';
import { IaService } from './ia.service';

/** RF11: asistente de IA (function calling) sobre el diagrama relacional. */
@Module({
  imports: [AuthModule, ProjectsModule, WebsocketsModule],
  controllers: [IaController],
  providers: [IaService],
})
export class IaModule {}
