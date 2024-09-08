const webSocketPort = 9090;
let webSocket = new WebSocket("ws://localhost:" + webSocketPort);

const debugMode = true;

let clientId = null;

webSocket.onmessage = receivedMessage => {
    
    //first of all parse the message received
    const message = JSON.parse(receivedMessage.data);
    if (debugMode) console.log(message);

    switch (message.method) {
        case 'connect': 
            clientId = message.clientId;
            if (debugMode) console.log("clientId set successfully ", clientId);
    }
}