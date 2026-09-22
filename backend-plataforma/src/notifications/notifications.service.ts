import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import * as webpush from 'web-push';
import { Notification } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushSubscriptionDto } from './dto/push-subscription.dto';

export type NotificationType = 'MEMBER_JOINED' | 'DIAGRAM_SAVED';

interface NotifyOwnerInput {
  ownerId: string;
  projectId: string;
  type: NotificationType;
  message: string;
}

/**
 * Notificaciones push para el dueño de un proyecto (colaborador se unió o
 * guardó cambios). No conoce Socket.IO: emite un evento Node
 * (`EventEmitter`, sin dependencias nuevas) para que quien esté escuchando
 * (ver DiagramGateway) lo retransmita en vivo. Esto evita un ciclo de
 * módulos NestJS -- ProjectsModule necesita este servicio, y
 * WebsocketsModule ya importa ProjectsModule, así que este módulo no puede
 * depender de WebsocketsModule.
 *
 * Además persiste cada notificación (para un futuro historial) y la envía
 * por Web Push a las suscripciones guardadas del dueño, que es lo único que
 * llega aunque no tenga la app abierta.
 */
@Injectable()
export class NotificationsService extends EventEmitter {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly pushEnabled: boolean;

  constructor(private readonly prisma: PrismaService) {
    super();

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    this.pushEnabled = Boolean(publicKey && privateKey);
    if (this.pushEnabled) {
      webpush.setVapidDetails(
        'mailto:soporte@uml-studio.local',
        publicKey!,
        privateKey!,
      );
    } else {
      this.logger.warn(
        'VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY no configuradas: Web Push deshabilitado (las notificaciones in-app por socket siguen funcionando).',
      );
    }
  }

  async notifyOwner(input: NotifyOwnerInput): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: input.ownerId,
        projectId: input.projectId,
        type: input.type,
        message: input.message,
      },
    });

    // Quien esté suscrito (el gateway) la retransmite por socket al dueño
    // si tiene la app abierta ahora mismo.
    this.emit('notification', notification);

    await this.sendWebPush(input.ownerId, notification);

    return notification;
  }

  async saveSubscription(
    userId: string,
    dto: PushSubscriptionDto,
  ): Promise<{ id: string }> {
    const sub = await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
      },
      // El endpoint es la clave real; si ya existía (misma pestaña
      // re-suscribiéndose) solo aseguramos que quede del usuario actual.
      update: { userId, p256dh: dto.keys.p256dh, auth: dto.keys.auth },
    });
    return { id: sub.id };
  }

  private async sendWebPush(
    userId: string,
    notification: Notification,
  ): Promise<void> {
    if (!this.pushEnabled) return;

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });
    if (!subscriptions.length) return;

    const payload = JSON.stringify({
      title: 'UML Studio',
      body: notification.message,
    });

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload,
          );
        } catch (err) {
          const statusCode =
            err instanceof webpush.WebPushError ? err.statusCode : undefined;
          // 404/410: el navegador invalidó esa suscripción (desinstaló,
          // limpió datos, etc.) -- ya no sirve, se borra para no reintentar
          // por siempre.
          if (statusCode === 404 || statusCode === 410) {
            await this.prisma.pushSubscription.delete({
              where: { id: sub.id },
            });
          } else {
            this.logger.warn(
              `No se pudo enviar Web Push a la suscripción ${sub.id}: ${String(err)}`,
            );
          }
        }
      }),
    );
  }
}
