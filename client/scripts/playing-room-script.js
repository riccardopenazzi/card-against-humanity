import { webSocket } from "./main-script.js";

webSocket.onmessage = receivedMessage => {
    const message = JSON.parse(receivedMessage.data);

    if (message.method === 'reconnected') {
        const payLoad = {
            'method': 'start-manche',
            'clientId': sessionStorage.getItem('clientId'),
            'gameId': sessionStorage.getItem('gameId'),
        }
        webSocket.send(JSON.stringify(payLoad));
    }

    if (message.method === 'start-manche') {
        console.log(message);
        document.getElementById('title').innerHTML += message.mancheNumber;
        document.getElementById('black-card').innerText = message.blackCard;
        requestCardList();
    }

    if (message.method === 'req-player-cards') {
        fillCardList(message.playerCards);
    }

    if (message.method === 'play-card') {
        paintWaitingPlayers();
    }
}

function requestCardList() {
    const payLoad = {
        'method': 'req-player-cards',
        'gameId': sessionStorage.getItem('gameId'),
        'clientId': sessionStorage.getItem('clientId'),
    }
    webSocket.send(JSON.stringify(payLoad));
}

function fillCardList(cardList) {
    let frame = document.getElementById('frame');
    let cardListDiv = document.createElement('div');
    cardListDiv.classList.add('scrollable-cards');
    frame.appendChild(cardListDiv);
    cardList.forEach((card, index) => {
        let cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        let textDiv = document.createElement('div');
        textDiv.innerText = card;
        let btn = document.createElement('button');
        btn.classList.add('btn-confirm-card');
        btn.innerText = 'Conferma';
        btn.addEventListener('click', e => {
            const payLoad = {
                'method': 'play-card',
                'clientId': sessionStorage.getItem('clientId'),
                'gameId': sessionStorage.getItem('gameId'),
                'cardText': card,
            }
            webSocket.send(JSON.stringify(payLoad));
        });
        cardDiv.appendChild(textDiv);
        cardDiv.appendChild(btn);
        cardListDiv.appendChild(cardDiv);
    });
}

function paintWaitingPlayers() {
    let frame = document.getElementById('frame');
    frame.innerHTML = '';
    let p = document.createElement('p');
    p.innerHTML = 'Aspetta';
    frame.appendChild(p);
}