const router = require('express').Router();
const { uuidv4, bcrypt, salt, success_response, fail_response } = require('../others/function');
const couchbase = require('couchbase');
const webPush = require('web-push');

const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY;
webPush.setVapidDetails('mailto:test@example.com', publicVapidKey, privateVapidKey);


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

  bucket              = cluster.bucket(process.env.COUCHBASE_BUCKETNAME);

  collection          = bucket.scope(process.env.COUCHBASE_SCOPE).collection(process.env.COUCHBASE_COLLECTION);
  collectionAdmins    = bucket.scope(process.env.COUCHBASE_SCOPE).collection(process.env.COUCHBASE_COLLECTION_ADMINS);
  collectionSites     = bucket.scope(process.env.COUCHBASE_SCOPE).collection(process.env.COUCHBASE_COLLECTION_SITES);
  collectionSession   = bucket.scope(process.env.COUCHBASE_SCOPE).collection(process.env.COUCHBASE_COLLECTION_SESSION);

  console.log('conncet to db');
}

connectCouchbase()



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
router.post("/admin/login", async (req, res) => {
  if (!req.body.email && !req.body.password) {
    return res.status(400).send(fail_response('An `email` and `password` are required'))
  } else if (!req.body.email || !req.body.password) {
    return res.status(400).send(fail_response(`A ${!req.body.email ? '`email`' : '`password`'} is required`))
  }

  await collectionAdmins.get(req.body.email)
    .then(async (result) => {

      if (!bcrypt.compareSync(req.body.password, result.value.password)) {
        return res.status(400).send(fail_response("Password invalid"))
      }
      const uuid_sessions = uuidv4();	
      var session = {
        "type": "session",
        "id": uuid_sessions,
        "pid": result.value.pid
      }
      await collectionSession.insert(uuid_sessions, session, { "expiry": 3600 })
        .then(() => res.send(success_response('login successfully', {session : uuid_sessions})))
        .catch(e => res.status(500).send(fail_response(e)))
    })
    .catch(e => res.status(404).send(fail_response('unable to login', e)))
})

//create admin
router.post("/admin/create", validate, async (req, res) => {
  const { email, password} = req.body;
    if (!email || !password) {
      return res.status(400).send(fail_response('you didn\'t pass valid parameters'))
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
        return res.status(400).send(fail_response('unable to save data', error));
      }
  
      res.status(200).send(success_response('insert successfully', {email: email} ));
    });
})

//show site 
router.get("/site/:pid", validate, async (req, res) => {
  try {
    await collectionSites.get(req.params.pid)
      .then((result) => res.send(success_response('site detail', result.value)))
      .catch((error) => res.status(404).send(fail_response(`KV Operation Failed: ${error.message}`, error)))
  } catch (error) {
    console.error(error)
  }
})

//create site
router.post("/site/create", validate, async (req, res) => {
  const { site_name, title, description, url, avatar } = req.body;
  if (!title || !description || !avatar || !url || !site_name) {
    return res.status(400).send(fail_response('you didn\'t pass valid parameters'));
  }

  const uuid_site = uuidv4();	
  //"pid": req.pid,
  const account = {
    "pid": uuid_site,
    "title": title,
    "description": description,
    "avatar": avatar,
    "url": url,
    "site_name": site_name
  };


  try {
    await collectionSites.insert(uuid_site, account)
      .then((result) => {
        return res.status(200).send('insert successfully', { pid : uuid_site})
      })
      .catch(async (e) => {
        return res.status(400).send(fail_response('exist this site', account))
      });
  } catch (error) {
    console.error(error)
  }
})

// send push notification by single user
router.post("/push/:auth_key", validate, async (req, res) => {
  if (!req.params.auth_key) {
    return res.status(400).send(fail_response('you didn\'t pass auth parameters'));
  }

  const { title, description, avatar, url, icon, site_uuid } = req.body;
  if (!title || !description || !avatar || !url || !icon || !site_uuid) {
    return res.status(400).send(fail_response('you didn\'t pass valid parameters'));
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
      res.status(404).send(fail_response('not found', error));
    }
    
    res.status(200).json(success_response('send push notification successfully', { auth_key: req.params.auth_key }))
  
    webPush.sendNotification(result.content.token, payload)
    .then()
    .catch(error => console.error('webPush: ',error));

  });
})


// send push notification by single user
router.post("/push_all_users/:auth_key", validate, async (req, res) => {
  if (!req.params.auth_key) {
    return res.status(400).send(fail_response('you didn\'t pass auth parameters'));
  }

  const { site_token, title, description, avatar, url, icon, site_uuid } = req.body;
  if ( !site_token || !title || !description || !avatar || !url || !icon || !site_uuid) {
    return res.status(400).send(fail_response('you didn\'t pass valid parameters'));
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



  collection.get(eq.params.auth_key, function(error, result){
    if(error){
      res.status(404).send(fail_response('not found', error));
    }
    
    res.status(200).json(success_response('send push notification successfully', { auth_key: req.params.auth_key }))
  
    webPush.sendNotification(result.content.token, payload)
    .then()
    .catch(error => console.error('webPush: ',error));

  });
})


const subscription = {
  endpoint: '',
  expirationTime: null,
  keys: {
      auth: '',
      p256dh: '',
  },
};

// subscribe user device
router.post('/subscribe', async (req, res) => {
  const response = {
    status: 'failure',
    message: 'you didn\'t pass valid parameters'
  };

  const { site_token, auth_key, token } = req.body;
  if (!site_token || !auth_key || !token) {
    return res.json(response);
  }

  const subscription = {
    site_token: site_token,
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
})



router.get("/show/:pid", async (req, res) => {

  res.status(200).send('');
})




module.exports = router;