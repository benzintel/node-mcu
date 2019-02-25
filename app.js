// Create a MQTT Client
const mqtt = require('mqtt');

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

client.on('connect', function() { // When connected
    console.log("Connected to CloudMQTT");
  // Subscribe to the temperature
  client.subscribe('/ESP/TEMP', function() {
    // when a message arrives, do something with it
    client.on('message', function(topic, message, packet) {
    	let now = new Date().valueOf();
    	let usersRef = ref.child(now);
			usersRef.set({
				topic: topic,
				temp: parseFloat(message),
				createAt: new Date().toLocaleString(),
				timestamp: now
			});
      console.log("Received '" + message + "' on '" + topic + "'");
    });
  });
});