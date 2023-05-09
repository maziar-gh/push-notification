self.addEventListener('push', event => {
  const data = event.data.json();

  self.registration.showNotification(data.title, {
    body: data.description,
    icon: data.avatar,
    actions: [
        { action: 'open', title: 'Show' },
    ],
    data: {
        onActionClick: {
            default: { operation: 'openWindow' },
            open: {
                operation: 'focusLastFocusedOrOpen',
                url: data.url,
            },
        
        },
    },
  });
});
