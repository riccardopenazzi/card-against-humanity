const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const webSocketPort = window.location.port;
let webSocket = new WebSocket(`${protocol}://${window.location.hostname}:${webSocketPort}`);

const inputCode = document.getElementById('txt-game-code');
const btnJoin = document.getElementById('btn-join-game');
const btnCreate = document.getElementById('btn-create-game');

const debugMode = true;

btnCreate.addEventListener('click', event => {
	window.location.href = "/settings";
});

btnJoin.addEventListener('click', event => {
	if (webSocket.readyState === WebSocket.OPEN) {
		const payLoad = {
			'method': 'connect',
		};
		webSocket.send(JSON.stringify(payLoad));
	} else {
		alert("Connessione WebSocket non disponibile, potrebbero esserci problemi dovuti alla rete. Ricarica la pagina e riprova.");
	}
});

inputCode.addEventListener('input', () => {
	inputCode.value.trim().length == 6 ? btnJoin.disabled = false : btnJoin.disabled = true;
});

webSocket.onmessage = receivedMessage => {
	const message = JSON.parse(receivedMessage.data);
	debugMode && console.log(message);

	/* If client receives this message it means a connection is created, now it can store clientId and send request to join the game */
	if (message.method === 'connect') {
		let clientId = message.clientId;
		sessionStorage.setItem('clientId', clientId);
		debugMode && console.log("clientId set successfully ", sessionStorage.getItem('clientId'));
		let gameCode = inputCode.value.toUpperCase();
		const payLoad = {
			'method': 'verify-game-code',
			'clientId': clientId,
			'gameCode': gameCode,
		}
		webSocket.send(JSON.stringify(payLoad));
	}

	/* 
	If client recives this message it means server has received its request and has checked if a game exists with that game code: if it exists client is redirected to waiting-room
	else an error is showed to the client
	*/	
	if (message.method === 'verify-game-code') {
		if (message.result === 'valid') {
			sessionStorage.setItem('gameId', message.gameCode);
			window.location.href = "/waiting-room";
		} else {
			document.getElementById('show-error').innerText = '';
			document.getElementById('show-error').innerText = 'Si è verificato un errore, il codice potrebbe non essere di 6 caratteri, contenere spazi o essere errato';
		}
	}

	/* Standard message used to show to ther server that the client is still connected, probably it's not too necesseray here */
	if (message.method === 'check-connection') {
		const payLoad = {
			'method': 'check-connection',
			'clientId': sessionStorage.getItem('clientId'),
		}
		webSocket.send(JSON.stringify(payLoad));
	}
}