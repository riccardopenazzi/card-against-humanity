const webSocketPort = 9090;
export let webSocket = new WebSocket("ws://localhost:" + webSocketPort);

const debugMode = true;

export let clientId = null;

webSocket.onmessage = receivedMessage => {
    
    //first of all parse the message received
    const message = JSON.parse(receivedMessage.data);
    debugMode && console.log(message);

    switch (message.method) {
        case 'connect': 
            clientId = message.clientId;
            debugMode && console.log("clientId set successfully ", clientId);
            break;
        case 'create':
            gameId = message.gameId;
            debugMode && console.log("Game create successfully ", gameId);
            break;
    }
}