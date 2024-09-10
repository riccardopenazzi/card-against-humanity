const webSocketPort = 9090;
export let webSocket = new WebSocket("ws://localhost:" + webSocketPort);

const debugMode = true;

webSocket.onopen = () => {
    const clientId = sessionStorage.getItem('clientId');
    if (!clientId) {
        debugMode && console.log('Client id not set');
        const payLoad = {
            "method": "connect"
        }
        webSocket.send(JSON.stringify(payLoad));
    } else {
        debugMode && console.log('ClientId already set');
        const payLoad = {
            "method": "connect-again",
            "clientId": clientId,
        }
        webSocket.send(JSON.stringify(payLoad));
    }
}

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
            sessionStorage.setItem('hostId', message.hostId);
            debugMode && console.log(sessionStorage.getItem('gameId'));
            debugMode && console.log(sessionStorage.getItem('hostId'));
            debugMode && console.log("Game create successfully ", sessionStorage.getItem('gameId'));
            break;
    }
}