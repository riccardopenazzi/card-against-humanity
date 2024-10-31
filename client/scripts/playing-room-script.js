import { connect, send, addMessageListener } from './connection-manager.js';
import { navigateTo } from './router.js';

const debugMode = true;

/* let btnNextCard = document.getElementById('btn-next-card'); */
let btnNextCard;
let btnShowChooseWinner;
let btnSkipCard;
let skipCardFrame = document.getElementById('skip-card-frame');
let internalSkipCardFrame = document.getElementById('internal-skip-card-frame');
let standardFrame = document.getElementById('standard-frame');
let showScoreIcon;
let btnPopupScoreClose = document.getElementById('btn-popup-score-close');

let playedCards = [];
let selectedCard = '';
let blackCard = '';
let selectedWinner = '';

function handleMessage(message) {
    debugMode && console.log('Received message: ', message);

    const messageHandler = {
        'start-manche': handleStartManche,
        'req-player-cards': handleReqPlayerCards,
        'play-card': handlePlayCard,
        'show-played-cards': handleShowPlayedCards,
        'show-next-card': handleShowNextCard,
        'choosing-winner': handleChoosingWinner,
        'watch-score': handleWatchScore,
        'win': handleWin,
        'req-black-card-change': handleReqBlackCardChange,
        'vote-skip-survey': handleVoteSkipSurvey,
        'req-score': handleReqScore,
        'skip-manche': handleSkipManche,
        'invalid-clientId': handleInvalidClientId,
        'server-error': handleServerError,
        'connection-trouble': handleConnectionTrouble,
        'connection-trouble-managed': handleConnectionTroubleManaged,
        'player-disconnected': handlePlayerDisconnected,
        'player-disconnection-managed': handlePlayerDisconnectedManaged,
    }

    const handler = messageHandler[message.method];
    handler && handler(message);
}

function handleStartManche(message) {
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
        internalSkipCardFrame = document.getElementById('internal-skip-card-frame')
        internalSkipCardFrame.innerHTML = '';
        console.log('nascoto')
        if (sessionStorage.getItem('hasPlayedCard')) {
            paintMessage('Hai giocato la tua carta, ora aspetta che lo facciano tutti');
            /* document.getElementById('btn-skip-card').classList.add */
        } else {
            requestCardList();
        }
    }
}

function handleReqPlayerCards(message) {
    fillCardList(message.playerCards);
}

function handlePlayCard(message) {
    paintMessage('Hai giocato la tua carta, ora aspetta che lo facciano tutti');
    btnSkipCard.style.display = 'none';
}

function handleShowPlayedCards(message) {
    document.getElementById('frame').innerHTML = '';
    paintMessage('Ecco le carte giocate');
    playedCards = Object.values(message.playedCards);
    showSingleCard(playedCards.pop());
    const isMaster = (sessionStorage.getItem('master') === 'true');
    if (isMaster) {
        btnSkipCard.style.display = 'none';
        if (playedCards.length > 0) {
            btnNextCard.classList.remove('hidden');
        } else {
            btnShowChooseWinner.classList.remove('hidden');
        }
    }
}

function handleShowNextCard(message) {
    showSingleCard(playedCards.pop());
    const isMaster = (sessionStorage.getItem('master') === 'true');
    if (isMaster && playedCards.length == 0) {
        document.getElementById('btn-next-card').style.display = 'none';
        btnShowChooseWinner.classList.remove('hidden');
    }
}

function handleChoosingWinner(message) {
    document.getElementById('single-card-frame').innerHTML = '';
    const isMaster = (sessionStorage.getItem('master') === 'true');
    if (isMaster) {
        btnShowChooseWinner.classList.add('hidden');
        fillMasterCardList(message.playedCards);
    } else {
        paintMessage('Il master sta scegliendo il vincitore');
    }
}

function handleWatchScore(message) {
    sessionStorage.removeItem('hasPlayedCard');
    navigateTo('/score');
}

function handleWin(message) {
    navigateTo('/final-ranking');
}

