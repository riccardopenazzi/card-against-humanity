import { connect, send, addMessageListener } from './connection-manager.js';
import { navigateTo } from './router.js';

let cardsInput;
let winsInput;
let cardsValueIndicator = document.getElementById('player-cards-value');
let winsValueIndicator = document.getElementById('win-number-value');
let btnConfirmSettings;
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

function createCardInput() {
    cardsInput = document.createElement('input');
    cardsInput.setAttribute('type', 'range');
    cardsInput.setAttribute('min', '4');
    cardsInput.setAttribute('max', '12');
    cardsInput.value = 8;
    cardsInput.setAttribute('id', 'player-cards-range');
    cardsInput.classList.add('form-range', 'px-3');
    cardsInput.addEventListener('input', () => {
        cardsValueIndicator.innerText = cardsInput.value;
    });
    document.getElementById('p-cards-number').insertAdjacentElement("afterend", cardsInput);
}

function createWinInput() {
    winsInput = document.createElement('input');
    winsInput.setAttribute('type', 'range');
    winsInput.setAttribute('min', '2');
    winsInput.setAttribute('max', '20');
    winsInput.value = 11;
    winsInput.setAttribute('id', 'win-number-range');
    winsInput.classList.add('form-range', 'px-3');
    winsInput.addEventListener('input', () => {
        winsValueIndicator.innerText = winsInput.value;
    });
    document.getElementById('p-win-number').insertAdjacentElement("afterend", winsInput);
}

function createBtnConfirmSettings() {
    btnConfirmSettings = document.createElement('button');
    btnConfirmSettings.setAttribute('id', 'btn-confirm-settings');
    btnConfirmSettings.classList.add('btn-confirm-settings', 'new-amsterdam-regular');
    btnConfirmSettings.innerText = "Conferma impostazioni";
    btnConfirmSettings.addEventListener('click', () => {
        send({ method: 'connect' });
    });
    document.getElementById('btn-confirm-settings-container').appendChild(btnConfirmSettings);
}

function startScript() {
    addMessageListener(handleMessage);
    createCardInput();
    createWinInput();
    createBtnConfirmSettings();
    cardsValueIndicator.innerText = cardsInput.value;
    winsValueIndicator.innerText = winsInput.value;
}

export { startScript };

