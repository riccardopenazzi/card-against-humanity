import { webSocket } from "./main-script.js";

document.getElementById('btn-confirm-username').addEventListener('click', event => {
    event.preventDefault();
    const username = document.getElementById('txt-username').value;
    const gameId = sessionStorage.getItem('gameId');
    const clientId = sessionStorage.getItem('clientId');
    console.log('Mando payload ', gameId);
    const payLoad = {
        "method": "join",
        "clientId": clientId,
        "gameId": gameId,
        "username": username,
    };
    webSocket.send(JSON.stringify(payLoad));
});