function handleReqBlackCardChange(message) {
    showSkipCardSurvey();
}

function handleVoteSkipSurvey(message) {
    message.result && sessionStorage.removeItem('hasPlayedCard');
    skipCardFrame = document.getElementById('skip-card-frame');
    skipCardFrame.style.display = 'none';
    /* skipCardFrame.innerHTML = ''; */
    const payLoad = {
        'method': 'start-manche',
        'clientId': sessionStorage.getItem('clientId'),
        'gameId': sessionStorage.getItem('gameId'),
    }
    send(payLoad);
}

function handleReqScore(message) {
    showScores(message.score);
    const modalElement = document.getElementById('popup-score');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

function handleSkipManche(message) {
    sessionStorage.removeItem('hasPlayedCard');
    navigateTo('/score');
}

function handleInvalidClientId(message) {
    navigateTo('/');
}

function handleServerError(message) {
    sessionStorage.clear();
    navigateTo('/');
}

function handleConnectionTrouble(message) {
    showPopup('single-disconnection-popup');
}

function handleConnectionTroubleManaged(message) {
    hidePopup('single-disconnection-popup');
}

function handlePlayerDisconnected(message) {
    hidePopup('single-disconnection-popup');
    showPopup('disconnection-popup');
}

function handlePlayerDisconnectedManaged(message) {
    hidePopup('disconnection-popup');
}

function requestCardList() {
    const payLoad = {
        'method': 'req-player-cards',
        'gameId': sessionStorage.getItem('gameId'),
        'clientId': sessionStorage.getItem('clientId'),
    }
    send(payLoad);
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
    frame.appendChild(createEmptyCardErrorMessage());

}


function createCard(card) {
    let cardDiv = document.createElement('div');
    cardDiv.classList.add('card', 'white-card');
    let internalCardElement;
    if (card === CardVariants.EMPTY_CARD) {
        internalCardElement = document.createElement('textarea');
        internalCardElement.setAttribute('placeholder', 'Completa la carta');
        internalCardElement.setAttribute('id', 'empty-card-input');
        internalCardElement.rows = 10;
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
    sessionStorage.setItem('hasRequestedSkip', true)
    document.getElementById('frame').innerHTML = '';
    console.log(internalSkipCardFrame);
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
        send(payLoad);
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
        send(payLoad);
    });
    btnContainer.appendChild(btnConfirm);
    btnContainer.appendChild(btnCancel);
    internalSkipCardFrame.appendChild(p);
    internalSkipCardFrame.appendChild(btnContainer);
    console.log('Fine paint skip card survey')
}

function createConfirmBtn(card, emptyCard = false) {
    let btn = document.createElement('button');
    btn.classList.add('btn-confirm-card');
    btn.innerText = 'Conferma';
    btn.addEventListener('click', e => {
        if (selectedCard) {
            let error = false;
            if (selectedCard === CardVariants.EMPTY_CARD) {
                if (!document.getElementById('empty-card-input').value) {
                    document.getElementById('empty-card-error-message').classList.remove('hidden');
                    error = true;
                } 
            }
            if (!error) {
                const payLoad = {
                    'method': 'play-card',
                    'clientId': sessionStorage.getItem('clientId'),
                    'gameId': sessionStorage.getItem('gameId'),
                    'cardText': selectedCard === CardVariants.EMPTY_CARD ? document.getElementById('empty-card-input').value : selectedCard,
                    'isEmptyCard': selectedCard === CardVariants.EMPTY_CARD,
                };
                sessionStorage.setItem('hasPlayedCard', true);
                send(payLoad);
            }
        }
    });
    return btn;
}

