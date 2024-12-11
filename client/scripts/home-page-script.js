import { connect, send, addMessageListener } from './connection-manager.js';
import { navigateTo } from './router.js';

let inputCode;
let btnJoin;
let btnCreate;
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
        document.getElementById('info-popup').classList.remove('hidden');
		/* navigateTo('waiting-room'); */
    } else {
        showError('Si è verificato un errore, il codice potrebbe non essere di 6 caratteri, contenere spazi o essere errato');
    }
}

function handleGameAlreadyStarted() {
    alert('Non puoi unirti ad una partita già iniziata');
   	navigateTo('');
}

function handleInvalidClientId() {
    navigateTo('');
}

function handleServerError() {
    sessionStorage.clear();
    navigateTo('');
}

function showError(message) {
    const errorElement = document.getElementById('show-error');
    errorElement.innerText = message;
}

function executeConnect() {
    connect()
        .then(() => {
            debugMode && console.log('Connected to WebSocket server.');
            addMessageListener(handleMessage);
            executeStartScript();
        })
        .catch((error) => {
            alert("Connessione WebSocket non disponibile, potrebbero esserci problemi dovuti alla rete. Ricarica la pagina e riprova.");
        });
}

function createBtnCreateGame() {
    btnCreate = document.createElement('button');
    btnCreate.setAttribute('id', 'btn-create-game');
    btnCreate.classList.add('btn-create-game', 'w-100', 'new-amsterdam-regular');
    btnCreate.innerText = "Crea una stanza";
    btnCreate.addEventListener('click', () => {
        navigateTo('settings');
    });
    document.getElementById('btn-create-container').appendChild(btnCreate);
}

function createInputGameCode() {
    inputCode = document.createElement('input');
    inputCode.setAttribute('id', 'txt-game-code');
    inputCode.setAttribute('placeholder', 'Esempio: AH45DF');
    inputCode.setAttribute('type', 'text');
    inputCode.classList.add('form-control', 'w-100', 'mx-auto', 'mt-2');
    inputCode.addEventListener('input', () => {
        btnJoin.disabled = inputCode.value.trim().length !== 6;
    });
    document.getElementById('input-game-code-container').appendChild(inputCode);
}

function createBtnJoinGame() {
    btnJoin = document.createElement('button');
    btnJoin.setAttribute('id', 'btn-join-game');
    btnJoin.setAttribute('disabled', 'true');
    btnJoin.classList.add('btn-join-game', 'w-100', 'new-amsterdam-regular');
    btnJoin.innerText = "Entra in una stanza";
    btnJoin.addEventListener('click', () => {
        send({method: 'connect'});
    });
    document.getElementById('btn-join-container').appendChild(btnJoin);
}

function createBtnPopupInfo() {
    let btn = document.createElement('button');
    btn.classList.add('new-amsterdam-regular', 'btn-accept-info');
    btn.innerText = 'Accetto';
    btn.addEventListener('click', () => {
        sessionStorage.setItem('reloadRequired', true);
        navigateTo('waiting-room');
    });
    document.getElementById('popup-info-paragraph').insertAdjacentElement('afterend', btn);
}

function executeStartScript() {
    createBtnCreateGame();
    createInputGameCode();
    createBtnJoinGame();
    createBtnPopupInfo();
}

export { executeConnect };
