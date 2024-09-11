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
        const isMaster = (message.masterId === sessionStorage.getItem('clientId'));
        sessionStorage.setItem('master', isMaster);
        if (isMaster) {
            paintMessage('Aspetta che i giocatori scelgano la propria carta');
        } else {
            requestCardList();
        }
    }

    if (message.method === 'req-player-cards') {
        fillCardList(message.playerCards);
    }

    if (message.method === 'play-card') {
        paintMessage('Hai giocato la tua carta, ora aspetta che lo facciano tutti');
    }

    if (message.method === 'choosing-winner') {
        const isMaster = (sessionStorage.getItem('master') === 'true');
        if (isMaster) {
            fillMasterCardList(message.playedCards);
        } else {
            paintMessage('Il master sta scegliendo il vincitore');
        }
    }

    if (message.method === 'watch-score') {
        window.location.href = '/score';
    }

    if (message.method === 'win') {
        paintMessage(message.winner + ' ha vinto');
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
        let confirmBtn = createConfirmBtn(card);
        cardDiv.appendChild(textDiv);
        cardDiv.appendChild(confirmBtn);
        cardListDiv.appendChild(cardDiv);
    });
}

function createConfirmBtn(card) {
    let btn = document.createElement('button');
    btn.classList.add('btn-confirm-card', 'mochiy-pop-p-one-regular');
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
    return btn;
}

function fillMasterCardList(playedCards) {
    let frame = document.getElementById('frame');
    frame.innerHTML = '';
    let cardListDiv = document.createElement('div');
    cardListDiv.classList.add('scrollable-cards');
    frame.appendChild(cardListDiv);
    Object.entries(playedCards).forEach(entry => {
        const [clientId, cardText] = entry;
        let cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        let textDiv = document.createElement('div');
        textDiv.innerText = cardText;
        let chooseWinnerBtn = createChooseWinnermBtn(clientId);
        cardDiv.appendChild(textDiv);
        cardDiv.appendChild(chooseWinnerBtn);
        cardListDiv.appendChild(cardDiv);
    });
}

function createChooseWinnermBtn(clientId) {
    let btn = document.createElement('button');
    btn.classList.add('btn-winning-card', 'mochiy-pop-p-one-regular');
    btn.innerText = 'Scegli';
    btn.addEventListener('click', e => {
        const payLoad = {
            'method': 'choosing-winner',
            'gameId': sessionStorage.getItem('gameId'),
            'winner': clientId,
        }
        webSocket.send(JSON.stringify(payLoad));
    });
    return btn
}

function paintMessage(message) {
    let frame = document.getElementById('frame');
    frame.innerHTML = '';
    let p = document.createElement('p');
    p.innerHTML = message;
    frame.appendChild(p);
}