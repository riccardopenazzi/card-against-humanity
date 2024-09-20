import { webSocket } from "./main-script.js";

let btnNextCard = document.getElementById('btn-next-card');
let btnShowChooseWinner = document.getElementById('btn-show-choose-winner');
let btnSkipCard = document.getElementById('btn-skip-card');
let skipCardFrame = document.getElementById('skip-card-frame');
let internalSkipCardFrame = document.getElementById('internal-skip-card-frame');
let standardFrame = document.getElementById('standard-frame');

let playedCards = [];


document.addEventListener('DOMContentLoaded', () => {
    btnNextCard.addEventListener('click', () => {
        const payLoad = {
            'method': 'show-next-card',
            'gameId': sessionStorage.getItem('gameId'),
        }
        webSocket.send(JSON.stringify(payLoad));
    });

    btnShowChooseWinner.addEventListener('click', () => {
        const payLoad = {
            'method': 'go-to-choosing-winner',
            'gameId': sessionStorage.getItem('gameId'),
        }
        webSocket.send(JSON.stringify(payLoad));
    });

    btnSkipCard.addEventListener('click', () => {
        const payLoad = {
            'method': 'req-black-card-change',
            'gameId': sessionStorage.getItem('gameId'),
            'clientId': sessionStorage.getItem('clientId'),
        }
        webSocket.send(JSON.stringify(payLoad));
    });
});

