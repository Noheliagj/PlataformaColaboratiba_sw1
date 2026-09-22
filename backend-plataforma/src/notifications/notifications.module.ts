import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

/**
 * Notificaciones push para el dueño de un proyecto. Módulo hoja a
 * propósito (solo depende de AuthModule para el guard) para que tanto
 * ProjectsModule (dispara notificaciones) como WebsocketsModule (las
 * retransmite en vivo) puedan importarlo sin crear un ciclo.
 */
@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
