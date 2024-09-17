import { webSocket } from "./main-script.js";

const inputCode = document.getElementById('txt-game-code');
const btnJoin = document.getElementById('btn-join-game');
const btnCreate = document.getElementById('btn-create-game');

btnCreate.addEventListener('click', event => {
    window.location.href = "/settings";
});

btnJoin.addEventListener('click', event => {
    let gameCode = inputCode.value.toUpperCase();
    checkGameCode(gameCode);
    document.getElementById('show-error').innerText = '';
});

inputCode.addEventListener('input', () => {
    inputCode.value.trim().length == 6 ? btnJoin.disabled = false : btnJoin.disabled = true;
});

/*
* A game code is considered valid if is of 6 chars, doesn't contain white spaces and if in the server exists a game with that code
*/
function checkGameCode(gameCode) {
    const payLoad = {
        'method': 'verify-game-code',
        'clientId': sessionStorage.getItem('clientId'),
        'gameCode': gameCode
    }
    webSocket.send(JSON.stringify(payLoad));
}