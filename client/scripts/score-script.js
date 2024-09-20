/* import { webSocket } from "./main-script.js"; */

const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const webSocketPort = window.location.port;
export let webSocket = new WebSocket(`${protocol}://${window.location.hostname}:${webSocketPort}`);

const debugMode = true;

webSocket.onopen = () => {
    const clientId = sessionStorage.getItem('clientId');
    if (!clientId) {
        debugMode && console.log('Client id not set');
        const payLoad = {
            "method": "connect"
        }
        webSocket.send(JSON.stringify(payLoad));
    } else {
        debugMode && console.log('ClientId already set');
        const payLoad = {
            "method": "connect-again",
            "clientId": clientId,
        }
        webSocket.send(JSON.stringify(payLoad));
    }
}

webSocket.onmessage = receivedMessage => {
    const message = JSON.parse(receivedMessage.data);

    if (message.method === 'reconnected') {
        const payLoad = {
            'method': 'req-score',
            'clientId': sessionStorage.getItem('clientId'),
            'gameId': sessionStorage.getItem('gameId'),
        }
        webSocket.send(JSON.stringify(payLoad));
    }

    if (message.method === 'req-score') {
        showScores(message.score);
    }

    if (message.method === 'new-manche') {
        window.location.href = '/playing-room';
    }

    if (message.method === 'counter-ready-players') {
        document.getElementById('player-counter').innerText = '';
        document.getElementById('player-counter').innerText = 'Giocatori pronti: ' + message.readyPlayers;
    }

    if (message.method === 'check-connection') {
        const payLoad = {
            'method': 'check-connection',
            'clientId': sessionStorage.getItem('clientId'),
        }
        webSocket.send(JSON.stringify(payLoad));
    }

}

function showScores(scores) {
    let scoreRow = document.getElementById('score-row');
    scores.forEach(score => {
        let divUsername = document.createElement('div');
        divUsername.classList.add('col-6');
        divUsername.innerText = score.username;
        let divScore = document.createElement('div');
        divScore.classList.add('col-6');
        divScore.innerText = score.score;
        scoreRow.appendChild(divUsername);
        scoreRow.appendChild(divScore);

    });
    let tmpDiv = document.createElement('div');
    tmpDiv.classList.add('col-3');
    scoreRow.appendChild(tmpDiv);
    let btn = document.createElement('button');
    btn.classList.add('btn-confirm', 'col-6', 'mt-5');
    btn.innerText = 'Conferma';
    btn.addEventListener('click', e => {
        btn.setAttribute('disabled', 'true');
        const payLoad = {
            'method': 'new-manche',
            'gameId': sessionStorage.getItem('gameId'),
        }
        webSocket.send(JSON.stringify(payLoad));
    });
    scoreRow.appendChild(btn);

}