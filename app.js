require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3001;
const _ = require('lodash');


// Create a MQTT Client
const mqtt = require('mqtt');
// Firebase init
const admin = require("firebase-admin");
// Fetch the service account key JSON file contents
let serviceAccount = require("./config/serviceAccountKey.json");
// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://nodemcu-a3f6b.firebaseio.com"
});

// As an admin, the app has access to read and write all data, regardless of Security Rules
const db = admin.database();
const ref = db.ref("temperature");

// Create a client connection to CloudMQTT for live data
const client = mqtt.connect('mqtt://m16.cloudmqtt.com', {
  username: 'benzintel',
  password: 'tam024685051',
  port: 16876
});

client.on('connect', function() { 
  // When connected
  console.log("Connected to CloudMQTT");
  // Subscribe to the temperature
  client.subscribe('/ESP/TEMP', function() {
  });

  client.subscribe('/ESP/RELAY', function() {
    // when a message arrives, do something with it
    client.on('message', function(topic, message, packet) {
      if (topic == '/ESP/RELAY') {
        let now = new Date().valueOf();
        if (message.indexOf('1_') > -1) {
          if (message == '1_ON') {
            let usersRef = db.ref("relay").update({ 1: true });
          } else {
            let usersRef = db.ref("relay").update({ 1: false });
          }
        }

        if (message.indexOf('2_') > -1) {
          if (message == '2_ON') {
            let usersRef = db.ref("relay").update({ 2: true });
          } else {
            let usersRef = db.ref("relay").update({ 2: false });
          }
        }
      }

      if (topic == '/ESP/TEMP') {
        let now = new Date().valueOf();
        let usersRef = db.ref("temperature").child(now);
        usersRef.set({
          topic: topic,
          temp:  parseFloat(message),
          createAt: new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Bangkok'
          }),
          timestamp: now
        });
      }

      console.log("Received '" + message + "' on '" + topic + "'");


    });
  });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))