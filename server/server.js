const debugMode = false;

const Game = require("./utils/Game");
const Player = require("./utils/Player");
const GameState = require("./utils/gameStates");
const express = require("express");
const http = require("http");
const path = require("path");
const { v4: uuidv4 } = require('uuid');
const websocketServer = require("websocket").server;

const app = express();
const serverPort = process.env.PORT || 9090;  // Single port. use render port or 9090
const server = http.createServer(app);  // Single server HTTP for WebSocket and Express

let checking = false;

// Express page settings
app.use(express.static(path.join(__dirname, "../client")));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "../client/screens/index.html")));
app.get("/settings", (req, res) => res.sendFile(path.join(__dirname, "../client/screens/settings.html")));
app.get("/waiting-room", (req, res) => res.sendFile(path.join(__dirname, "../client/screens/waiting-room.html")));
app.get("/playing-room", (req, res) => res.sendFile(path.join(__dirname, "../client/screens/playing-room.html")));
app.get("/score", (req, res) => res.sendFile(path.join(__dirname, "../client/screens/score.html")));

// Start server
server.listen(serverPort, () => console.log(`Server listening on port ${serverPort}`));

// Initialize WebSocket on HTTP server
const wsServer = new websocketServer({
    "httpServer": server,
});

/*
"hashMap" to store all clients connected, every client will be identified by a unique id and then I'll store an object for every
client that includes the connection (to send messages to the client) and some other infos
*/
const connectedClients = {};

/*
"hashMap" to store all games, every game will be identified by a unique id and then I'll store an object for every game
*/
const games = {};

wsServer.on("request", request => {
	const connection = request.accept(null, request.origin);
	connection.on("open", () => debugMode && console.log("opened"));
	connection.on("close", () => debugMode && console.log("closed"));

	connection.on("message", receivedMessage => {
		const message = JSON.parse(receivedMessage.utf8Data);
		debugMode && console.log(message);

		/*
		If servers receives this message it means a new client wants to create a connection so it generates a new unique clientId 
		and creates a new entry in connectedClients and finally send this info to the client
		*/
		if (message.method === 'connect') {
			handleConnection(connection);
		}

		if (message.method === 'connect-again') {
			handleConnectAgain(message, connection);
		}

		if (message.method === 'create') {
			handleCreateGame(message, connection);
		}

		if (message.method === 'verify-game-code') {
			handleVerifyGameCode(message, connection);
		}

		if (message.method === 'join') {
			handleJoinGame(message, connection);
		}

		if (message.method === 'start-game') {
			handleStartGame(message, connection);
		}

		if (message.method === 'start-manche') {
			handleStartManche(message, connection);
		}

		if (message.method === 'req-player-cards') {
			handleRequestPlayerCards(message, connection);
		}

		if (message.method === 'play-card') {
			handlePlayCard(message, connection);
		}

		if (message.method === 'show-next-card') {
			handleShowNextCard(message, connection);
		}

		if (message.method === 'go-to-choosing-winner') {
			handleGoToChoosingWinner(message, connection);
		}

		if (message.method === 'choosing-winner') {
			handleChoosingWinner(message, connection);
		}

		if (message.method === 'req-score') {
			handleRequestScore(message, connection);
		}

		if (message.method === 'new-manche') {
			handleNewManche(message, connection);
		}

		if (message.method === 'check-connection') {
			handleCheckConnection(message, connection);
		}

		/*Unpredictable events */

		if (message.method === 'req-black-card-change') {
			handleRequestBlackCardChange(message, connection);
		}

		if (message.method === 'vote-skip-survey') {
			handleVoteSkipSurvey(message, connection);
		}
	});

});

/* Functions */
function handleConnection(connection) {
	//unique id to identify the client that just connected
	const clientId = uuidv4();
	connectedClients[clientId] = {
		'connection': connection,
		'alive': 'started',
	};
	const payLoad = {
		'method': 'connect',
		'clientId': clientId,
	};
	sendMessage(clientId, payLoad, connection);
}

function handleConnectAgain(message, connection) {
	let clientId = message.clientId;
	if (checkStableConnection(clientId)) {
		//if connection already exists
		connectedClients[clientId].connection = connection;
		const payLoad = {
			'method': 'reconnected',
		}
		sendMessage(clientId, payLoad, connection);
	} else {
		const payLoad = {
			'method': 'invalid-clientId',
		}
		connection.send(JSON.stringify(payLoad));
	}
}

