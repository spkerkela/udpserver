'use strict';
const B = require('baconjs');
const PORT = 33333;
const HOST = 'localhost';

const updater = B.repeatedly(16, ['update'])

const dgram = require('dgram');

const client = dgram.createSocket('udp4');

let lastCommFromServer = process.hrtime();
let keepUpdating = true;
let myPos =  {};
let myPort = 0;
let worldState = {};

function send(msg) {
  const message = new Buffer(msg);
  client.send(message, 0, message.length, PORT, HOST, (err, bytes) => {
    if(err) throw err;
  });
}

client.on('message', (message, remote) => {
  const command = message.toString().split('::');
  if(command[0] === 'ping') {
    lastCommFromServer = process.hrtime();
    send('pong');
  } else if(command[0] ==='port-is') {
    console.log('received port:', command[1]);
    myPort = parseInt(command[1]);
    send('set-name::LOLBAL'+Math.random());
  } else if(command[0] === 'set-pos') {
    myPos = JSON.parse(command[1]);
  } else if(command[0] === 'data') {
    worldState = JSON.parse(command[1]);
  }
});

updater.takeWhile(() => keepUpdating).onValue(() => {
  const curTime = process.hrtime();
  if(curTime[0] - lastCommFromServer[0] > 1) {
    keepUpdating = false;
    console.log('server disconnected');
    client.close();
  }
});

B.repeatedly(1000,['state']).takeWhile(() => keepUpdating).onValue(() => {
  console.log('known state of the game', worldState);
})

send('give-port');
