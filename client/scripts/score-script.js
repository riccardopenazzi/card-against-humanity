import { connect, send, addMessageListener } from './connection-manager.js';
import { hideLoadingMask, showLoadingMask } from './loading-mask-controller.js';
import { navigateTo } from './router.js';

const debugMode = true;

function handleMessage(message) {
    debugMode && console.log('Received message: ', message);

    const messageHandler = {
        'req-score': handleReqScore,
        'new-manche': handleNewManche,
        'counter-ready-players': handleCounterReadyPlayers,
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

function handleReqScore(message) {
    sessionStorage.removeItem('hasConfirmed');
    sessionStorage.removeItem('playedWhiteCardsNumber');
    sessionStorage.removeItem('requestedWhiteCardsNumber');
    showScores(message.score, message.readyPlayers);
    hideLoadingMask();
}

function handleNewManche(message) {
    showLoadingMask();
    sessionStorage.removeItem('hasVoted');
    sessionStorage.removeItem('hasRequestedSkip');
    navigateTo('playing-room');
}

function handleCounterReadyPlayers(message) {
    document.getElementById('player-counter').innerText = 'Giocatori pronti: ' + message.readyPlayers;
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
}

function handlePlayerDisconnected(message) {
    hidePopup('single-disconnection-popup');
    showPopup('disconnection-popup');
}

function handlePlayerDisconnectedManaged(message) {
    hidePopup('disconnection-popup');
}

function showScores(scores, readyPlayers) {
    document.getElementById('player-counter').innerText = 'Giocatori pronti: ' + readyPlayers;
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
    if (!sessionStorage.getItem('hasVoted')) {
        btn.addEventListener('click', e => {
            sessionStorage.setItem('hasVoted', true);
            btn.setAttribute('disabled', 'true');
            const payLoad = {
                'method': 'new-manche',
                'gameId': sessionStorage.getItem('gameId'),
            }
            send(payLoad);
        });
    } else {
        btn.setAttribute('disabled', 'true');
    }
    scoreRow.appendChild(btn);
}

function startScript() {
    addMessageListener(handleMessage);
    const payLoad = {
        'method': 'req-score',
        'clientId': sessionStorage.getItem('clientId'),
        'gameId': sessionStorage.getItem('gameId'),
    }
    send(payLoad);
}

export { startScript };