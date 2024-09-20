/* import { webSocket } from "./main-script.js"; */

const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const webSocketPort = window.location.port;
export let webSocket = new WebSocket(`${protocol}://${window.location.hostname}:${webSocketPort}`);

const debugMode = true;

let cardsInput = document.getElementById('player-cards-range');
let winsInput = document.getElementById('win-number-range');
let cardsValueIndicator = document.getElementById('player-cards-value');
let winsValueIndicator = document.getElementById('win-number-value');
let btnConfirmSettings = document.getElementById('btn-confirm-settings');

document.addEventListener('DOMContentLoaded', () => {
    cardsValueIndicator.innerText = cardsInput.value;
    winsValueIndicator.innerText = winsInput.value;

    cardsInput.addEventListener('input', () => {
        cardsValueIndicator.innerText = cardsInput.value;
    });

    winsInput.addEventListener('input', () => {
        winsValueIndicator.innerText = winsInput.value;
    });

    btnConfirmSettings.addEventListener('click', () => {
        const clientId = sessionStorage.getItem('clientId');
        let playersCard = cardsInput.value;
        let winsNumber = winsInput.value;
        const payLoad = {
            "method": "create",
            "clientId": clientId,
            "playersCards": playersCard,
            "winsNumber": winsNumber,
        }
        webSocket.send(JSON.stringify(payLoad));
    });
});

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
    const message = JSON.parse(receivedMessage.data);

    if (message.method === 'check-connection') {
        const payLoad = {
            'method': 'check-connection',
            'clientId': sessionStorage.getItem('clientId'),
        }
        webSocket.send(JSON.stringify(payLoad));
    }

    if (message.method === 'create') {
        sessionStorage.setItem('gameId', message.gameId);
        sessionStorage.setItem('hostId', message.hostId);
        window.location.href = '/waiting-room';
        
    }
}