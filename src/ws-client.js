const WebSocket = require('ws');
const socket = new WebSocket('ws://localhost:8080');

socket.addEventListener('open', () => {

    console.log('Connected to the Server!');

});


socket.addEventListener('message', (msg) => {

    console.log(`Client Received: ${msg.data}`);

});


const sendMsg = () => {

    socket.send('Hows it going amigo!');
}