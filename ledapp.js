require('dotenv').config();
const express = require('express');
const port = process.env.PORT || 3001;
const _ = require('lodash');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// STATUS LED
let status = [false, false];
// TOPIC
const LED_TOPIC = `/ESP/LED`;

// Create a MQTT Client
const mqtt = require('mqtt');
// Create a client connection to CloudMQTT for live data
const client = mqtt.connect('mqtt://m16.cloudmqtt.com', {
  username: 'benzintel',
  password: 'tam024685051',
  port: 16876
});

client.on('connect', function() { 
  // When connected
  console.log("Connected to CloudMQTT");

  client.subscribe('/ESP/LED', function() {
    // when a message arrives, do something with it
    client.on('message', function(topic, message, packet) {
      switch(topic) {
        case LED_TOPIC:
          messageFromBuffer = message.toString('utf8');
          if (messageFromBuffer != 'GET') {
            const splitStatus = messageFromBuffer.split(',');
            splitStatus.map((ele, index)=> {
              if (ele == 0) {
                status[index] = false;
              } else {
                status[index] = true;
              }
            });
          }

          // console.log(`Received '${message}' on '${topic}`);
        break;
        default:
          console.log(`Unknow Topic group`);
      }
    });
  });
});


app.get('/', async (req, res) => {
  mqttMessage(LED_TOPIC, 'GET');
  await new Promise(done => setTimeout(done, 2000));
  console.log(status);
  res.sendStatus(200);
});

app.post('/webhook', async (req, res) => {

  const message = req.body.events[0].message.text;
  const reply_token = req.body.events[0].replyToken;
  const TOKEN = `HeNOJnWy1GLWFZMU3Q/SR9+jAeM18+hBukabEQLuts+zzi4OkuNphFsb/eCDcVzC54bF22bjW+Zfr1kDjrpKsK3OJrlBY1qZYKyhInoWB7HL0bH+u/uRffNGER8i8qHcyfO3COACztFNNRcYf8Dx8QdB04t89/1O/w1cDnyilFU=`;
  const HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`
  };

  if (message == 'เปิดไฟ หน้าบ้าน' || message == 'ปิดไฟ หน้าบ้าน') {
    if (message == 'เปิดไฟ หน้าบ้าน') {
      mqttMessage(LED_TOPIC, 'LEDON_ONE');
    } else {
      mqttMessage(LED_TOPIC, 'LEDOFF_ONE');
    }
  }

  if (message == 'เปิดไฟ หลังบ้าน' || message == 'ปิดไฟ หลังบ้าน') {
    if (message == 'เปิดไฟ หลังบ้าน') {
      mqttMessage(LED_TOPIC, 'LEDON_TWO');
    } else {
      mqttMessage(LED_TOPIC, 'LEDOFF_TWO');
    }
  }

  if (message == 'สถานะทั้งหมด') {
    checkStatus();
  } else {
    checkStatus();
  }

  const body = JSON.stringify({
    replyToken: reply_token,
    messages: [
      {
        type: `text`,
        text: `อุณภูมิ ${status[0]} ${status[1]}`
      }
    ]
  });

  console.log(body);

  request({
    method: `POST`,
    url: 'https://api.line.me/v2/bot/message/reply',
    headers: HEADERS,
    body: body
  });

  res.sendStatus(200);
});

let mqttMessage = async (topic, message) => {
  client.publish(topic, message);
}

let checkStatus = async () => {
  mqttMessage(LED_TOPIC, 'GET');
  await new Promise(done => setTimeout(done, 2000));
}

app.listen(port, () => console.log(`Example app listening on port ${port}!`))