function handleCreateGame(message, connection) {
	let clientId = message.clientId;
	if (!checkStableConnection(clientId)) {
		const payLoad = {
			'method': 'invalid-clientId',
		}
		connection.send(JSON.stringify(payLoad));
		return
	}
	let playersCards = message.playersCards;
	let winsNumber = message.winsNumber;
	let gameId = createGame(clientId, playersCards, winsNumber);
	const payLoad = {
		'method': 'create',
		'gameId': gameId,
	};
	sendMessage(message.clientId, payLoad, connection);
}

function handleVerifyGameCode(message, connection) {
	let clientId = message.clientId;
	if (!checkStableConnection(clientId)) {
		const payLoad = {
			'method': 'invalid-clientId',
		}
		connection.send(JSON.stringify(payLoad));
		return
	}
	let gameCode = message.gameCode;
	const isValid = isGameCodeValid(gameCode);
	if (isValid && games[gameCode].gameState === GameState.WAITING_FOR_PLAYERS) {
		const payLoad = {
			'method': 'verify-game-code',
			'gameCode': gameCode,
			'result': 'valid',
		}
		sendMessage(clientId, payLoad, connection);
	} else if (isValid && games[gameCode].gameState !== GameState.WAITING_FOR_PLAYERS) {
		const payLoad = {
			'method': 'game-already-started',
		}
		sendMessage(clientId, payLoad, connection);
	} else {
		const payLoad = {
			'method': 'verify-game-code',
			'gameCode': gameCode,
			'result': 'invalid',
		}
		sendMessage(clientId, payLoad, connection);
	}
}

function handleJoinGame(message, connection) {
	let clientId = message.clientId;
	if (!checkStableConnection(clientId)) {
		const payLoad = {
			'method': 'invalid-clientId',
		}
		connection.send(JSON.stringify(payLoad));
		return
	}
	let gameId = message.gameId;
	let username = message.username;
	if (checkUniqueUsername(gameId, username)) {
		let player = new Player(clientId, username);
		games[gameId].addPlayer(player);
		debugMode && console.log('Player added, ', games[gameId].players);
		const payLoad = {
			'method': 'update-players-list',
			'playersList': games[gameId].usernamesList,
			'clientId': clientId,
			'username': username,
		};
		sendBroadcastMessage(gameId, payLoad, connection);
	} else {
		const payLoad = {
			'method': 'duplicated-username',
		}
		sendMessage(clientId, payLoad, connection);
	}
}

function handleStartGame(message, connection) {
	let gameId = message.gameId;
	games[gameId].initGame();
	const payLoad = {
		'method': 'start-game',
	}
	sendBroadcastMessage(gameId, payLoad, connection);
}

function handleStartManche(message, connection) {
	let clientId = message.clientId;
	if (!checkStableConnection(clientId)) {
		const payLoad = {
			'method': 'invalid-clientId',
		}
		connection.send(JSON.stringify(payLoad));
		return
	}
	let gameId = message.gameId;
	games[gameId].updateGameState(GameState.CHOOSING_WHITE_CARDS);
	let allPlayersCompleted = games[gameId].checkAllPlayersCompletedManche();
	const payLoad = {
		'method': 'start-manche',
		'blackCard': games[gameId].currentManche.blackCard,
		'mancheNumber': games[gameId].manches.length,
		'masterId': games[gameId].currentManche.master,
		'allPlayersCompleted': allPlayersCompleted,
		'playedCards': games[gameId].currentManche.playedWhiteCards,
	}
	sendMessage(clientId, payLoad, connection);
}

function handleRequestPlayerCards(message, connection) {
	let clientId = message.clientId;
	if (!checkStableConnection(clientId)) {
		const payLoad = {
			'method': 'invalid-clientId',
		}
		connection.send(JSON.stringify(payLoad));
		return
	}
	let gameId = message.gameId;
	let playerCards = games[gameId].players[clientId].playerCards;
	const payLoad = {
		'method': 'req-player-cards',
		'playerCards': playerCards,
	}
	sendMessage(clientId, payLoad, connection);
}

function handlePlayCard(message, connection) {
	let clientId = message.clientId;
	if (!checkStableConnection(clientId)) {
		const payLoad = {
			'method': 'invalid-clientId',
		}
		connection.send(JSON.stringify(payLoad));
		return
	}
	let gameId = message.gameId;
	let cardText = message.cardText;
	let playedCardIndex = games[gameId].players[clientId].playerCards.findIndex(x => x == cardText);
	let choosenCard = games[gameId].players[clientId].playerCards.splice(playedCardIndex, 1)[0];
	games[gameId].currentManche.addCard(clientId, choosenCard);
	const payLoad = {
		'method': 'play-card',
	}
	sendMessage(clientId, payLoad, connection);
	if (games[gameId].checkMancheComplete()) {
		const payLoad = {
			'method': 'show-played-cards',
			'playedCards': games[gameId].currentManche.playedWhiteCards,
		}
		sendBroadcastMessage(gameId, payLoad, connection);
	}
}

