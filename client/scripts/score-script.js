import { webSocket } from "./main-script.js";

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
        console.log(message.score);
        showScores(message.score);
    }

    if (message.method === 'new-manche') {
        window.location.href = '/playing-room';
    }
}

function showScores(scores) {
    console.log(scores);
    let scoreRow = document.getElementById('score-row');
    Object.keys(scores).forEach(entry => {
        console.log('itero');
        const [username, score] = entry;
        console.log(username + ' ' +score)
        let divUsername = document.createElement('div');
        divUsername.classList.add('col-6');
        divUsername.innerText = username;
        let divScore = document.createElement('div');
        divScore.classList.add('col-6');
        divScore.innerText = score;
        scoreRow.appendChild(divUsername);
        scoreRow.appendChild(divScore);
    })

    let btn = document.createElement('button');
    btn.classList.add('btn-confirm');
    btn.innerText = 'Conferma';
    btn.addEventListener('click', e => {
        const payLoad = {
            'method': 'new-manche',
            'gameId': sessionStorage.getItem('gameId'),
        }
        webSocket.send(JSON.stringify(payLoad));
    });
    scoreRow.appendChild(btn);

}