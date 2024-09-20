const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const webSocketPort = window.location.port;
let webSocket = new WebSocket(`${protocol}://${window.location.hostname}:${webSocketPort}`);

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

    /*When user clicks on 'conferma impostazioni' first is necessary to create a connection */
    btnConfirmSettings.addEventListener('click', () => {
        const payLoad = {
            'method': 'connect',
        }
        webSocket.send(JSON.stringify(payLoad));
    });
});

webSocket.onmessage = receivedMessage => {
    const message = JSON.parse(receivedMessage.data);
    debugMode && console.log(message);

	/* If client receives this message it means a connection is created, now it can store clientId and send request to create a game */
    if (message.method === 'connect') {
        let clientId = message.clientId;
        sessionStorage.setItem('clientId', clientId);
		debugMode && console.log("clientId set successfully ", sessionStorage.getItem('clientId'));
        let playersCard = cardsInput.value;
        let winsNumber = winsInput.value;
        const payLoad = {
            'method': 'create',
            'clientId': clientId,
            'playersCards': playersCard,
            'winsNumber': winsNumber,
        }
        webSocket.send(JSON.stringify(payLoad));
    }

    /* If client receives this message it means game has been created succesfully so it can stores gameId and hostId that is itself and then it'redirected to waiting room */
    if (message.method === 'create') {
        sessionStorage.setItem('gameId', message.gameId);
        sessionStorage.setItem('hostId', sessionStorage.getItem('clientId'));
        window.location.href = '/waiting-room';
    }

	/* Standard message used to show to ther server that the client is still connected, probably it's not too necesseray here */
    if (message.method === 'check-connection') {
        const payLoad = {
            'method': 'check-connection',
            'clientId': sessionStorage.getItem('clientId'),
        }
        webSocket.send(JSON.stringify(payLoad));
    }
}