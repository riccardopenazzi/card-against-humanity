const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const webSocketPort = window.location.port;
let webSocket = new WebSocket(`${protocol}://${window.location.hostname}:${webSocketPort}`);

const debugMode = true;

let txtUsername = document.getElementById('txt-username');
let title = document.getElementById('title');
let btnConfirmUsername = document.getElementById('btn-confirm-username');
let showError = document.getElementById('show-error');
let gameStats = document.getElementById('game-stats');
let playerUsername = document.getElementById('player-username');

webSocket.onopen = () => {
    const clientId = sessionStorage.getItem('clientId');
    if (!clientId) {
       window.location.href = '/';
    } else {
        const payLoad = {
            'method': 'connect-again',
            'clientId': clientId,
        }
        webSocket.send(JSON.stringify(payLoad));
    }
}

btnConfirmUsername.addEventListener('click', event => {
    event.preventDefault();
    showError.innerText = '';
    const username = txtUsername.value;
    if (checkUsername(username)) {
        const gameId = sessionStorage.getItem('gameId');
        const clientId = sessionStorage.getItem('clientId');
        const payLoad = {
            'method': 'join',
            'clientId': clientId,
            'gameId': gameId,
            'username': username,
        };
        webSocket.send(JSON.stringify(payLoad));
    } else {
        showError.innerText = 'Username non valido, potrebbe contenere spazi o caratteri non consentiti. Utilizza solo lettere e numeri';
    }
});

webSocket.onmessage = receivedMessage => {
    const message = JSON.parse(receivedMessage.data);
    debugMode && console.log(message);

    /*If clients receive this message it means it has been reconnected, if it's the host its game control are painted */
    if (message.method === 'reconnected') {
        if (sessionStorage.getItem('hostId')) {
            createDivGameCode(title);
            createDivBtnStart();
            document.getElementById('btn-start-game').addEventListener('click', e => {
                const payLoad = {
                    'method': 'start-game',
                    'gameId': sessionStorage.getItem('gameId'),
                }
                webSocket.send(JSON.stringify(payLoad));
            });
        }
        txtUsername.addEventListener('input', inputEventAction);
    }

    if (message.method === 'update-players-list') {
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
        })
    }

    if (message.method === 'duplicated-username') {
        showError.innerText = 'Username già in uso, scegline uno diverso';
    }

    if (message.method === 'start-game') {
        window.location.href = '/playing-room';
    }

    if (message.method === 'check-connection') {
        const payLoad = {
            'method': 'check-connection',
            'clientId': sessionStorage.getItem('clientId'),
        }
        webSocket.send(JSON.stringify(payLoad));
    }
    
    if (message.method === 'invalid-clientId') {
        window.location.href = '/';
    }
    
    if (message.method === 'server-error') {
        window.location.href = '/';
    }

    if (message.method === 'connection-trouble') {
        showPopup('single-disconnection-popup');
    }

    if (message.method === 'player-disconnected') {
        hidePopup('single-disconnection-popup')
        showPopup('disconnection-popup');
    }

    if (message.method === 'player-disconnection-managed') {
        hidePopup('disconnection-popup');
    }
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