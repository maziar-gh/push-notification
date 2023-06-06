require('dotenv').config({ path: 'variables.env' });

const express = require('express');
const webPush = require('web-push');
const bodyParser = require('body-parser');
const path = require('path');
const { error } = require('console');
const couchbase = require('couchbase')

const { 
  v1: uuidv1,
  v4: uuidv4,
} = require('uuid');
const bcrypt = require('bcryptjs')
const salt = bcrypt.genSaltSync(10);

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




const validate = async(request, response, next) => {
  const authHeader = request.headers["authorization"]
  if (authHeader) {
    bearerToken = authHeader.split(" ")
    if (bearerToken.length == 2) {
      await collectionSession.get(bearerToken[1])
        .then(async(result) => {
          request.pid = result.value.pid
          await collectionSession.touch(bearerToken[1], 3600)
            .then(() => next())
            .catch((e) => console.error(e.message))
        })
        .catch((e) => response.status(401).send({ "message": "Invalid session token" }))
    }
  } else {
    response.status(401).send({ "message": "An authorization header is required" })
  }
}



//login admins
app.post("/admin/login", async (request, response) => {
  if (!request.body.email && !request.body.password) {
    return response.status(401).send({ "message": "An `email` and `password` are required" })
  } else if (!request.body.email || !request.body.password) {
    return response.status(401).send({ 
      "message": `A ${!request.body.email ? '`email`' : '`password`'} is required`
    })
  }

  await collectionAdmins.get(request.body.email)
    .then(async (result) => {

      if (!bcrypt.compareSync(request.body.password, result.value.password)) {
        return response.status(500).send({ "message": "Password invalid" })
      }
      const uuid_sessions = uuidv4();	
      var session = {
        "type": "session",
        "id": uuid_sessions,
        "pid": result.value.pid
      }
      await collectionSession.insert(uuid_sessions, session, { "expiry": 3600 })
        .then(() => response.send({ "sid": uuid_sessions }))
        .catch(e => response.status(500).send(e))
    })
    .catch(e => response.status(500).send(e))
})


//create admin
app.post("/admin/create", async (req, res) => {

  var response = {
    status: 'failure',
    message: 'you didn\'t pass valid parameters'
  };

  const { email, password} = req.body;
  if (!email || !password) {
    return res.json(response);
  }

  const uuid_admin = uuidv4();	
  const admins = {
    "type": "session",
    "pid": uuid_admin,
    "email": email,
    "password": bcrypt.hashSync(password, salt)
  };

  var response = {
    status: 'true',
    message: 'insert successfully!',
    data: {
      email: email
    }
  };

  await collectionAdmins.insert(email, admins,function(error, result){
    if(error){
      return res.status(400).send(error);
    }

    res.status(200).send(response);
  });

});


//create site
app.post("/site/create", validate, async (req, res) => {

  var response = {
    status: 'failure',
    message: 'you didn\'t pass valid parameters'
  };

  const { site_name, title, description, url, avatar } = req.body;
  if (!title || !description || !avatar || !url || !site_name) {
    return res.json(response);
  }

  const account = {
    "pid": req.pid,
    "title": title,
    "description": description,
    "avatar": avatar,
    "url": url,
    "site_name": site_name
  };

  var response = {
    status: 'true',
    message: 'insert successfully!',
    data: {
      auth_key: req.pid
    }
  };

  await collectionSites.insert(req.pid, account,function(error, result){
    if(error){
      return res.status(400).send(error);
    }

    res.status(200).send(response);
  });

});





// send push notification
app.post("/push/:auth_key", validate, async (req, res) => {

  const response = {
    status: 'failure',
    message: 'you didn\'t pass valid parameters'
  };

  if (!req.params.auth_key) {
    return res.json(response);
  }

  const { title, description, avatar, url, icon, site_uuid } = req.body;
  if (!title || !description || !avatar || !url || !icon || !site_uuid) {
    return res.json(response);
  }

  const payload = JSON.stringify({
      title: title,
      body: description,
      icon: icon,
      image: avatar,
      badge: icon,
      url: url,
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
});





connectCouchbase()
  .catch((err) => {
    console.log('Couchbase ERR:', err)
    process.exit(1)
  })
  .then(() => {

    if(process.env.CI_ENVIRONMENT == 'production'){
      var httpsServer = https.createServer(credentials, app);
      httpsServer.listen(process.env.PORT_HTTPS || 8443, () => {
        console.log("httpsServer is runing at port 8443 (production)");
      });
    }else{
      var httpServer = http.createServer(app);
      httpServer.listen(process.env.PORT_HTTP || 8080, () => {
        console.log("httpServer is runing at port 8080 (development)");
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
  collectionAdmins  = bucket.scope(process.env.COUCHBASE_SCOPE).collection(process.env.COUCHBASE_COLLECTION_ADMINS);
  collectionSites  = bucket.scope(process.env.COUCHBASE_SCOPE).collection(process.env.COUCHBASE_COLLECTION_SITES);
  collectionSession  = bucket.scope(process.env.COUCHBASE_SCOPE).collection(process.env.COUCHBASE_COLLECTION_SESSION);
}