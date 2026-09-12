import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { WebsocketsModule } from '../websockets/websockets.module';
import { XmiController } from './xmi.controller';
import { XmiService } from './xmi.service';

/** RF12/RF13: exportación/importación XMI 2.1 sobre el diagrama relacional. */
@Module({
  imports: [AuthModule, ProjectsModule, WebsocketsModule],
  controllers: [XmiController],
  providers: [XmiService],
})
export class XmiModule {}
