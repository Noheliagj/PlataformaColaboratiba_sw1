import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/jwt-payload.interface';
import { NotificationsService } from './notifications.service';
import { PushSubscriptionDto } from './dto/push-subscription.dto';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  // POST /notifications/push-subscription -> guarda la suscripción Web Push
  // del navegador actual para el usuario autenticado.
  @Post('push-subscription')
  savePushSubscription(
    @CurrentUser() user: AuthUser,
    @Body() dto: PushSubscriptionDto,
  ) {
    return this.notifications.saveSubscription(user.id, dto);
  }
}
