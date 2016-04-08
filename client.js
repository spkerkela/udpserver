const B = require('baconjs');
const PORT = 33333;
const HOST = 'localhost';

const sender = B.repeatedly(1000, ['give-port']);

const dgram = require('dgram');

const client = dgram.createSocket('udp4');

function send(msg) {
  const message = new Buffer(msg);
  client.send(message, 0, message.length, PORT, HOST, (err, bytes) => {
    if(err) throw err;
    console.log('UDP message sent to ' + HOST + ':' + PORT);
  });
}

sender.onValue(send);