function handleShowNextCard(message, connection) {
	const gameId = message.gameId;
	const payLoad = {
		'method': 'show-next-card',
	}
	sendBroadcastMessage(gameId, payLoad, connection);
}

function handleGoToChoosingWinner(message, connection) {
	let gameId = message.gameId;
	games[gameId].updateGameState(GameState.CHOOSING_WINNER);
	const payLoad = {
		'method': 'choosing-winner',
		'playedCards': games[gameId].currentManche.playedWhiteCards,
	}
	sendBroadcastMessage(gameId, payLoad, connection);
}

function handleChoosingWinner(message, connection) {
	let gameId = message.gameId;
	let winner = message.winner;
	games[gameId].players[winner].addPoint();
	games[gameId].setMancheWinner(winner);
	if (games[gameId].checkGameEnd()) {
		//someone has won
		const payLoad = {
			'method': 'win',
			'winner': games[gameId].players[winner].username,
		}
		sendBroadcastMessage(gameId, payLoad, connection);
	} else {
		//nobody has won
		const payLoad = {
			'method': 'watch-score',
			'winner': games[gameId].players[winner].username,
		}
		sendBroadcastMessage(gameId, payLoad, connection);
	}
}

function handleRequestScore(message, connection) {
	let clientId = message.clientId;
	if (!checkStableConnection(clientId)) {
		const payLoad = {
			'method': 'invalid-clientId',
		}
		connection.send(JSON.stringify(payLoad));
		return
	}
	let gameId = message.gameId;
	/* game state will be updated only first time someone makes this request */
	if (games[gameId].gameState === GameState.CHOOSING_WINNER) {
		games[gameId].updateGameState(GameState.WATCHING_SCORES);
	}
	const payLoad = {
		'method': 'req-score',
		'score': games[gameId].getScores(),
		'readyPlayers': games[gameId].readyPlayers,
	}
	sendMessage(clientId, payLoad, connection);
}

function handleNewManche(message, connection) {
	let gameId = message.gameId;
	games[gameId].incReadyPlayers();
	if (games[gameId].checkAllPlayersReady()) {
		games[gameId].newManche();
		const payLoad = {
			'method': 'new-manche',
		}
		sendBroadcastMessage(gameId, payLoad, connection);
	} else {
		const payLoad = {
			'method': 'counter-ready-players',
			'readyPlayers': games[gameId].readyPlayers,
		}
		sendBroadcastMessage(gameId, payLoad, connection);
	}
}

function handleCheckConnection(message, connection) {
	let clientId = message.clientId;
	if (!checkStableConnection(clientId)) {
		const payLoad = {
			'method': 'invalid-clientId',
		}
		connection.send(JSON.stringify(payLoad));
		return
	}
	debugMode && console.log('Imposto a true ', clientId);
	connectedClients[clientId].alive = true;
}

function handleRequestBlackCardChange(message, connection) {
	let gameId = message.gameId;
	games[gameId].updateGameState(GameState.VOTING_SURVEY);
	const payLoad = {
		'method': 'req-black-card-change',
	}
	sendBroadcastMessage(gameId, payLoad, connection);
}

function handleVoteSkipSurvey(message, connection) {
	let gameId = message.gameId;
	if (message.vote === 'yes') {
		games[gameId].surveyPositiveVote();
	} else {
		games[gameId].surveyNegativeVote();
	}
	if (games[gameId].checkAllPlayersReady()) {
		if (games[gameId].surveyResult >= 0) {
			games[gameId].skipBlackCard();
		}
		games[gameId].resetSurveyCounter();
		games[gameId].resetReadyPlayers();
		const payLoad = {
			'method': 'vote-skip-survey',
			'blackCard': games[gameId].currentManche.blackCard,
		}
		sendBroadcastMessage(gameId, payLoad, connection);
	}
}
/* End functions */

const periodicallyCheck = setInterval(checkClientsConnected, 4000);

