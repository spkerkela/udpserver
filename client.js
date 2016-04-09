const B = require('baconjs');
const PORT = 33333;
const HOST = 'localhost';

const updater = B.repeatedly(16, ['update'])

const dgram = require('dgram');

const client = dgram.createSocket('udp4');

var lastCommFromServer = process.hrtime();
var keepUpdating = true;
var myPos =  {};

function send(msg) {
  const message = new Buffer(msg);
  client.send(message, 0, message.length, PORT, HOST, (err, bytes) => {
    if(err) throw err;
    console.log('UDP message sent to ' + HOST + ':' + PORT + ':' + msg);
  });
}

client.on('message', (message, remote) => {
  var strMessage = message.toString();
  if(strMessage === 'ping') {
    lastCommFromServer = process.hrtime();
    send('pong');
  } else {
    myPos = JSON.parse(strMessage);
    console.log(myPos);
  }
});

updater.takeWhile(() => keepUpdating).onValue(() => {
  var curTime = process.hrtime();
  if(curTime[0] - lastCommFromServer[0] > 1) {
    keepUpdating = false;
    client.close();
  }
});

send('give-port');
