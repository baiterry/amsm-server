const io = require('socket.io-client');

// const flightSocket = io('http://localhost:20628', {
//   path: '/flight'
// });


const flightSocket = io('http://localhost:20628', {
  path: '/flight'
});

flightSocket.on('connect', () => {
  console.log('connected to ws:flight');
});

flightSocket.on('flight', (data) => {
  console.log(data);
  console.log('=====================')
});

flightSocket.on('error', (err) => {
  console.log('err: ' + err);
});