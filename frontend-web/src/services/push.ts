import { api } from './api';

/**
 * Notificaciones push (dueño de proyecto): registra el service worker y
 * suscribe este navegador a Web Push, para que le lleguen los avisos de
 * "colaborador se unió" / "cambios guardados" aunque no tenga la pestaña
 * abierta. Ver DiagramGateway (evento `notification`) para la versión en
 * vivo mientras sí la tiene abierta.
 */

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Idempotente: si ya hay una suscripción activa la reutiliza (y la vuelve a
 * mandar al backend, por si el registro anterior se perdió); si no, pide
 * permiso al usuario y crea una. No lanza si el usuario niega el permiso o
 * el navegador no soporta push -- esto es un "nice to have", no debe romper
 * el editor.
 */
export async function ensurePushSubscription(): Promise<void> {
  if (!isPushSupported()) return;

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as
    | string
    | undefined;
  if (!vapidPublicKey) return;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });
    }

    await api.post('/notifications/push-subscription', subscription.toJSON());
  } catch (err) {
    // Permiso denegado, navegador sin soporte real, etc.: no es crítico.
    console.warn('No se pudo activar las notificaciones push', err);
  }
}
