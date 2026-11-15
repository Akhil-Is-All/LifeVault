self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      (windowClients) => {
        const lifeVaultClient = windowClients.find((client) => {
          return new URL(client.url).origin === self.location.origin;
        });

        if (lifeVaultClient) {
          return lifeVaultClient.focus();
        }

        return self.clients.openWindow(`${self.location.origin}/`);
      }
    )
  );
});

importScripts(
  "https://www.gstatic.com/firebasejs/13.2.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/13.2.0/firebase-messaging-compat.js"
);

firebase.initializeApp(__LIFEvault_FIREBASE_CONFIG__);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  if (payload.notification) {
    return;
  }

  const title = payload.data?.title || "LifeVault reminder";
  const body = payload.data?.body || "You have a reminder due.";

  return self.registration.showNotification(title, {
    body,
    icon: "/favicon.svg",
    data: { url: "/" },
  });
});