function checkClientsConnected() {
	if (!checking) {
		debugMode && console.log('controllo checking è false');
		checking = true;
		Object.keys(connectedClients).forEach(clientId => {
			if (connectedClients[clientId].alive) {
				connectedClients[clientId].alive = false;
				connectedClients[clientId].retryCount = 0;
				const payLoad = {
					'method': 'check-connection',
				}
				sendMessage(clientId, payLoad);
			} else if (connectedClients[clientId].alive === 'started') {
				connectedClients[clientId].alive = true;
			} else {
				console.log('Retrying connection check for', clientId);
        		connectedClients[clientId].retryCount = (connectedClients[clientId].retryCount || 0) + 1;
				if (connectedClients[clientId].retryCount >= 3) {
					console.log(clientId, ' disconnected after retries');
					Object.keys(games).forEach(gameId => {
						if (games[gameId].players.hasOwnProperty(clientId)) {
							if (games[gameId].hostId == clientId) {
								//kick out all players
								Object.keys(games[gameId].players).forEach(playerId => {
									const payLoad = {
										'method': 'server-error',
									}
									sendBroadcastMessage(gameId, payLoad);
								});
							} else {
								//kick out only that player
								games[gameId].removePlayer(clientId);
								handleDisconnection(gameId, clientId);
							}
						}
					});
					delete connectedClients[clientId];
				} else {
					const payLoad = {
						'method': 'check-connection',
					};
					sendMessage(clientId, payLoad);
				}
			}
		});
		checking = false;
	} else {
		debugMode && console.log('Controllerei ma checking è true')
	}
}

function handleDisconnection(gameId, clientId) {
	debugMode && console.log('Gestisco disconnessione');
	if (games[gameId].gameState === GameState.CHOOSING_WHITE_CARDS) {
		if (games[gameId].checkMancheComplete()) {
			delete games[gameId].currentManche.playedWhiteCards[clientId];
			const payLoad = {
				'method': 'show-played-cards',
				'playedCards': games[gameId].currentManche.playedWhiteCards,
			}
			sendBroadcastMessage(gameId, payLoad);
		}
	}

	if (games[gameId].gameState === GameState.WATCHING_SCORES) {
		if (games[gameId].checkAllPlayersReady()) {
			games[gameId].newManche();
			if (games[gameId].currentManche.master === clientId) {
				games[gameId].currentManche.setNewMaster(Object.keys(games[gameId].players)[0]);
			}
			const payLoad = {
				'method': 'new-manche',
			}
			sendBroadcastMessage(gameId, payLoad);
		}
	}

	if (games[gameId].gameState === GameState.VOTING_SURVEY) {
		if (games[gameId].currentManche.master === clientId) {
			games[gameId].currentManche.setNewMaster(Object.keys(games[gameId].players)[0]);
		}
		if (games[gameId].checkAllPlayersReady()) {
			if (games[gameId].surveyResult >= 0) {
				games[gameId].skipBlackCard();
			}
			games[gameId].resetSurveyCounter();
			games[gameId].resetReadyPlayers();
			const payLoad = {
				'method': 'vote-skip-survey',
				'blackCard': games[gameId].currentManche.blackCard,
			}
			sendBroadcastMessage(gameId, payLoad);
		}
	}
	debugMode && console.log('Fine gestione disconnessione');
}

function checkStableConnection(clientId) {
	return connectedClients.hasOwnProperty(clientId);
}

function createGame(hostId,  playersCards, winsNumber) {
	let gameId = generateUniqueGameId();
	while (isGameIdExisting(gameId)) {
		gameId = generateUniqueGameId();
	}
	games[gameId] = new Game(gameId, hostId, playersCards, winsNumber);
	return gameId;
}

function generateUniqueGameId() {
	const randomNumber = Math.floor(Math.random() * 36 ** 6);
	return randomNumber.toString(36).toUpperCase().padStart(6, '0');
}

function isGameCodeValid(gameCode) {
	if (gameCode.includes(' ') || !isGameIdExisting(gameCode) || gameCode.length != 6) {
		return false;
	}
	return true;
}

function isGameIdExisting(gameId) {
	return gameId in games;
}

function sendBroadcastMessage(gameId, payLoad, connection) {
	Object.keys(games[gameId].players).forEach(clientId => {
		sendMessage(clientId, payLoad, connection);
	});
}

function sendMessage(clientId, payLoad, connection) {
	try {
		const connection = connectedClients[clientId].connection;
		connection.send(JSON.stringify(payLoad));
	} catch (error) {
		const payLoadError = {
			'method': 'server-error',
		}
		try {
			connection.send(JSON.stringify(payLoadError));
		} catch (e) {
			console.log(e);
		}
	}
}

function checkUniqueUsername(gameId, username) {
	for (const player of Object.values(games[gameId].players)) {
		if (player.username === username) {
			return false;
		}
	}
	return true;
}
