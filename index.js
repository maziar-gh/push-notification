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

// Establish a connection to MongoDB
MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
  if (err) {
    console.error('Error connecting to MongoDB:', err);
    return;
  }

  console.log('Connected to MongoDB');

  // Specify the database and collection
  const db = client.db(dbName);
  const subscriptionsCollection = db.collection('subscriptions');

  // Route to handle subscription requests
  app.post('/subscribe', (req, res) => {
    const subscription = req.body;

    // Save the subscription details in the database
    subscriptionsCollection.insertOne(subscription, (err, result) => {
      if (err) {
        console.error('Error saving subscription:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      res.status(201).json({ message: 'Subscription successful' });
    });
  });


    // Route to send push notifications
  app.post('/send-notification', (req, res) => {
    const notificationPayload = {
      title: 'New Notification',
      body: 'This is a push notification sent from your server',
    };

    // Fetch subscription details from the database
    subscriptionsCollection.find().toArray((err, subscriptions) => {
      if (err) {
        console.error('Error fetching subscriptions:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      // Send the push notifications to all subscriptions
      subscriptions.forEach(subscription => {
        webpush
          .sendNotification(subscription, JSON.stringify(notificationPayload))
          .catch(error => {
            console.error('Error sending notification:', error);
          });
      });

      res.status(200).json({ message: 'Notification sent' });
    });
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

});
