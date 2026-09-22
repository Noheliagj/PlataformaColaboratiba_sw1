/**
 * Cuerpo de POST /notifications/push-subscription.
 * Es la forma tal cual la produce `PushSubscription.toJSON()` en el navegador.
 */
export class PushSubscriptionDto {
  endpoint!: string;
  keys!: {
    p256dh: string;
    auth: string;
  };
}
