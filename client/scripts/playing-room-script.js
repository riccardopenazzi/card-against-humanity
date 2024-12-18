import { connect, send, addMessageListener } from './connection-manager.js';
import { navigateTo } from './router.js';
import { showLoadingMask, hideLoadingMask } from './loading-mask-controller.js';

const debugMode = true;

/* let btnNextCard = document.getElementById('btn-next-card'); */
let btnNextCard;
let btnShowChooseWinner;
let btnSkipCard;
let btnConfirmWinner;
let skipCardFrame = document.getElementById('skip-card-frame');
let internalSkipCardFrame = document.getElementById('internal-skip-card-frame');
let standardFrame = document.getElementById('standard-frame');
let showScoreIcon;
let btnPopupScoreClose = document.getElementById('btn-popup-score-close');

let playedCards = [];
let selectedCard = '';
let blackCard = '';
let selectedWinner = '';
let selectedCardsToChange = [];

function handleMessage(message) {
    debugMode && console.log('Received message: ', message);

    const messageHandler = {
        'start-manche': handleStartManche,
        'show-black-empty-card': handleShowBlackEmptyCard,
        'req-player-cards': handleReqPlayerCards,
        'play-card': handlePlayCard,
        'show-played-cards': handleShowPlayedCards,
        'show-next-card': handleShowNextCard,
        'choosing-winner': handleChoosingWinner,
        'show-winning-card': handleShowWinningCard,
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
        'change-player-cards': handleChangePlayerCards,
    }

    const handler = messageHandler[message.method];
    handler && handler(message);
}

function handleStartManche(message) {
    sessionStorage.removeItem('hasVoted');
    document.getElementById('standard-frame').classList.remove('hidden');
    document.getElementById('temp-div').remove();
    document.getElementById('black-card').innerText = message.blackCard;
    const isMaster = (message.masterId === sessionStorage.getItem('clientId'));
    sessionStorage.setItem('master', isMaster);
    if (isMaster) {
        document.getElementById('internal-skip-card-frame').classList.remove('hidden');
        paintMessage('Aspetta che i giocatori scelgano la propria carta');
        hideLoadingMask();
    } else {
        internalSkipCardFrame = document.getElementById('internal-skip-card-frame');
        internalSkipCardFrame.innerHTML = '';
        if (!sessionStorage.getItem('playedWhiteCardsNumber')) {
            sessionStorage.setItem('playedWhiteCardsNumber', 0);
            sessionStorage.setItem('requestedWhiteCardsNumber', message.blackCard.split("_").length - 1);
            requestCardList();
        } else {
            if (parseInt(sessionStorage.getItem('requestedWhiteCardsNumber')) - parseInt(sessionStorage.getItem('playedWhiteCardsNumber')) > 0) {
                requestCardList();
            } else {
                paintMessage(`Hai giocato la tua carta, ora aspetta che lo facciano tutti`);
            }
        }
        hideLoadingMask();
    }
}

function handleShowBlackEmptyCard(message) {
    document.getElementById('title').innerHTML = '';
    document.getElementById('title').innerHTML = 'Manche ' + message.mancheNumber;
    blackCard = message.blackCard;
    let card = createBlackCard(undefined, undefined, undefined, false);
    document.getElementById('standard-frame').classList.add('hidden');
    document.getElementById('internal-skip-card-frame').classList.add('hidden');
    let tempDiv = document.createElement('div');
    tempDiv.setAttribute('id', 'temp-div');
    //tempDiv.classList.add('black-card-empty-container');
    tempDiv.classList.add('col-12', 'd-flex', 'flex-column', 'align-items-center');
    let p = document.createElement('p');
    p.classList.add('new-amsterdam-regular', 'mb-1', 'fs-4');
    p.innerText = 'Ecco la carta di questa manche';
    tempDiv.appendChild(p);
    tempDiv.appendChild(card);
    let confirmButton = document.createElement('button');
    confirmButton.classList.add('btn-show-choose-winner', 'new-amsterdam-regular', 'mt-4');
    confirmButton.innerHTML = 'Gioca';
    confirmButton.addEventListener('click', () => {
        showLoadingMask();
        const payLoad = {
            'method': 'start-manche',
            'clientId': sessionStorage.getItem('clientId'),
            'gameId': sessionStorage.getItem('gameId'),
        }
        send(payLoad);
    })
    tempDiv.appendChild(confirmButton);
    document.getElementById('main-frame').appendChild(tempDiv);
    hideLoadingMask();
}

