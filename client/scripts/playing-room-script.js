const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const webSocketPort = window.location.port;
let webSocket = new WebSocket(`${protocol}://${window.location.hostname}:${webSocketPort}`);

const debugMode = true;

let btnNextCard = document.getElementById('btn-next-card');
let btnShowChooseWinner = document.getElementById('btn-show-choose-winner');
let btnSkipCard = document.getElementById('btn-skip-card');
let skipCardFrame = document.getElementById('skip-card-frame');
let internalSkipCardFrame = document.getElementById('internal-skip-card-frame');
let standardFrame = document.getElementById('standard-frame');
let showScoreIcon = document.getElementById('show-score-icon');
let btnPopupScoreClose = document.getElementById('btn-popup-score-close');

let playedCards = [];
let selectedCard = '';
let blackCard = '';
let selectedWinner = '';

webSocket.onopen = () => {
    const clientId = sessionStorage.getItem('clientId');
    if (!clientId) {
       window.location.href = '/';
    } else {
        const payLoad = {
            'method': 'connect-again',
            'clientId': clientId,
        }
        webSocket.send(JSON.stringify(payLoad));
    }
}

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

    showScoreIcon.addEventListener('click', () => {
        const payLoad = {
            'method': 'req-score',
            'clientId': sessionStorage.getItem('clientId'),
            'gameId': sessionStorage.getItem('gameId'),
        }
        webSocket.send(JSON.stringify(payLoad));
    });

    btnPopupScoreClose.addEventListener('click', () => {
        const modalElement = document.getElementById('popup-score');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide(); // Nasconde la modale correttamente
        }
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
        blackCard = message.blackCard;
        const isMaster = (message.masterId === sessionStorage.getItem('clientId'));
        sessionStorage.setItem('master', isMaster);
        if (isMaster) {
            if (message.allPlayersCompleted) {
                fillMasterCardList(message.playedCards);
            } else {
                paintMessage('Aspetta che i giocatori scelgano la propria carta');
            }
        } else {
            if (sessionStorage.getItem('hasPlayedCard')) {
                paintMessage('Hai giocato la tua carta, ora aspetta che lo facciano tutti');
                btnSkipCard.style.display = 'none';
            } else {
                requestCardList();
            }
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
        sessionStorage.removeItem('hasPlayedCard');
        window.location.href = '/score';
    }

    if (message.method === 'win') {
        window.location.href = '/final-ranking';
    }

    if (message.method === 'req-black-card-change') {
        showSkipCardSurvey();
    }

    if (message.method === 'vote-skip-survey') {
        message.result && sessionStorage.removeItem('hasPlayedCard');
        skipCardFrame.style.display = 'none';
        const payLoad = {
            'method': 'start-manche',
            'clientId': sessionStorage.getItem('clientId'),
            'gameId': sessionStorage.getItem('gameId'),
        }
        webSocket.send(JSON.stringify(payLoad));
    }

    if (message.method === 'req-score') {
        showScores(message.score);
        const modalElement = document.getElementById('popup-score');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }

    if (message.method === 'check-connection') {
        const payLoad = {
            'method': 'check-connection',
            'clientId': sessionStorage.getItem('clientId'),
        }
        webSocket.send(JSON.stringify(payLoad));
    }

    if (message.method === 'invalid-clientId') {
        window.location.href = '/';
    }

    if (message.method === 'server-error') {
        window.location.href = '/';
    }

    if (message.method === 'connection-trouble') {
        showPopup('single-disconnection-popup');
    }

    if (message.method === 'player-disconnected') {
        hidePopup('single-disconnection-popup')
        showPopup('disconnection-popup');
    }

    if (message.method === 'player-disconnection-managed') {
        hidePopup('disconnection-popup');
    }

    if (message.method === 'connection-trouble-managed') {
        hidePopup('single-disconnection-popup');
    }

    if (message.method === 'skip-manche') {
        sessionStorage.removeItem('hasPlayedCard');
        location.href = '/score';
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

    const emptyCard = cardList.filter(card => card === CardVariants.EMPTY_CARD);
    const otherCards = cardList.filter(card => card !== CardVariants.EMPTY_CARD);

    otherCards.reverse().forEach(card => {
        cardListDiv.appendChild(createCard(card));
    });

    if (emptyCard.length > 0) {
        cardListDiv.insertBefore(createCard(emptyCard[0]), cardListDiv.firstChild);
    }

    const btnConfirm = createConfirmBtn();
    frame.appendChild(btnConfirm);
}


function createCard(card) {
    let cardDiv = document.createElement('div');
    cardDiv.classList.add('card', 'white-card');
    let internalCardElement;
    if (card === CardVariants.EMPTY_CARD) {
        internalCardElement = document.createElement('textarea');
        internalCardElement.setAttribute('placeholder', 'Completa la carta');
        internalCardElement.setAttribute('id', 'empty-card-input');
        internalCardElement.rows = 8;
        cardDiv.classList.add('empty-card');
    } else {
        internalCardElement = document.createElement('div');
        internalCardElement.innerText = card;
    }
    cardDiv.appendChild(internalCardElement);
    cardDiv.addEventListener('click', () => handleCardClick(card, cardDiv, internalCardElement));
    const bottomDiv = document.createElement('div');
    bottomDiv.classList.add('bottom-div');
    bottomDiv.appendChild(createCardSign());
    cardDiv.appendChild(bottomDiv);
    return cardDiv;
}

function handleCardClick(card, cardDiv, internalCardElement) {
    const selectedCardElement = document.getElementsByClassName('selected-card')[0];
    if (selectedCardElement) {
        selectedCardElement.classList.remove('selected-card');
    }
    selectedCard = card;
    cardDiv.classList.add('selected-card');
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
        let card = createBlackCard(cardText, false, clientId);
        cardListDiv.appendChild(card);
    });
    let chooseWinnerBtn = createChooseWinnermBtn();
    frame.appendChild(chooseWinnerBtn);
}

