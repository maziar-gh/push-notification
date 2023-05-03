require('dotenv').config({ path: 'variables.env' });

const express = require('express');
const webPush = require('web-push');
const bodyParser = require('body-parser');
const path = require('path');

var fs = require('fs');
var http = require('http');
var https = require('https');

if(process.env.CI_ENVIRONMENT != 'development'){
  var pk  = fs.readFileSync(process.env.PRIVATE_KEY, 'utf8');
  var cr = fs.readFileSync(process.env.FULL_CHAIN, 'utf8');
  var credentials = {key: pk, cert: cr};
}


const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client')));

const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

webPush.setVapidDetails('mailto:test@example.com', publicVapidKey, privateVapidKey);

const list = [];

//init mongodb
const mongoose = require('mongoose');
const { error } = require('console');


// get client subscription config from db
const subscription = {
  endpoint: '',
  expirationTime: null,
  keys: {
      auth: '',
      p256dh: '',
  },
};

// sample payload to response
const payload = {
  notification: {
      title: '! subscribe success !',
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


app.post('/subscribe', async (req, res) => {

  const response = {
    status: 'failure',
    message: 'you didn\'t pass valid parameters'
  };

  const { autentication_key, token } = req.body;
  if (!autentication_key || !token) {
    return res.json(response);
  }

  const user = new User({ autentication_key, token });

  user.save((err) => {
    if (err) {
      response.message = 'couldn\'t save user, duplicate entry?';
      return res.json(response);
    }

    response.status = 'success';
    response.message = 'user successfully saved';

    res.json(response);

    webPush.sendNotification(token, payload)
    .catch(error => console.error(error));
  });

  // const subscription = req.body

  // list.push(subscription);

  // res.status(201).json({});

  // create payload
  // const payload = JSON.stringify({
  //   title: 'Push notifications with Service Workers',
  // });
});




// (E) SEND TEST PUSH NOTIFICATION
app.post("/mypush", async (req, res) => {

  User.findOne({ autentication_key: req.params.autentication_key }, async (err, user) => {
    // if (!Expo.isExpoPushToken(user.token)) {
    //   return console.error(`Push token ${user.token} is not a valid Expo push token`);
    // }

    // const message = {
    //   to: user.token,
    //   sound: 'default',
    //   title: req.body.title,
    //   body: req.body.message,
    // };

    res.status(201).json({}); // reply with 201 (created)

    const payload = JSON.stringify({
      title: 'from insomenia !!!',
    });

    webPush.sendNotification(user.token, payload)
      .catch(error => console.error(error));

  });
  
  
});




mongoose.connect(process.env.DB_LOCATION)
.then(()=>{
  console.log('connect to mongo!');



  var httpServer = http.createServer(app);
  httpServer.listen(process.env.PORT_HTTP || 8080, () => {
    console.log("httpServer is runing at port 8080");
  });
  
  if(process.env.CI_ENVIRONMENT != 'development'){
    var httpsServer = https.createServer(credentials, app);
    httpsServer.listen(process.env.PORT_HTTPS || 8443, () => {
      console.log("httpsServer is runing at port 8443");
    });
  }
  
}).catch((error)=>{
  console.log(error);
})




// app.set('port', process.env.PORT_HTTP || 5000);
// const server = app.listen(app.get('port'), () => {
//   console.log(`Express running → PORT ${server.address().port}`);
// });




