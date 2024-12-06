import { connect, send, addMessageListener } from './connection-manager.js';
import { navigateTo } from './router.js';

const debugMode = true;

let txtUsername = document.getElementById('txt-username');
let title = document.getElementById('title');
let btnConfirmUsername = document.getElementById('btn-confirm-username');
let showError = document.getElementById('show-error');
let gameStats = document.getElementById('game-stats');
let playerUsername = document.getElementById('player-username');

function handleMessage(message) {
    debugMode && console.log('Received message: ', message);

    const messageHandler = {
        'update-players-list': handleUpdatePlayersList,
        'duplicated-username': handleDuplicateUsername,
        'start-game': handleStartGame,
        'invalid-clientId': handleInvalidClientId,
        'server-error': handleServerError,
        'connection-trouble': handleConnectionTrouble,
        'connection-trouble-managed': handleConnectionTroubleManaged,
        'player-disconnected': handlePlayerDisconnected,
        'player-disconnection-managed': handlePlayerDisconnectedManaged,
    }

    const handler = messageHandler[message.method];
    handler && handler(message);
}

function handleUpdatePlayersList(message) {
    let playersList = message.playersList;
    if (sessionStorage.getItem('hostId')) {
        document.getElementById('btn-start-game').disabled = false;
        gameStats.innerText = 'Giocatori presenti ' + playersList.length;
    }
    if (message.clientId === sessionStorage.getItem('clientId')) {
        playerUsername.innerText = 'Sei entrato come ' + message.username;
        if (sessionStorage.getItem('hostId')) {
            playerUsername.innerText += '\nQuando tutti i giocatori sono entrati avvia la partita'
        } else {
            playerUsername.innerText += '\n\nAttendi che l\'host avvii la partita'
        }
        txtUsername.removeEventListener('input', inputEventAction);
        txtUsername.value = '';
        txtUsername.setAttribute('disabled', 'true');
        btnConfirmUsername.disabled = true;
    }
    let playerUl = document.getElementById('players-list');
    playerUl.innerHTML = ''; //brutal way maybe to review but not now
    playersList.forEach(username => {
        let element = document.createElement('p');
        element.innerHTML = username;
        element.classList.add('new-amsterdam-regular');
        playerUl.appendChild(element);
    });
}

function handleDuplicateUsername() {
    showError.innerText = 'Username già in uso, scegline uno diverso';
}

function handleStartGame() {
    navigateTo('playing-room');
}

function handleInvalidClientId() {
    navigateTo('');
}

function handleServerError() {
    sessionStorage.clear();
    navigateTo('');
}

function handleConnectionTrouble() {
    showPopup('single-disconnection-popup');
}

function handleConnectionTroubleManaged() {
    hidePopup('single-disconnection-popup');
}

function handlePlayerDisconnected() {
    hidePopup('single-disconnection-popup');
    showPopup('disconnection-popup');
}

function handlePlayerDisconnectedManaged() {
    hidePopup('disconnection-popup');
}

function createDivGameCode(target) {    
    const pCode = document.createElement('p');
    pCode.classList.add('col-12', 'fst-italic');
    pCode.innerText = 'Codice partita: ' + sessionStorage.getItem('gameId') + '\nCondividilo con i tuoi amici per farli entrare';
    target.insertAdjacentElement('afterend', pCode);

}

function createDivBtnStart() {
    const mainRow =  document.getElementById('main-row');
    const divLeft = document.createElement('div');
    divLeft.classList.add('col-2', 'col-lg-4');
    mainRow.appendChild(divLeft);

    const btn = document.createElement('button');
    btn.classList.add('new-amsterdam-regular', 'btn-start-game', 'mt-2', 'col-8', 'col-lg-4', 'w-60');
    btn.setAttribute('id', 'btn-start-game');
    btn.setAttribute('disabled', 'true');
    btn.innerHTML = 'Avvia partita';
    mainRow.appendChild(btn);

    const divRight = document.createElement('div');
    divLeft.classList.add('col-2', 'col-lg-4');
    mainRow.appendChild(divRight);
}

function checkUsername(username) {
    const regex = /^[a-zA-Z0-9]+$/;
    return regex.test(username);
}

function inputEventAction() {
    txtUsername.value.trim().length > 0 ? 
        btnConfirmUsername.disabled = false : 
        btnConfirmUsername.disabled = true;
}

function startScript() {
    btnConfirmUsername.addEventListener('click', event => {
        event.preventDefault();
        showError.innerText = '';
        const username = txtUsername.value;
        if (checkUsername(username)) {
            const gameId = sessionStorage.getItem('gameId');
            const clientId = sessionStorage.getItem('clientId');
            const payLoad = {
                method: 'join',
                'clientId': clientId,
                'gameId': gameId,
                'username': username,
            };
            send(payLoad);
        } else {
            showError.innerText = 'Username non valido, potrebbe contenere spazi o caratteri non consentiti. Utilizza solo lettere e numeri';
        }
    });
    
    if (sessionStorage.getItem('hostId')) {
        createDivGameCode(title);
        createDivBtnStart();
        document.getElementById('btn-start-game').addEventListener('click', e => {
            const payLoad = {
                'method': 'start-game',
                'gameId': sessionStorage.getItem('gameId'),
            }
            send(payLoad);
        });
    }
    
    txtUsername.addEventListener('input', inputEventAction);

    addMessageListener(handleMessage);
}

export { startScript };