webSocket.onmessage = receivedMessage => {
    const message = JSON.parse(receivedMessage.data);
    console.log(message);
    if (message.method === 'reconnected') {
        const payLoad = {
            'method': 'start-manche',
            'clientId': sessionStorage.getItem('clientId'),
            'gameId': sessionStorage.getItem('gameId'),
        }
        webSocket.send(JSON.stringify(payLoad));
    }

    if (message.method === 'start-manche') {
        document.getElementById('title').innerHTML = '';
        document.getElementById('title').innerHTML = 'Manche ' + message.mancheNumber;
        document.getElementById('black-card').innerText = message.blackCard;
        const isMaster = (message.masterId === sessionStorage.getItem('clientId'));
        sessionStorage.setItem('master', isMaster);
        if (isMaster) {
            if (message.allPlayersCompleted) {
                fillMasterCardList(message.playedCards);
            } else {
                paintMessage('Aspetta che i giocatori scelgano la propria carta');
            }
        } else {
            requestCardList();
        }
    }

    if (message.method === 'req-player-cards') {
        fillCardList(message.playerCards);
    }

    if (message.method === 'play-card') {
        paintMessage('Hai giocato la tua carta, ora aspetta che lo facciano tutti');
        btnSkipCard.style.display = 'none';
    }

    if (message.method === 'show-played-cards') {
        document.getElementById('frame').innerHTML = '';
        paintMessage('Ecco le carte giocate');
        playedCards = Object.values(message.playedCards);
        showSingleCard(playedCards.pop());
        const isMaster = (sessionStorage.getItem('master') === 'true');
        if (isMaster) {
            btnSkipCard.style.display = 'none';
            if (playedCards.length > 0) {
                document.getElementById('btn-next-card').style.display = 'block';
            } else {
                document.getElementById('btn-show-choose-winner').style.display = 'block';
            }
         }
    }

    if (message.method === 'show-next-card') {
        showSingleCard(playedCards.pop());
        const isMaster = (sessionStorage.getItem('master') === 'true');
        if (isMaster && playedCards.length == 0) {
            document.getElementById('btn-next-card').style.display = 'none';
            document.getElementById('btn-show-choose-winner').style.display = 'block';
        }
    }

    if (message.method === 'choosing-winner') {
        document.getElementById('single-card-frame').innerHTML = '';
        const isMaster = (sessionStorage.getItem('master') === 'true');
        if (isMaster) {
            document.getElementById('btn-show-choose-winner').style.display = 'none';
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

    if (message.method === 'req-black-card-change') {
        showSkipCardSurvey();
    }

    if (message.method === 'vote-skip-survey') {
        skipCardFrame.style.display = 'none';
        const payLoad = {
            'method': 'start-manche',
            'clientId': sessionStorage.getItem('clientId'),
            'gameId': sessionStorage.getItem('gameId'),
        }
        webSocket.send(JSON.stringify(payLoad));
    }

    if (message.method === 'check-connection') {
        const payLoad = {
            'method': 'check-connection',
            'clientId': sessionStorage.getItem('clientId'),
        }
        webSocket.send(JSON.stringify(payLoad));
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
    createScrollFeature(cardListDiv);
    frame.appendChild(cardListDiv);
    cardList.reverse().forEach((card, index) => {
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

function fillMasterCardList(playedCards) {
    let frame = document.getElementById('frame');
    frame.innerHTML = '';
    let cardListDiv = document.createElement('div');
    cardListDiv.classList.add('scrollable-cards');
    createScrollFeature(cardListDiv);
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

function showSingleCard(card) {
    let frame = document.getElementById('single-card-frame');
    frame.innerHTML = '';
    let cardDiv = document.createElement('div');
    cardDiv.classList.add('card', 'single-card');
    let textDiv = document.createElement('div');
    textDiv.innerText = card;
    cardDiv.appendChild(textDiv);
    frame.appendChild(cardDiv);

    setTimeout(() => {
        cardDiv.classList.add('visible');
    }, 300);
}

function paintMessage(message) {
    let frame = document.getElementById('frame');
    frame.innerHTML = '';
    let p = document.createElement('p');
    p.innerHTML = message;
    frame.appendChild(p);
}

function showSkipCardSurvey() {
    document.getElementById('frame').innerHTML = '';
    internalSkipCardFrame.innerHTML = '';
    let p = document.createElement('p');
    p.innerHTML = 'Sei daccordo con la scelta di saltare questa carta?';

    let btnContainer = document.createElement('div');
    btnContainer.classList.add('d-flex', 'justify-content-center', 'gap-2');

    let btnConfirm = document.createElement('button');
    btnConfirm.classList.add('btn-confirm', 'btn', 'btn-primary', 'col-12');
    btnConfirm.innerText = 'Si';
    btnConfirm.addEventListener('click', () => {
        const payLoad = {
            'method': 'vote-skip-survey',
            'clientId': sessionStorage.getItem('clientId'),
            'gameId': sessionStorage.getItem('gameId'),
            'vote': 'yes',
        }
        webSocket.send(JSON.stringify(payLoad));
    });

    let btnCancel = document.createElement('button');
    btnCancel.classList.add('btn-cancel', 'btn', 'btn-secondary', 'col-12');
    btnCancel.innerText = 'No';
    btnCancel.addEventListener('click', () => {
        const payLoad = {
            'method': 'vote-skip-survey',
            'clientId': sessionStorage.getItem('clientId'),
            'gameId': sessionStorage.getItem('gameId'),
            'vote': 'no',
        }
        webSocket.send(JSON.stringify(payLoad));
    });
    btnContainer.appendChild(btnConfirm);
    btnContainer.appendChild(btnCancel);
    internalSkipCardFrame.appendChild(p);
    internalSkipCardFrame.appendChild(btnContainer);
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

function createScrollFeature(target) {
    let isDown = false;
    let startX;
    let scrollLeft;

    target.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - target.offsetLeft;
        scrollLeft = target.scrollLeft;
        target.classList.add('grabbing');
        document.body.classList.add('no-select');
    });

    target.addEventListener('mouseleave', () => {
        isDown = false;
        document.body.classList.add('no-select');
    });

    target.addEventListener('mouseup', () => {
        isDown = false;
        document.body.classList.add('no-select');
    });

    target.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - target.offsetLeft;
        const walk = (x - startX) * 1.1;
        target.scrollLeft = scrollLeft - walk;
    });
}
