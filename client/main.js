function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const publicVapidKey = 'BD8MxjivtE1WADo6cg8UNkUegkXHaZAdny8j2Ys16YgXAsAuoYredTCldmdDq9hd7zwe7high0JXtmZFaJfVAgI';

const triggerPush = document.querySelector('.trigger-push');

async function triggerPushNotification() {
  if ('serviceWorker' in navigator) {
    const register = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('waiting for acceptance');
    const subscription = await register.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
    });
    console.log('acceptance complete');

    await fetch('/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        auth_key: 'autentication_key',
        token: subscription
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } else {
    console.error('Service workers are not supported in this browser');
  }
}

triggerPush.addEventListener('click', () => {
  triggerPushNotification().catch(error => console.error(error));
});



function notifyMe() {

  console.log('notifyMe');
  
  try {
    Notification.requestPermission()
        .then(() => doSomething())                                                                                                                                               
  } catch (error) {
      // Safari doesn't return a promise for requestPermissions and it                                                                                                                                       
      // throws a TypeError. It takes a callback as the first argument                                                                                                                                       
      // instead.
      if (error instanceof TypeError) {
          Notification.requestPermission(() => {                                                                                                                                                             
              doSomething();
          });
      } else {
          throw error;                                                                                                                                                                                       
      }                                                                                                                                                                                                      
  }    
}

var checkSafariPermission = function (permissionData)
{
    if (permissionData.permission === 'default')
    {
        window.safari.pushNotification.requestPermission(
            'https://mywebsite.com',
            'web.com.mywebsite',
            {},
            checkSafariPermission
        );
    } else if (permissionData.permission === 'denied')
    {
        console.log('denied');
    } else if (permissionData.permission === 'granted')
    {
        // This is never triggered!
        console.log('Device token: ' + permissionData.deviceToken);
    }
};


const requestNotificationPermission = async () => {
  const permission = await window.Notification.requestPermission();
  // value of permission can be 'granted', 'default', 'denied'
  // granted: user has accepted the request
  // default: user has dismissed the notification permission popup by clicking on x
  // denied: user has denied the request.
  if(permission !== 'granted'){
      throw new Error('Permission not granted for Notification');
  }
  triggerPushNotification().catch(error => console.error(error));
}

const main = async () => {
  //const permission =  await requestNotificationPermission();
  //notifyMe();

  var permissionData = window.safari.pushNotification.permission('web.com.mywebsite');
  checkSafariPermission(permissionData);
}

main();
