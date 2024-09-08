import { webSocket, clientId, setGameId } from "./main-script.js";

document.getElementById('btn-create-game').addEventListener('click', event => {
    const payLoad = {
        "method": "create",
        "clientId": clientId,
    }
    webSocket.send(JSON.stringify(payLoad));
    window.location.href = "/waiting-room";
});

document.getElementById('btn-join-game').addEventListener('click', event => {
    let gameCode = document.getElementById('txt-game-code').value;
    setGameId(gameCode);
    window.location.href = "/waiting-room";
});