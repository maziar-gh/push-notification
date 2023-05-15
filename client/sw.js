var data = null;

self.addEventListener('push', event => {
  data = event.data.json();

  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon,
    image: data.image,
    badge: data.badge,
    dir: 'rtl',
    actions: [
        { action: 'open_url', title: 'مشاهده' },
    ],
    data: {
        onActionClick: {
            default: { operation: 'openWindow' },
            open_url: {
                operation: 'focusLastFocusedOrOpen',
                url: data.url,
            },
        
        },
    },
  });
});

self.addEventListener('notificationclick', (event) => {
  var url = data.url;


  //Listen to custom action buttons in push notification
  if (event.action === 'open_url') {
    event.waitUntil(
      clients.openWindow(url)
    );

  }

  event.notification.close(); //Close the notification

  //To open the app after clicking notification
  event.waitUntil(
    clients.matchAll({
      type: 'window'
    })
    .then((clients) => {
      for (var i = 0; i < clients.length; i++) {
        var client = clients[i];
        //If site is opened, focus to the site
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }

      //If site is cannot be opened, open in new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
    .catch((error) => {
      console.error(error);
    })
  );
});
