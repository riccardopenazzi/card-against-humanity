const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const webSocketPort = window.location.port;
export let webSocket = new WebSocket(`${protocol}://${window.location.hostname}:${webSocketPort}`);

const inputCode = document.getElementById('txt-game-code');
const btnJoin = document.getElementById('btn-join-game');
const btnCreate = document.getElementById('btn-create-game');

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
/* import { webSocket } from "./main-script.js"; */

btnCreate.addEventListener('click', event => {
    window.location.href = "/settings";
});

btnJoin.addEventListener('click', event => {
    let gameCode = inputCode.value.toUpperCase();
    checkGameCode(gameCode);
    document.getElementById('show-error').innerText = '';
});

inputCode.addEventListener('input', () => {
    inputCode.value.trim().length == 6 ? btnJoin.disabled = false : btnJoin.disabled = true;
});

/*
* A game code is considered valid if is of 6 chars, doesn't contain white spaces and if in the server exists a game with that code
*/
function checkGameCode(gameCode) {
    const payLoad = {
        'method': 'verify-game-code',
        'clientId': sessionStorage.getItem('clientId'),
        'gameCode': gameCode
    }
    webSocket.send(JSON.stringify(payLoad));
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
        case 'verify-game-code':
            if (message.result === 'valid') {
                sessionStorage.setItem('gameId', message.gameCode);
                window.location.href = "/waiting-room";
            } else {
                document.getElementById('show-error').innerText = 'Si è verificato un errore, il codice potrebbe non essere di 6 caratteri, contenere spazi o essere errato';
            }
            break;
        case 'check-connection':
            const payLoad = {
                'method': 'check-connection',
                'clientId': sessionStorage.getItem('clientId'),
            }
            webSocket.send(JSON.stringify(payLoad));
    }
}