function createEmptyCardErrorMessage() {
    let p = document.createElement('p');
    p.innerText = "La carta da completare non può essere vuota";
    p.setAttribute('id', 'empty-card-error-message');
    p.classList.add('empty-card-error-message', 'hidden');
    console.log('p aggiunto');
    return p;
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
            send(payLoad);
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

function createBtnSkipCard() {
    console.log(sessionStorage.getItem('master') === 'false')
    if (sessionStorage.getItem('hasRequestedSkip')) {
        return;
    }
    console.log(internalSkipCardFrame)
    internalSkipCardFrame = document.getElementById('internal-skip-card-frame')
    internalSkipCardFrame.innerHTML = '';
    btnSkipCard = document.createElement('button');
    btnSkipCard.classList.add('btn-skip-card', 'new-amsterdam-regular', 'mt-2');
    btnSkipCard.setAttribute('id', 'btn-skip-card');
    btnSkipCard.innerText = 'Salta carta';
    btnSkipCard.addEventListener('click', () => {
        const payLoad = {
            'method': 'req-black-card-change',
            'gameId': sessionStorage.getItem('gameId'),
            'clientId': sessionStorage.getItem('clientId'),
        }
        send(payLoad);
    });
    internalSkipCardFrame.appendChild(btnSkipCard);
    console.log(document.getElementById('btn-skip-card'))
}

function createBtnNextCard() {
    const container = document.getElementById('single-card-frame');
    btnNextCard = document.createElement('button');
    btnNextCard.classList.add('btn-next-card', 'new-amsterdam-regular', 'mt-2', 'hidden');
    btnNextCard.setAttribute('id', 'btn-next-card');
    btnNextCard.innerText = 'Prossima carta';
    btnNextCard.addEventListener('click', () => {
        console.log('click su nextcard');
        const payLoad = {
            'method': 'show-next-card',
            'gameId': sessionStorage.getItem('gameId'),
        }
        send(payLoad);
    });
    container.insertAdjacentElement("afterend", btnNextCard);
}

function createBtnShowChooseWinner() {
    const container = document.getElementById('single-card-frame');
    btnShowChooseWinner = document.createElement('button');
    btnShowChooseWinner.classList.add('btn-show-choose-winner', 'new-amsterdam-regular', 'mt-2', 'hidden');
    btnShowChooseWinner.setAttribute('id', 'btn-show-choose-winner');
    btnShowChooseWinner.innerText = 'Vai alla scelta vincitore';
    btnShowChooseWinner.addEventListener('click', () => {
        const payLoad = {
            'method': 'go-to-choosing-winner',
            'gameId': sessionStorage.getItem('gameId'),
        }
        send(payLoad);
    });
    container.insertAdjacentElement("afterend", btnShowChooseWinner);
}

function createShowScoreIcon() {
    const container = document.getElementById('main-frame');
    let row = document.createElement('div');
    row.classList.add('row');
    let iconContainer = document.createElement('div');
    iconContainer.classList.add('col-12', 'd-flex', 'justify-content-end');
    showScoreIcon = document.createElement('i');
    showScoreIcon.classList.add('bi', 'bi-trophy', 'show-score-icon', 'mb-3');
    showScoreIcon.setAttribute('id', 'show-score-icon');
    showScoreIcon.addEventListener('click', () => {
        const payLoad = {
            'method': 'req-score',
            'clientId': sessionStorage.getItem('clientId'),
            'gameId': sessionStorage.getItem('gameId'),
        }
        send(payLoad);
    });
    iconContainer.appendChild(showScoreIcon);
    row.appendChild(iconContainer);
    container.insertBefore(row, container.firstChild);
    console.log(document.getElementById('btn-skip-card'))

}

function startScript() {
    console.log('Start script chiamata')
    createBtnSkipCard();
    createBtnNextCard();
    createBtnShowChooseWinner();
    createShowScoreIcon();
    
    btnPopupScoreClose.addEventListener('click', () => {
        const modalElement = document.getElementById('popup-score');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide(); // Nasconde la modale correttamente
        }
    });
    addMessageListener(handleMessage);
    console.log('Preparo start-manche')
    const payLoad = {
        'method': 'start-manche',
        'clientId': sessionStorage.getItem('clientId'),
        'gameId': sessionStorage.getItem('gameId'),
    }
    send(payLoad);
}

export { startScript };