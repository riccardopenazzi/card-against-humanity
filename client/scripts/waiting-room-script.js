import { webSocket } from "./main-script.js";

document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('hostId')) {
        createDivGameCode(document.getElementById('title'));
        createDivBtnStart();
        document.getElementById('btn-start-game').addEventListener('click', e => {
            const payLoad = {
                'method': 'start-game',
                'gameId': sessionStorage.getItem('gameId'),
            }
            webSocket.send(JSON.stringify(payLoad));
        });
    }
});

document.getElementById('btn-confirm-username').addEventListener('click', event => {
    event.preventDefault();
    const username = document.getElementById('txt-username').value;
    const gameId = sessionStorage.getItem('gameId');
    const clientId = sessionStorage.getItem('clientId');
    const payLoad = {
        "method": "join",
        "clientId": clientId,
        "gameId": gameId,
        "username": username,
    };
    webSocket.send(JSON.stringify(payLoad));
});

webSocket.onmessage = receivedMessage => {
    const message = JSON.parse(receivedMessage.data);
    if (message.method === 'update-players-list') {
        let playersList = message.playersList;
        let playerUl = document.getElementById('players-list');
        playerUl.innerHTML = ''; //brutal way maybe to review but not now
        playersList.forEach(username => {
            let element = document.createElement('p');
            element.innerHTML = username;
            element.classList.add('new-amsterdam-regular');
            playerUl.appendChild(element);
        })
    }

    if (message.method === 'start-game') {
        window.location.href = '/playing-room';
    }
}

function createDivGameCode(target) {    
    const pDesc = document.createElement('p');
    pDesc.classList.add('col-12', 'fst-italic');
    pDesc.innerText = 'Condividilo con i tuoi amici per farli entrare';
    target.insertAdjacentElement('afterend', pDesc);

    const pCode = document.createElement('p');
    pCode.classList.add('col-12');
    pCode.innerText = 'Codice partita: ' + sessionStorage.getItem('gameId');
    target.insertAdjacentElement('afterend', pCode);

}

function createDivBtnStart() {
    const divLeft = document.createElement('div');
    divLeft.classList.add('col-2', 'col-lg-4');
    document.getElementById('main-row').appendChild(divLeft);

    const btn = document.createElement('button');
    btn.classList.add('new-amsterdam-regular', 'btn-start-game', 'mt-2', 'col-8', 'col-lg-4', 'w-60');
    btn.setAttribute('id', 'btn-start-game');
    btn.innerHTML = 'Avvia partita';
    document.getElementById('main-row').appendChild(btn);

    const divRight = document.createElement('div');
    divLeft.classList.add('col-2', 'col-lg-4');
    document.getElementById('main-row').appendChild(divRight);
}