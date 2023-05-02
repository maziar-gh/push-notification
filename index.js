require('dotenv').config({ path: 'variables.env' });

const express = require('express');
const webPush = require('web-push');
const bodyParser = require('body-parser');
const path = require('path');

var fs = require('fs');
var http = require('http');
var https = require('https');

const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017'; // Replace with your MongoDB connection URL
const dbName = 'pushnotifications'; // Replace with your database name

var pk  = fs.readFileSync(process.env.PRIVATE_KEY, 'utf8');
var cr = fs.readFileSync(process.env.FULL_CHAIN, 'utf8');
var credentials = {key: pk, cert: cr};

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client')));

const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

webPush.setVapidDetails('mailto:test@example.com', publicVapidKey, privateVapidKey);


// get client subscription config from db
const subscription = {
  endpoint: '',
  expirationTime: null,
  keys: {
      auth: '',
      p256dh: '',
  },
};

const payload = {
  notification: {
      title: 'Title',
      body: 'This is my body',
      icon: 'assets/icons/icon-384x384.png',
      actions: [
          { action: 'bar', title: 'Focus last' },
          { action: 'baz', title: 'Navigate last' },
      ],
      data: {
          onActionClick: {
              default: { operation: 'openWindow' },
              bar: {
                  operation: 'focusLastFocusedOrOpen',
                  url: '/signin',
              },
              baz: {
                  operation: 'navigateLastFocusedOrOpen',
                  url: '/signin',
              },
          },
      },
  },
};

const options = {
  vapidDetails: {
      subject: 'mailto:example_email@example.com',
      publicKey: process.env.PRIVATE_KEY,
      privateKey: process.env.FULL_CHAIN,
  },
  TTL: 60,
};


// Subscribe route
app.post('/subscribe', (req, res, next) => {

  const subscription = req.body;

  // send notification
  webPush.sendNotification(subscription, JSON.stringify(payload), options)
    .then((_) => {
        console.log('SENT!!!');
        console.log(_);
    })
    .catch((_) => {
        console.log(error => console.error(error));
    });


});




// (E) SEND TEST PUSH NOTIFICATION
app.post("/mypush", (req, res) => {
  res.status(201).json({}); // reply with 201 (created)

  const payload = JSON.stringify({
    title: 'from insomenia !!!',
  });

  webPush.sendNotification(subscription, payload)
    .catch(error => console.error(error));
});








var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

// app.set('port', process.env.PORT_HTTP || 5000);
// const server = app.listen(app.get('port'), () => {
//   console.log(`Express running → PORT ${server.address().port}`);
// });


httpServer.listen(process.env.PORT_HTTP || 8080, () => {
  console.log("httpServer is runing at port 8080");
});
httpsServer.listen(process.env.PORT_HTTPS || 5000, () => {
  console.log("httpsServer is runing at port 8443");
});
