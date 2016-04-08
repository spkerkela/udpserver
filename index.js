const PORT = 33333;
const HOST = 'localhost';

const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const clientPort = 33334;
const knownClients = {};

server.on('listening', () => {
  const address = server.address();
  console.log('UDP server listening on ' + address.address + ':' + address.port)
});

/*
client.send(message, 0, message.length, PORT, HOST, (err, bytes) => {
    if(err) throw err;
    console.log('UDP message sent to ' + HOST + ':' + PORT);
  });
  */
server.on('message', (message, remote) => {
  //console.log(remote.address + ':' + remote.port + '-' + message);
  console.log(knownClients);
  console.log(message);
  switch (message.toString()) {
    case 'give-port':
      const msg = clientPort++;
      console.log('remoteis',remote);
      knownClients[clientPort] = {remote};

      break;
    default:

  }
});

server.bind(PORT, HOST);
