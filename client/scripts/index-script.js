import { webSocket } from "./main-script.js";

document.getElementById('btn-create-game').addEventListener('click', event => {
    const clientId = sessionStorage.getItem('clientId')
    const payLoad = {
        "method": "create",
        "clientId": clientId,
    }
    webSocket.send(JSON.stringify(payLoad));
    window.location.href = "/waiting-room";
});

document.getElementById('btn-join-game').addEventListener('click', event => {
    let gameCode = document.getElementById('txt-game-code').value;
    sessionStorage.setItem('gameId', gameCode);
    window.location.href = "/waiting-room";
});