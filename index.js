'use strict';
const PORT = 33333;
const HOST = 'localhost';

const B = require('baconjs');
const upd = require('dgram');
const server = upd.createSocket('udp4');
const express = require('express');
const app = express();
app.use(express.static('public'));
const gameState = {
  bombs: [],
  knownClients: {}
};

const pongs = B.repeatedly(1000 / 3, ['update']);
const updates = B.repeatedly(16, ['update']);

server.on('listening', () => {
  const address = server.address();
  console.log('UDP server listening on ' + address.address + ':' + address.port)
});

server.on('message', (message, remote) => {
  const remotePort = remote.port;
  const knownClients = gameState.knownClients;
  if (!knownClients[remotePort]) {
    console.log(remotePort + ' connected');
  }
  var command = message.toString().split('::');
  switch (command[0]) {
    case 'give-port':
      knownClients[remotePort] = {
        lastComm: process.hrtime(),
        position: {x: 0, y: 0},
        bombs: 3,
        hitPoints: 1,
        isAlive: true
      };
      var portMessage = new Buffer('port-is::' + remotePort);
      server.send(portMessage, 0, portMessage.length, parseInt(remotePort), 'localhost');
      break;
    case 'pong':
      knownClients[remotePort].lastComm = process.hrtime();
      break;
    case 'set-name':
      console.log('setting name of', remotePort, 'to', command[1]);
      knownClients[remotePort].name = command[1];
      break;
    case 'set-bomb':
      var bombPosition = knownClients[remotePort].position;
      if (knownClients[remotePort].isAlive && knownClients[remotePort].bombs > 0) {
        console.log(remotePort, 'set up a bomb at', bombPosition);
        knownClients[remotePort].bombs--;
        gameState.bombs.push({
          position: bombPosition,
          plantedAt: process.hrtime(),
          exploded: false
        });
      }
      break;
    case 'move-to':
      const direction = JSON.parse(command[1]);
      if (direction && knownClients[remotePort].isAlive) {
        let destination = {
          x: knownClients[remotePort].position.x + direction.x,
          y: knownClients[remotePort].position.y + direction.y
        };
        destination.x = Math.min(Math.max(destination.x, 0), 19);
        destination.y = Math.min(Math.max(destination.y, 0), 19);
        knownClients[remotePort].position = destination;
      }
      break;
    default:
  }
});

function tooLong(clientLastComm, currentTime) {
  return (currentTime[0] - clientLastComm[0]) > 1
}

server.bind(PORT, HOST);

pongs.onValue(function () {
  const knownClients = gameState.knownClients;
  const knownKeys = Object.keys(knownClients);
  const curTime = process.hrtime();
  knownKeys.forEach(k => {
    const message = new Buffer('ping');
    server.send(message, 0, message.length, parseInt(k), 'localhost');
    if (tooLong(knownClients[k].lastComm, curTime)) {
      console.log(k, 'disconnected');
      delete knownClients[k];
    }
  })
});

function updateBombs(bomb, knownClients) {
  const knownKeys = Object.keys(knownClients);
  if (!bomb.exploded) {
    const end = process.hrtime(bomb.plantedAt);
    if (end[0] > 3) {
      bomb.exploded = true;
      knownKeys.forEach(k => {
        const pos = knownClients[k].position;
        const distance = Math.pow(bomb.position.x - pos.x, 2) + Math.pow(bomb.position.y - pos.y, 2);
        const radius = 5;
        if (distance < Math.pow(radius, 2)) {
          knownClients[k].hitPoints--;
          if (knownClients[k].hitPoints <= 0) {
            knownClients[k].isAlive = false;
          }
        }
      })
    }
  }
}

function sendDataToClients(knownClients) {
  const knownKeys = Object.keys(knownClients);
  knownKeys.forEach(k => {
    const pos = new Buffer('set-pos::' + JSON.stringify(knownClients[k].position));
    server.send(pos, 0, pos.length, parseInt(k), 'localhost');
    const data = new Buffer('data::' + JSON.stringify(gameState));
    server.send(data, 0, data.length, parseInt(k), 'localhost');
  })
}

updates.onValue(function () {
  const knownClients = gameState.knownClients;
  const bombs = gameState.bombs;
  const knownKeys = Object.keys(knownClients);

  bombs.forEach(bomb => {
    updateBombs(bomb, knownKeys, knownClients);
  });

  sendDataToClients(knownKeys, knownClients);
});

app.get('/api', (req, res) => {
  res.send(gameState);
});

app.listen(8080);
