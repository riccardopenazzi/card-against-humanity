import { webSocket } from "./main-script.js";

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
        playerUl.innerHTML = ''; //brutal way maybe toi review but not now
        playersList.forEach(username => {
            let element = document.createElement('li');
            element.innerHTML = username;
            playerUl.appendChild(element);
        })
    }
}