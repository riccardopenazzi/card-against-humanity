import { connect, send, addMessageListener } from './connection-manager.js';
import { navigateTo } from './router.js';

const inputCode = document.getElementById('txt-game-code');
const btnJoin = document.getElementById('btn-join-game');
const btnCreate = document.getElementById('btn-create-game');
const debugMode = true;

function handleMessage(message) {
    debugMode && console.log('Received message:', message);

    const messageHandler = {
        'connect': handleConnect,
        'verify-game-code': handleVerifyGameCode,
        'game-already-started': handleGameAlreadyStarted,
        'invalid-clientId': handleInvalidClientId,
        'server-error': handleServerError,
    };

    const handler = messageHandler[message.method];
	handler && handler(message);
}

function handleConnect(message) {
    const clientId = message.clientId;
    sessionStorage.setItem('clientId', clientId);
    debugMode && console.log("clientId set successfully:", clientId);

    const gameCode = inputCode.value.toUpperCase();
    const payLoad = {
        method: 'verify-game-code',
        clientId: clientId,
        gameCode: gameCode,
    };
    send(payLoad);
}

function handleVerifyGameCode(message) {
    if (message.result === 'valid') {
        sessionStorage.setItem('gameId', message.gameCode);
		navigateTo('/waiting-room');
    } else {
        showError('Si è verificato un errore, il codice potrebbe non essere di 6 caratteri, contenere spazi o essere errato');
    }
}

function handleGameAlreadyStarted() {
    alert('Non puoi unirti ad una partita già iniziata');
   	navigateTo('/');
}

function handleInvalidClientId() {
    navigateTo('/');
}

function handleServerError() {
    navigateTo('/');
}

function showError(message) {
    const errorElement = document.getElementById('show-error');
    errorElement.innerText = message;
}

function startScript() {
    btnCreate.addEventListener('click', () => {
        navigateTo('/settings');
    });
    
    btnJoin.addEventListener('click', () => {
        send({method: 'connect'});
    });
    
    inputCode.addEventListener('input', () => {
        btnJoin.disabled = inputCode.value.trim().length !== 6;
    });
    
    connect()
        .then(() => {
            debugMode && console.log('Connected to WebSocket server.');
            addMessageListener(handleMessage);
        })
        .catch((error) => {
            alert("Connessione WebSocket non disponibile, potrebbero esserci problemi dovuti alla rete. Ricarica la pagina e riprova.");
        });
}

export { startScript };
