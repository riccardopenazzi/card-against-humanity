import { connect, send, addMessageListener } from './connection-manager.js';
import { navigateTo } from './router.js';

let cardsInput = document.getElementById('player-cards-range');
let winsInput = document.getElementById('win-number-range');
let cardsValueIndicator = document.getElementById('player-cards-value');
let winsValueIndicator = document.getElementById('win-number-value');
let btnConfirmSettings = document.getElementById('btn-confirm-settings');
let checkboxWhiteCardMode = document.getElementById('white-card-mode');

function handleMessage(message) {
    console.log('Received message:', message);

    const messageHandler = {
        'connect': handleConnect,
        'create': handleCreate,
        'invalid-clientId': handleInvalidClientId,
        'server-error': handleServerError,
    };

    const handler = messageHandler[message.method];
    handler && handler(message);
}

function handleConnect(message) {
    const clientId = message.clientId;
    sessionStorage.setItem('clientId', clientId);
    console.log("clientId set successfully:", clientId);

    const playersCard = cardsInput.value;
    const winsNumber = winsInput.value;
    const payload = {
        method: 'create',
        clientId: clientId,
        playersCards: playersCard,
        winsNumber: winsNumber,
        whiteCardMode: checkboxWhiteCardMode.checked,
    };
    send(payload);
}

function handleCreate(message) {
    sessionStorage.setItem('gameId', message.gameId);
    sessionStorage.setItem('hostId', sessionStorage.getItem('clientId'));
    navigateTo('/waiting-room');
}

function handleInvalidClientId() {
    navigateTo('/');
}

function handleServerError() {
    navigateTo('/');
}

function startScript() {
    cardsValueIndicator.innerText = cardsInput.value;
    winsValueIndicator.innerText = winsInput.value;
    
    cardsInput.addEventListener('input', () => {
        cardsValueIndicator.innerText = cardsInput.value;
    });
    
    winsInput.addEventListener('input', () => {
        winsValueIndicator.innerText = winsInput.value;
    });
    
    btnConfirmSettings.addEventListener('click', () => {
        send({ method: 'connect' });
    });

    addMessageListener(handleMessage);
}

export { startScript };

