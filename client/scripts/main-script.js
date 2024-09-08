const webSocketPort = 9090;
export let webSocket = new WebSocket("ws://localhost:" + webSocketPort);

const debugMode = true;

webSocket.onmessage = receivedMessage => {
    
    //first of all parse the message received
    const message = JSON.parse(receivedMessage.data);
    debugMode && console.log(message);

    switch (message.method) {
        case 'connect': 
            sessionStorage.setItem('clientId', message.clientId);
            debugMode && console.log("clientId set successfully ", sessionStorage.getItem('clientId'));
            break;
        case 'create':
            sessionStorage.setItem('gameId', message.gameId);
            console.log(gameId);
            debugMode && console.log("Game create successfully ", sessionStorage.getItem('gameId'));
            break;
    }
}