function handleReqPlayerCards(message) {
    fillCardList(message.playerCards);
    if (message.canRestart) {
        let restartButton = document.createElement('button');
        restartButton.classList.add('btn-show-choose-winner', 'new-amsterdam-regular', 'mt-2');
        restartButton.innerText = 'Cambia carte';
        restartButton.addEventListener('click', () => {
            restartButton.classList.add('hidden');
            document.getElementById('btn-confirm-card').innerText = 'Conferma selezione'
            Array.from(document.getElementsByClassName('selected-card')).forEach(x => {
                x.classList.remove('selected-card');
            });
            sessionStorage.setItem('isChangingCards', true);
            document.getElementById('btn-confirm-card').removeEventListener('click', btnConfirmCardToPlayAction);
            document.getElementById('btn-confirm-card').addEventListener('click', btnConfirmCardsToChangeAction);
        });
        document.getElementById('frame').appendChild(restartButton);
    }
}

function handlePlayCard(message) {
    if (parseInt(sessionStorage.getItem('requestedWhiteCardsNumber')) - parseInt(sessionStorage.getItem('playedWhiteCardsNumber')) > 0) {
        let frame = document.getElementById('frame');
        frame.innerHTML = '';
        requestCardList();
    } else {
        paintMessage('Hai giocato la tua carta, ora aspetta che lo facciano tutti');
        btnSkipCard.style.display = 'none';
    }
    hideLoadingMask();
}

function handleShowPlayedCards(message) {
    showLoadingMask();
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
    hideLoadingMask();
}

function handleShowNextCard(message) {
    showLoadingMask();
    showSingleCard(playedCards.pop());
    const isMaster = (sessionStorage.getItem('master') === 'true');
    if (isMaster && playedCards.length == 0) {
        document.getElementById('btn-next-card').style.display = 'none';
        btnShowChooseWinner.classList.remove('hidden');
    }
    hideLoadingMask();
}

function handleChoosingWinner(message) {
    showLoadingMask();
    document.getElementById('single-card-frame').innerHTML = '';
    const isMaster = (sessionStorage.getItem('master') === 'true');
    if (isMaster) {
        btnShowChooseWinner.classList.add('hidden');
        fillMasterCardList(message.playedCards);
    } else {
        paintMessage('Il master sta scegliendo il vincitore');
    }
    hideLoadingMask();
}

function handleShowWinningCard(message) {
    showLoadingMask();
    document.getElementById('frame').innerHTML = '';
    paintMessage(`Vincitore manche: ${message.mancheWinner}`);
    showSingleCard(message.cardText);
    btnConfirmWinner.classList.remove('hidden');
    hideLoadingMask();
}

function handleWatchScore(message) {
    showLoadingMask();
    navigateTo('score');
}

function handleWin(message) {
    showLoadingMask();
    navigateTo('final-ranking');
}

function handleReqBlackCardChange(message) {
    showSkipCardSurvey();
}

function handleVoteSkipSurvey(message) {
    message.result && sessionStorage.removeItem('playedWhiteCardsNumber');
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
    navigateTo('score');
}

function handleInvalidClientId(message) {
    navigateTo('');
}

function handleServerError(message) {
    sessionStorage.clear();
    navigateTo('');
}

function handleConnectionTrouble(message) {
    showPopup('single-disconnection-popup');
}

function handleConnectionTroubleManaged(message) {
    hidePopup('single-disconnection-popup');
    hidePopup('disconnection-popup');
}

function handlePlayerDisconnected(message) {
    hidePopup('single-disconnection-popup');
    showPopup('disconnection-popup');
}

function handlePlayerDisconnectedManaged(message) {
    hidePopup('disconnection-popup');
}

function handleChangePlayerCards(message) {
    let btn = document.getElementById('btn-confirm-card');
    document.getElementById('frame').innerHTML = '';
    fillCardList(message.playerCards);
    sessionStorage.removeItem('isChangingCards');
    btn.removeEventListener('click', btnConfirmCardsToChangeAction);
    btn.addEventListener('click', btnConfirmCardToPlayAction);
    hideLoadingMask();
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
    cardListDiv.setAttribute('id', 'scrollable-cards');
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
    if (!sessionStorage.getItem('isChangingCards')) {
        const selectedCardElement = document.getElementsByClassName('selected-card')[0];
        if (selectedCardElement) {
            selectedCardElement.classList.remove('selected-card');
        }
        selectedCard = card;
        cardDiv.classList.add('selected-card');
    } else {
        let index = selectedCardsToChange.findIndex(x => x == card);
        if (index != -1) {
            cardDiv.classList.remove('selected-card');
            selectedCardsToChange.splice(index, 1);
        } else {
            cardDiv.classList.add('selected-card');
        selectedCardsToChange.push(card);
        }
    }
}

