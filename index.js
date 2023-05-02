require('dotenv').config({ path: 'variables.env' });

const express = require('express');
const webPush = require('web-push');
const bodyParser = require('body-parser');
const path = require('path');

var fs = require('fs');
var http = require('http');
var https = require('https');

var pk  = fs.readFileSync(process.env.PRIVATE_KEY, 'utf8');
var cr = fs.readFileSync(process.env.FULL_CHAIN, 'utf8');
var credentials = {key: pk, cert: cr};

const app = express();

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'client')));

const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

webPush.setVapidDetails('mailto:test@example.com', publicVapidKey, privateVapidKey);

// Subscribe route

app.post('/subscribe', (req, res) => {
  const subscription = req.body

  res.status(201).json({});

  // create payload
  const payload = JSON.stringify({
    title: 'Push notifications with Service Workers',
  });

  webPush.sendNotification(subscription, payload)
    .catch(error => console.error(error));
});

// (E) SEND TEST PUSH NOTIFICATION
app.post("/mypush", (req, res) => {
  res.status(201).json({}); // reply with 201 (created)

  webPush.sendNotification(subscription, JSON.stringify({
    title: "Welcome!",
    body: "Yes, it works!",
    icon: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
    image: "https://www.simplilearn.com/ice9/free_resources_article_thumb/what_is_image_Processing.jpg",
    badge:"https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
    actions: [
        {
          action: 'link',
          type: 'button',
          title: 'show',
          icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        },
      ],
  }))
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
