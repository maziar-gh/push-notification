require('dotenv').config({ path: 'variables.env' });

const path = require('path');

const express = require('express');
const pushRouter = require('./routes/push.route');

const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client')));
//app.use(express.urlencoded({ extended: true }));

app.use('/api/', pushRouter);

module.exports = app;