function fillMasterCardList(playedCards) {
    let frame = document.getElementById('frame');
    frame.innerHTML = '';
    let cardListDiv = document.createElement('div');
    cardListDiv.setAttribute('id', 'played-card-tutorial');
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

function createBlackCard(card, singleCard = false, clientId, replaceUnderscore = true) {
    let cardText = blackCard;
    if (replaceUnderscore) {
        card.forEach(card => {
            let sentenceTransformed = modifyCardText(card.cardText, cardText);
            let underscoreIndex = cardText.indexOf("_");
            cardText = cardText.slice(0, underscoreIndex) + `<span class="underline-text">${sentenceTransformed}</span>` + " " + cardText.slice(underscoreIndex + 1);
        })
        ;
        cardText = cardText.charAt(0).toUpperCase() + cardText.slice(1);
    }
   /*  let cardTextTranformed = modifyCardText(card);
    console.log(cardTextTranformed);
    let cardText = blackCard.replace(/_/g, `<span class="underline-text">${cardTextTranformed}</span>`);
    console.log(cardText); */
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
    (!singleCard && replaceUnderscore) && cardDiv.addEventListener('click', () => handleBlackCardClick(clientId, cardDiv));
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

function modifyCardText(text, currentBlackCard) {
    console.log(text)
    let newText = text;
    let underscoreIndex = currentBlackCard.indexOf('_');
    /*If present remove last . */
    if (newText.endsWith('.')) {
        newText = newText.slice(0, -1);
    }
    /*First char upper case if black card start with _ or if char before _ is ? or ! */
    if (currentBlackCard.startsWith(' _') || 
            currentBlackCard.startsWith('_') ||
            (underscoreIndex - 2 >= 0 && currentBlackCard[underscoreIndex - 2] === '?') ||
            (underscoreIndex - 2 >= 0 && currentBlackCard[underscoreIndex - 1] === '?') ||
            (underscoreIndex - 2 >= 0 && currentBlackCard[underscoreIndex - 2] === '!') ||
            (underscoreIndex - 2 >= 0 && currentBlackCard[underscoreIndex - 1] === '!') ) {
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
    btnConfirm.classList.add('btn-success', 'btn', 'col-12');
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
    btnCancel.classList.add('btn-danger', 'btn', 'col-12');
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
    const tutorialActive = sessionStorage.getItem('tutorialActive');
    let btn = document.createElement('button');
    let requestedWhiteCardsNumber = parseInt(sessionStorage.getItem('requestedWhiteCardsNumber'));
    let playedWhiteCardsNumber = parseInt(sessionStorage.getItem('playedWhiteCardsNumber'));
    btn.setAttribute('id', 'btn-confirm-card');
    btn.classList.add('btn-confirm-card');
    /* btn.innerText = `Conferma ${tutorialActive ? 1 : playedWhiteCardsNumber + 1}° carta`; */
    btn.innerText = `Conferma ${tutorialActive ? '' : requestedWhiteCardsNumber == 1 ? '' : `${(playedWhiteCardsNumber + 1)}° carta`}`;
    console.log('aggiuugo')
    btn.addEventListener('click', btnConfirmCardToPlayAction);
    console.log(btn)
    return btn;
}

function btnConfirmCardToPlayAction() {
    console.log('Premuto')
    let playedWhiteCardsNumber = parseInt(sessionStorage.getItem('playedWhiteCardsNumber'));
    let requestedWhiteCardsNumber = parseInt(sessionStorage.getItem('requestedWhiteCardsNumber'));
    if (selectedCard) {
        let error = false;
        if (selectedCard === CardVariants.EMPTY_CARD) {
            if (!document.getElementById('empty-card-input').value) {
                document.getElementById('empty-card-error-message').classList.remove('hidden');
                error = true;
            } 
        }
        if (!error) {
            showLoadingMask();
            const card = {
                standard: !isCardSpecial(selectedCard),
                cardText: isCardSpecial(selectedCard) ? document.getElementById('empty-card-input').value : selectedCard,
            }
            const payLoad = {
                'method': 'play-card',
                'clientId': sessionStorage.getItem('clientId'),
                'gameId': sessionStorage.getItem('gameId'),
                // 'cardText': selectedCard === CardVariants.EMPTY_CARD ? document.getElementById('empty-card-input').value : selectedCard,
                'card': card,
                'isEmptyCard': selectedCard === CardVariants.EMPTY_CARD,
            };
            playedWhiteCardsNumber++;
            sessionStorage.setItem('playedWhiteCardsNumber', playedWhiteCardsNumber);
            /* sessionStorage.setItem('hasPlayedCard', true); */
            send(payLoad);
        }
    }
}

function btnConfirmCardsToChangeAction() {
    showLoadingMask();
    const payLoad = {
        'method': 'change-player-cards',
        'cardsList': selectedCardsToChange,
        'clientId': sessionStorage.getItem('clientId'),
        'gameId': sessionStorage.getItem('gameId'),
    }
    send(payLoad);
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
    btn.classList.add('btn-winning-card', 'new-amsterdam-regular');
    btn.setAttribute('id', 'btn-winning-card');
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
    if (sessionStorage.getItem('hasRequestedSkip')) {
        return;
    }
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
}

function createBtnNextCard() {
    const container = document.getElementById('single-card-frame');
    btnNextCard = document.createElement('button');
    btnNextCard.classList.add('btn-next-card', 'new-amsterdam-regular', 'mt-2', 'hidden');
    btnNextCard.setAttribute('id', 'btn-next-card');
    btnNextCard.innerText = 'Prossima carta';
    btnNextCard.addEventListener('click', () => {
        showLoadingMask();
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
        showLoadingMask();
        const payLoad = {
            'method': 'go-to-choosing-winner',
            'gameId': sessionStorage.getItem('gameId'),
        }
        send(payLoad);
    });
    container.insertAdjacentElement("afterend", btnShowChooseWinner);
}

function createBtnConfirmWinner() {
    const container = document.getElementById('single-card-frame');
    btnConfirmWinner = document.createElement('button');
    btnConfirmWinner.classList.add('btn-show-choose-winner', 'new-amsterdam-regular', 'mt-2', 'hidden');
    btnConfirmWinner.setAttribute('id', 'btn-confirm-winner');
    btnConfirmWinner.innerText = 'Conferma';
    btnConfirmWinner.addEventListener('click', () => {
        const payLoad = {
            'method': 'exec-point-count',
            'gameId': sessionStorage.getItem('gameId'),
        }
        btnConfirmWinner.setAttribute('disabled', 'true');
        sessionStorage.setItem('hasConfirmed', true);
        send(payLoad);
    });
    container.insertAdjacentElement("afterend", btnConfirmWinner);
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

function paintTutorialScreen() {
    if (!sessionStorage.getItem('masterMode')) {
        sessionStorage.setItem('masterMode', true);
        sessionStorage.setItem('notShowPlayed', true);
    } else if (sessionStorage.getItem('notShowPlayed')) {
        sessionStorage.removeItem('notShowPlayed');
    } else {
        sessionStorage.removeItem('masterMode');
    }
    const message = {
        'blackCard': "_ ecco perchè ho male ovunque.",
        'mancheNumber': 1,
        'master': sessionStorage.getItem('masterMode'),
        'showPlayed': !sessionStorage.getItem('notShowPlayed'),
    }
    const isMaster = message.master;
    const showPlayed = message.showPlayed;
    document.getElementById('title').innerHTML = '';
    document.getElementById('title').innerHTML = 'Manche ' + message.mancheNumber;
    document.getElementById('black-card').innerText = message.blackCard;
    blackCard = message.blackCard;
    if (isMaster) {
        if (!showPlayed) {
            paintMessage('Aspetta che i giocatori scelgano la propria carta');
        } else {
            let frame = document.getElementById('frame');
            frame.innerHTML = '';
            let cardList = {
                a: [{
                    c: '',
                    cardText: "Stupro e Saccheggio."
                }],
                b: [{
                    c: '',
                    cardText: "Un montaggio pallavolistico omoerotico."
                }],
            }
            fillMasterCardList(cardList);
        }
    } else {
        let frame = document.getElementById('frame');
        frame.innerHTML = '';
        internalSkipCardFrame = document.getElementById('internal-skip-card-frame')
        internalSkipCardFrame.innerHTML = '';
        let cardList = [
			"Un montaggio pallavolistico omoerotico.",
			"Non fregarsene un cazzo del Terzo Mondo.",
			"Sexting.",
			"Pornostar.",
			"Avere l'approvazione di Lapo Elkan.",
			"Stupro e Saccheggio.",
        ]
        fillCardList(cardList);
    }
}

function startScript() {
    createBtnSkipCard();
    createBtnNextCard();
    createBtnShowChooseWinner();
    createBtnConfirmWinner();
    createShowScoreIcon();
    
    btnPopupScoreClose?.addEventListener('click', () => {
        const modalElement = document.getElementById('popup-score');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide(); // Nasconde la modale correttamente
        }
    });
    addMessageListener(handleMessage);
    const tutorialActive = sessionStorage.getItem('tutorialActive');
    if (!tutorialActive) {
        const payLoad = {
            'method': 'show-black-empty-card',
            'clientId': sessionStorage.getItem('clientId'),
            'gameId': sessionStorage.getItem('gameId'),
        }
        send(payLoad);
    } else {
        paintTutorialScreen();
    }
}

export { startScript, paintTutorialScreen };