const PORT = 33333;
const HOST = 'localhost';

const B = require('baconjs');
const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const express = require('express');
const app = express();
const clientPort = 33334;
const knownClients = {};

const updates = B.repeatedly(16, ['update']);

server.on('listening', () => {
  const address = server.address();
  console.log('UDP server listening on ' + address.address + ':' + address.port)
});

server.on('message', (message, remote) => {
  if(!knownClients[remote.port]) {
    console.log(remote.port + ' connected');
  }
  switch (message.toString()) {
    case 'give-port':
      knownClients[remote.port] = {
        lastComm: process.hrtime(),
        position: {x: 0, y: 0}
      };
      break;
    case 'pong':
      knownClients[remote.port].lastComm = process.hrtime()
    default:
  }
});

function tooLong(clientLastComm, currentTime) {
  return (currentTime[0] - clientLastComm[0]) > 1
}

server.bind(PORT, HOST);

updates.onValue(function () {
  const knownKeys = Object.keys(knownClients);
  const curTime = process.hrtime();
  knownKeys.forEach(k => {
    knownClients[k].position.x += 0.01;
    knownClients[k].position.y += 0.01;
    var message = new Buffer('ping');
    var pos = new Buffer(JSON.stringify(knownClients[k].position));
    server.send(message, 0, message.length, parseInt(k), 'localhost');
    server.send(pos, 0, pos.length, parseInt(k), 'localhost');
    if(tooLong(knownClients[k].lastComm, curTime)) {
      console.log(k,'disconnected');
      delete knownClients[k];
    }
  })
});

app.get('/', (req, res) => {
  res.send(JSON.stringify(knownClients));
});

app.listen(8080);
