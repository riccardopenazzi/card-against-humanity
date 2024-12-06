import { connect, send, addMessageListener } from './connection-manager.js';
import { navigateTo } from './router.js';

const debugMode = true;

function handleMessage(message) {
    debugMode && console.log('Received message: ', message);

    const messageHandler = {
        'req-score': handleReqScore,
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
    showFinalRanking(message.score);
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

function showFinalRanking(scores) {
    console.log('Stampo')
    const maxScore = Math.max(...scores.map(score => score.score));
    const container = document.getElementById('ranking-container');
    const sortedScores = [...scores].sort((a, b) => b.score - a.score);
    const appearanceOrder = [...scores].sort((a, b) => a.score - b.score);
    
    sortedScores.forEach((score, index) => {
        const row = document.createElement('div');
        row.classList.add('ranking-row');
    
        const usernameDiv = document.createElement('div');
        usernameDiv.classList.add('username');
        usernameDiv.innerText = score.username;
        row.appendChild(usernameDiv);
    
        const barContainer = document.createElement('div');
        barContainer.classList.add('bar-container');
    
        const barDiv = document.createElement('div');
        barDiv.classList.add('bar');
        barDiv.style.width = `${(score.score / maxScore) * 100}%`;
        barDiv.innerText = score.score;
    
        barContainer.appendChild(barDiv);
        row.appendChild(barContainer);
    
        const scoreDiv = document.createElement('div');
        scoreDiv.classList.add('score');
        scoreDiv.innerText = score.score;
        row.appendChild(scoreDiv);
    
        container.appendChild(row);
    
        const delay = appearanceOrder.findIndex(appearanceScore => appearanceScore.username === score.username);
    
        setTimeout(() => {
            row.classList.add('visible');
            barDiv.style.width = `${(score.score / maxScore) * 100}%`;
        }, delay * 1000);
    });
}

function createBtnExit() {
    let btnExit = document.createElement('button');
    btnExit.classList.add('btn-exit', 'new-amsterdam-regular');
    btnExit.setAttribute('id', 'btn-exit');
    btnExit.innerText = 'Esci';
    btnExit.addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = '/';
    });
    document.getElementById('btn-exit-container').appendChild(btnExit);
}

function startScript() {
    addMessageListener(handleMessage);
    createBtnExit();
    const payLoad = {
        'method': 'req-score',
        'clientId': sessionStorage.getItem('clientId'),
        'gameId': sessionStorage.getItem('gameId'),
    }
    send(payLoad);
}

export { startScript };
