require('dotenv').config();
const request = require('request');
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
            if (splitStatus.length > 0) {
              splitStatus.map((ele, index)=> {
                console.log(`DOIT ${ele} ${index} ${parseInt(ele)}`);
                if (ele == 0) {
                  status[index] = false;
                } else {
                  status[index] = true;
                }
              });
            }
          }

          console.log(`Received '${message}' on '${topic}`);
        break;
        default:
          console.log(`Unknow Topic group`);
      }
    });
  });
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
      await mqttMessage(LED_TOPIC, 'LEDON_ONE');
    } else {
      await mqttMessage(LED_TOPIC, 'LEDOFF_ONE');
    }
  }

  if (message == 'เปิดไฟ หลังบ้าน' || message == 'ปิดไฟ หลังบ้าน') {
    if (message == 'เปิดไฟ หลังบ้าน') {
      await mqttMessage(LED_TOPIC, 'LEDON_TWO');
    } else {
      await mqttMessage(LED_TOPIC, 'LEDOFF_TWO');
    }
  }

  mqttMessage(LED_TOPIC, 'GET');

  if (message == 'สถานะทั้งหมด') {
    await checkStatus();
  } else {
    await checkStatus();
  }

  console.log(status);
  const objectMessage = genFlexMessage(status[0], status[1]);

  const body = JSON.stringify({
    replyToken: reply_token,
    messages: [
      objectMessage
    ]
  });

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
  await checkStatus();
}

let checkStatus = async () => {
  await new Promise(done => setTimeout(done, 3000));
}

let genFlexMessage = (ledOne, ledTwo) => {
  return {
    "type": "flex",
    "altText": "สถานะระบบไฟ",
    "contents": {
      "type": "bubble",
      "hero": {
        "type": "image",
        "url": "https://www.ihome108.com/wp-content/uploads/2017/05/home-slide-01.jpg",
        "size": "full",
        "aspectRatio": "20:13",
        "aspectMode": "cover",
        "action": {
          "type": "uri",
          "label": "Line",
          "uri": "https://linecorp.com/"
        }
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "text",
            "text": "ระบบไฟ",
            "flex": 0,
            "size": "xl",
            "weight": "bold"
          },
          {
            "type": "box",
            "layout": "horizontal",
            "flex": 1,
            "margin": "md",
            "contents": [
              {
                "type": "text",
                "text": "ไฟหน้าบ้าน",
                "align": "start",
                "gravity": "top",
                "weight": "bold"
              },
              {
                "type": "text",
                "text": (ledOne == true) ? "Open" : "Close",
                "align": "start",
                "weight": "bold",
                "color": (ledOne == true) ? "#FF0000" : "#000000",
              }
            ]
          },
          {
            "type": "box",
            "layout": "horizontal",
            "flex": 1,
            "margin": "md",
            "contents": [
              {
                "type": "text",
                "text": "ไฟหลังบ้าน",
                "align": "start",
                "gravity": "top",
                "weight": "bold"
              },
              {
                "type": "text",
                "text": (ledTwo == true) ? "Open" : "Close",
                "align": "start",
                "weight": "bold",
                "color": (ledTwo == true) ? "#FF0000" : "#000000",
              }
            ]
          }
        ]
      },
      "footer": {
        "type": "box",
        "layout": "vertical",
        "flex": 0,
        "spacing": "sm",
        "contents": [
          {
            "type": "button",
            "action": {
              "type": "message",
              "label": `${(ledOne == true) ? "ปิดไฟ" : "เปิดไฟ"}หน้าบ้าน`,
              "text": `${(ledOne == true) ? "ปิดไฟ" : "เปิดไฟ"} หน้าบ้าน`
            },
            "height": "sm",
            "style": "link"
          },
          {
            "type": "button",
            "action": {
              "type": "message",
              "label": `${(ledTwo == true) ? "ปิดไฟ" : "เปิดไฟ"}หลังบ้าน`,
              "text": `${(ledTwo == true) ? "ปิดไฟ" : "เปิดไฟ"} หลังบ้าน`
            },
            "height": "sm",
            "style": "link"
          },
          {
            "type": "spacer",
            "size": "sm"
          }
        ]
      }
    }
  };
}

app.listen(port, () => console.log(`Example app listening on port ${port}!`))