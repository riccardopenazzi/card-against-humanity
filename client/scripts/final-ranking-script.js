const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const webSocketPort = window.location.port;
let webSocket = new WebSocket(`${protocol}://${window.location.hostname}:${webSocketPort}`);

const debugMode = true;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-exit').addEventListener('click', () => {
        window.location.href = '/';
    });
});

webSocket.onopen = () => {
    const clientId = sessionStorage.getItem('clientId');
    if (!clientId) {
       window.location.href = '/';
    } else {
        const payLoad = {
            'method': 'connect-again',
            'clientId': clientId,
        }
        console.log(clientId);
        console.log(payLoad);
        webSocket.send(JSON.stringify(payLoad));
    }
}

webSocket.onmessage = receivedMessage => {
    const message = JSON.parse(receivedMessage.data);
    console.log(message);

    if (message.method === 'reconnected') {
        const payLoad = {
            'method': 'req-score',
            'clientId': sessionStorage.getItem('clientId'),
            'gameId': sessionStorage.getItem('gameId'),
        }
        console.log('mando req score')
        webSocket.send(JSON.stringify(payLoad));
    }

    if (message.method === 'req-score') {
        showFinalRanking(message.score);
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
