import { webSocket } from "./main-script.js";

document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('hostId')) {
        document.getElementById('div-title')
            .insertAdjacentElement('afterend', createDivGameCode());
        document.getElementById('div-form')
            .insertAdjacentElement('afterend', createDivBtnStart());
            
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
            let element = document.createElement('li');
            element.innerHTML = username;
            element.classList.add('new-amsterdam-regular');
            playerUl.appendChild(element);
        })
    }

    if (message.method === 'start-game') {
        window.location.href = '/playing-room';
    }
}

function createDivGameCode() {
    const divRow = document.createElement('div');
    divRow.classList.add('row', 'text-center', 'mt-3');
    const pCode = document.createElement('p');
    pCode.innerText = 'Codice partita: ' + sessionStorage.getItem('gameId');
    const pDesc = document.createElement('p');
    pDesc.classList.add('fst-italic');
    pDesc.innerText = 'Condividilo con i tuoi amici per farli entrare';
    divRow.appendChild(pCode);
    divRow.appendChild(pDesc);
    return divRow;
}

function createDivBtnStart() {
    const divRow = document.createElement('div');
    divRow.classList.add('row');
    const divCol = document.createElement('div');
    divCol.classList.add('col-md-4', 'text-center');
    const btn = document.createElement('button');
    btn.classList.add('new-amsterdam-regular', 'btn-start-game', 'w-50', 'mt-2');
    btn.setAttribute('id', 'btn-start-game');
    btn.innerHTML = 'Avvia partita';
    divCol.appendChild(btn);
    divRow.appendChild(divCol);
    return divRow;
}