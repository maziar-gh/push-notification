require('dotenv').config({ path: 'variables.env' });

const express = require('express');
const webPush = require('web-push');
const bodyParser = require('body-parser');
const path = require('path');
const { error } = require('console');
const couchbase = require('couchbase')

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


var bucket = null;
var collection = null;

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
const payload = JSON.stringify({
      title: '! subscribe success !',
      body: 'This is my body',
      icon: 'assets/icons/icon-384x384.png',
      actions: [
          { action: 'bar', title: 'Focus last' },
      ],
      data: {
          onActionClick: {
              default: { operation: 'openWindow' },
              bar: {
                  operation: 'focusLastFocusedOrOpen',
                  url: '/signin',
              },
             
          },
      },
});

// const options = {
//   vapidDetails: {
//       subject: 'mailto:example_email@example.com',
//       publicKey: process.env.PRIVATE_KEY,
//       privateKey: process.env.FULL_CHAIN,
//   },
//   TTL: 60,
// };


app.post('/subscribe', async (req, res) => {

  const response = {
    status: 'failure',
    message: 'you didn\'t pass valid parameters'
  };

  const { auth_key, token } = req.body;
  if (!auth_key || !token) {
    return res.json(response);
  }

  const subscription = {
    auth_key: auth_key,
    token: token,
  };


  await collection.upsert(auth_key, subscription,function(error, result){
    if(error){
      return res.status(400).send(error);
    }

    res.status(200).send(result);

    //welcome message
    //  webPush.sendNotification(token, payload)
    //   .catch(error => console.error(error));
    
  });

  

  // const subscription = req.body
  // list.push(subscription);
  // res.status(201).json({});
  // create payload
  // const payload = JSON.stringify({
  //   title: 'Push notifications with Service Workers',
  // });
});




// send push notification
app.post("/push/:auth_key", async (req, res) => {

  const response = {
    status: 'failure',
    message: 'you didn\'t pass valid parameters'
  };

  const { title, description, avatar, url } = req.body;
  if (!title || !description || !avatar || !url) {
    return res.json(response);
  }


  const payload = JSON.stringify({

      title: title,
      body: description,
      icon: avatar,
      actions: [
          { action: 'open', title: 'Show' },
      ],
      data: {
          onActionClick: {
              default: { operation: 'openWindow' },
              open: {
                  operation: 'focusLastFocusedOrOpen',
                  url: url,
              },
          
          },
      },
  
  });




  collection.get(req.params.auth_key, function(error, result){
    if(error){
      return res.status(400).send(error);
    }
    
    const response = {
      status: 'true',
      message: 'send push notification successfully',
      data: {
        auth_key: req.params.auth_key
      }
    };
  
    res.status(200).json(response)
  
    webPush.sendNotification(result.content.token, payload)
      .catch(error => console.error(error));

      

  });
});



connectCouchbase()
  .catch((err) => {
    console.log('ERR:', err)
    process.exit(1)
  })
  .then(() => {

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

  })





async function connectCouchbase() {
  var timeObject = new Date();
  var seconds = timeObject.getSeconds() + 10;

  const cluster = await couchbase.connect(process.env.COUCHBASE_SERVER, {
    username: process.env.COUCHBASE_USERNAME,
    password: process.env.COUCHBASE_PASSWORD,
    ConnectTimeout: 95 * seconds,
    QueryTimeout:   95 * seconds,
    SearchTimeout:  95 * seconds,
  });
  bucket      = cluster.bucket(process.env.COUCHBASE_BUCKETNAME);
  collection  = bucket.scope(process.env.COUCHBASE_SCOPE).collection(process.env.COUCHBASE_COLLECTION);
}