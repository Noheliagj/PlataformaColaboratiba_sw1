// Notificaciones push (dueño de proyecto): recibe el push que manda el
// backend (ver NotificationsService.sendWebPush) y lo muestra como
// notificación del sistema, aunque la pestaña de la app esté cerrada.
self.addEventListener('push', (event) => {
  let data = { title: 'UML Studio', body: 'Tienes actividad nueva' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.svg',
    }),
  );
});

// Al hacer clic en la notificación, enfoca una pestaña ya abierta de la app
// o abre una nueva en la raíz.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientsList) => {
      for (const client of clientsList) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow('/');
    }),
  );
});
