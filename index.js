const PORT = 33333;
const HOST = 'localhost';

const B = require('baconjs');
const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const express = require('express');
const app = express();
const clientPort = 33334;
const knownClients = {};

const pongs = B.repeatedly(1000/3, ['update']);
const updates = B.repeatedly(16, ['update']);

server.on('listening', () => {
  const address = server.address();
  console.log('UDP server listening on ' + address.address + ':' + address.port)
});

server.on('message', (message, remote) => {
  var remotePort = remote.port
  if(!knownClients[remotePort]) {
    console.log(remotePort+ ' connected');
  }
  var command = message.toString().split('::');
  switch (command[0]) {
    case 'give-port':
      knownClients[remotePort] = {
        lastComm: process.hrtime(),
        position: {x: 0, y: 0}
      };
      var portMessage = new Buffer('port-is::'+remotePort);
      server.send(portMessage,0, portMessage.length, parseInt(remotePort), 'localhost');
      break;
    case 'pong':
      knownClients[remotePort].lastComm = process.hrtime()
      break;
    case 'set-name':
      console.log('setting name of', remotePort,'to', command[1]);
      knownClients[remotePort].name = command[1];
      break;
    default:
  }
});

function tooLong(clientLastComm, currentTime) {
  return (currentTime[0] - clientLastComm[0]) > 1
}

server.bind(PORT, HOST);

pongs.onValue(function () {
  const knownKeys = Object.keys(knownClients);
  const curTime = process.hrtime();
  knownKeys.forEach(k => {
    var message = new Buffer('ping');
    server.send(message, 0, message.length, parseInt(k), 'localhost');
    if(tooLong(knownClients[k].lastComm, curTime)) {
      console.log(k,'disconnected');
      delete knownClients[k];
    }
  })
});

updates.onValue(function () {
  const knownKeys = Object.keys(knownClients);
  const curTime = process.hrtime();
  knownKeys.forEach(k => {
    knownClients[k].position.x += 0.01;
    knownClients[k].position.y += 0.01;
    var pos = new Buffer('set-pos::'+JSON.stringify(knownClients[k].position));
    server.send(pos, 0, pos.length, parseInt(k), 'localhost');
    var data = new Buffer('data::'+JSON.stringify(knownClients));
    server.send(data, 0, data.length, parseInt(k), 'localhost');
  })
});

app.get('/', (req, res) => {
  res.send(JSON.stringify(knownClients));
});

app.listen(8080);