function showSingleCard(card) {
    document.getElementById('standard-frame').innerHTML != '' && (document.getElementById('standard-frame').innerHTML = '');
    let frame = document.getElementById('single-card-frame');
    frame.innerHTML = '';
    let cardDiv = createBlackCard(card, true);
    frame.appendChild(cardDiv);
    setTimeout(() => {
        cardDiv.classList.add('visible');
    }, 300);
}

function createBlackCard(card, singleCard = false, clientId) {
    let cardTextTranformed = modifyCardText(card);
    console.log(cardTextTranformed);
    let cardText = blackCard.replace(/_/g, `<span class="underline-text">${cardTextTranformed}</span>`);
    console.log(cardText);
    cardText = cardText.charAt(0).toUpperCase() + cardText.slice(1);
    console.log(cardText);
    let cardDiv = document.createElement('div');
    cardDiv.classList.add('card', 'black-card');
    singleCard && cardDiv.classList.add('single-card');
    let textDiv = document.createElement('div');
    textDiv.innerHTML = cardText;
    const bottomDiv = document.createElement('div');
    bottomDiv.classList.add('bottom-div');
    bottomDiv.appendChild(createCardSign());
    cardDiv.appendChild(textDiv);
    cardDiv.appendChild(bottomDiv);
    console.log('black')
    console.log(clientId);
    !singleCard && cardDiv.addEventListener('click', () => handleBlackCardClick(clientId, cardDiv));
    return cardDiv;
}

function handleBlackCardClick(clientId, cardDiv) {
    console.log(clientId);
    const selectedCardElement = document.getElementsByClassName('selected-card')[0];
    if (selectedCardElement) {
        selectedCardElement.classList.remove('selected-card');
    }
    selectedWinner = clientId;
    cardDiv.classList.add('selected-card');
}

function modifyCardText(text) {
    console.log(text)
    let newText = text;
    let underscoreIndex = blackCard.indexOf('_');
    /*If present remove last . */
    if (newText.endsWith('.')) {
        newText = newText.slice(0, -1);
    }
    /*First char upper case if black card start with _ or if char before _ is ? or ! */
    if (blackCard.startsWith(' _') || 
            blackCard.startsWith('_') ||
            (underscoreIndex - 2 >= 0 && blackCard[underscoreIndex - 2] === '?') ||
            (underscoreIndex - 2 >= 0 && blackCard[underscoreIndex - 1] === '?') ||
            (underscoreIndex - 2 >= 0 && blackCard[underscoreIndex - 2] === '!') ||
            (underscoreIndex - 2 >= 0 && blackCard[underscoreIndex - 1] === '!') ) {
        (newText = newText.charAt(0).toUpperCase() + newText.slice(1));
    } else {
        newText = newText.charAt(0).toLowerCase() + newText.slice(1);
    }
    console.log(text + ' ' + newText);
    return newText;
}


function paintMessage(message) {
    let frame = document.getElementById('frame');
    frame.innerHTML = '';
    let p = document.createElement('p');
    p.innerHTML = message;
    frame.appendChild(p);
}

function showScores(scores) {
    let popupScoreBody = document.getElementById('popup-score-body');
    popupScoreBody.innerHTML = '';
    scores.forEach(score => {
        const scoreElement = document.createElement('div');
        scoreElement.classList.add('d-flex', 'justify-content-between', 'mb-2', 'text-dark');
        scoreElement.innerHTML = `<strong>${score.username}</strong> <span>${score.score}</span>`;
        popupScoreBody.appendChild(scoreElement);
    });
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

function createConfirmBtn(card, emptyCard = false) {
    let btn = document.createElement('button');
    btn.classList.add('btn-confirm-card');
    btn.innerText = 'Conferma';
    btn.addEventListener('click', e => {
        if (selectedCard) {
            const payLoad = {
                'method': 'play-card',
                'clientId': sessionStorage.getItem('clientId'),
                'gameId': sessionStorage.getItem('gameId'),
                'cardText': selectedCard === CardVariants.EMPTY_CARD ? document.getElementById('empty-card-input').value : selectedCard,
                'isEmptyCard': selectedCard === CardVariants.EMPTY_CARD,
            };
            sessionStorage.setItem('hasPlayedCard', true);
            webSocket.send(JSON.stringify(payLoad));
        }
    });
    return btn;
}

function createChooseWinnermBtn() {
    let btn = document.createElement('button');
    btn.classList.add('btn-winning-card', 'mochiy-pop-p-one-regular');
    btn.innerText = 'Scegli';
    btn.addEventListener('click', e => {
        if (selectedWinner) {
            const payLoad = {
                'method': 'choosing-winner',
                'gameId': sessionStorage.getItem('gameId'),
                'winner': selectedWinner,
            }
            webSocket.send(JSON.stringify(payLoad));
        }
    });
    return btn;
}

function createCardSign() {
    const div = document.createElement('div');
    div.classList.add('card-sign');
    const icon = document.createElement('i');
    icon.classList.add('bi', 'bi-code-slash', 'card-sign-icon');
    div.appendChild(icon);
    const sign = document.createElement('div');
    sign.classList.add('card-sign-text');
    sign.innerText = 'Dev against humanity';
    div.appendChild(sign);
    return div;
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

function emptyCardAction() {
    let text = document.getElementById('empty-card-input');

}

function showPopup(popupId) {
    document.getElementById(popupId).classList.remove('hidden');
}

function hidePopup(popupId) {
    document.getElementById(popupId).classList.add('hidden');
}