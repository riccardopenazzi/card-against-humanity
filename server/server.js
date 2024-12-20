const debugMode = false;

const Game = require("./utils/Game");
const Player = require("./utils/Player");
const GameState = require("./utils/gameStates");
const express = require("express");
const http = require("http");
const path = require("path");
const { Mutex } = require('async-mutex');
const { v4: uuidv4 } = require('uuid');
const websocketServer = require("websocket").server;
const { MessageTypes, CardVariants } = require('../shared/sharedCostants');

const app = express();
const serverPort = process.env.PORT || 9090;  // Single port. use render port or 9090
const server = http.createServer(app);  // Single server HTTP for WebSocket and Express

const mutex = new Mutex();
let checking = false;

// Express page settings
app.use('/shared', express.static(path.join(__dirname, '../shared')));
app.use(express.static(path.join(__dirname, "../client")));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "../client/screens/index.html")));

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

/*hashMap to store all possible events */
const eventManager = {
    [MessageTypes.CONNECT]: handleConnection,
    [MessageTypes.CONNECT_AGAIN]: handleConnectAgain,
    [MessageTypes.CREATE]: handleCreateGame,
    [MessageTypes.VERIFY_GAME_CODE]: handleVerifyGameCode,
    [MessageTypes.JOIN]: handleJoinGame,
    [MessageTypes.START_GAME]: handleStartGame,
    [MessageTypes.START_MANCHE]: handleStartManche,
    [MessageTypes.REQ_PLAYER_CARDS]: handleRequestPlayerCards,
    [MessageTypes.PLAY_CARD]: handlePlayCard,
    [MessageTypes.SHOW_NEXT_CARD]: handleShowNextCard,
    [MessageTypes.GO_TO_CHOOSING_WINNER]: handleGoToChoosingWinner,
    [MessageTypes.CHOOSING_WINNER]: handleChoosingWinner,
    [MessageTypes.REQ_SCORE]: handleRequestScore,
    [MessageTypes.NEW_MANCHE]: handleNewManche,
    [MessageTypes.CHECK_CONNECTION]: handleCheckConnection,
    [MessageTypes.REQ_BLACK_CARD_CHANGE]: handleRequestBlackCardChange,
    [MessageTypes.VOTE_SKIP_SURVEY]: handleVoteSkipSurvey,
	[MessageTypes.EXEC_POINT_COUNT]: handleExecPointCount,
	[MessageTypes.SHOW_BLACK_EMPTY_CARD]: handleShowBlackEmptyCard,
	[MessageTypes.CHANGE_PLAYER_CARDS]: handleChangePlayerCards,
};

wsServer.on("request", request => {
	const connection = request.accept(null, request.origin);
	connection.on("open", () => debugMode && console.log("opened"));
	connection.on("close", () => debugMode && console.log("closed"));

	connection.on("message", receivedMessage => {
		const message = JSON.parse(receivedMessage.utf8Data);
		console.log(message);
		console.log(message.method);
		const handler = eventManager[message.method];
		if (handler) {
			handler(message, connection);
		} else {
			console.log('Unknow method ', message.method);
		}
	});

});

/* Functions */
function handleConnection(message, connection) {
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

async function handleConnectAgain(message, connection) {
	const release = await mutex.acquire();
	try {
		let clientId = message.clientId;
		console.log(clientId);
		if (checkStableConnection(clientId)) {
			//if connection already exists
			connectedClients[clientId].connection = connection;
			connectedClients[clientId].retryCount = 0;
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
	} finally {
		release();
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
	let vars = {};
	vars.hostId = clientId;
	vars.startCardNumber = message.playersCards;
	vars.targetScore = message.winsNumber;
	vars.whiteCardMode = message.whiteCardMode;
	vars.restartUniverseMode = message.restartUniverseMode;
	let gameId = createGame(vars);
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
	if (isValid) {
		const payLoad = {
			'method': 'verify-game-code',
			'gameCode': gameCode,
			'result': 'valid',
		}
		sendMessage(clientId, payLoad, connection);
	} /* else if (isValid && games[gameCode].gameState !== GameState.WAITING_FOR_PLAYERS) {
		const payLoad = {
			'method': 'game-already-started',
		}
		sendMessage(clientId, payLoad, connection);
		games[gameCode].addWaitingPlayer()
	} */ else {
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
		if (games[gameId].gameState === GameState.WAITING_FOR_PLAYERS) {
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
			games[gameId].addWaitingPlayer(player);
			const payLoad = {
				'method': 'added-in-waiting-queue',
			};
			sendMessage(clientId, payLoad, connection);
		}
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

function handleShowBlackEmptyCard(message, connection) {
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
	const payLoad = {
		'method': 'show-black-empty-card',
		'mancheNumber': games[gameId].manches.length,
		'blackCard': games[gameId].currentManche.blackCard,
	}
	sendMessage(clientId, payLoad, connection);
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
	const payLoad = {
		'method': 'start-manche',
		'masterId': games[gameId].currentManche.master,
		'blackCard': games[gameId].currentManche.blackCard,
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
		'canRestart': games[gameId].restartUniverseMode ? games[gameId].getPlayerScore(clientId) > 0 : false,
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
	let card = message.card;
	if (!card.standard) {
		let playedCardIndex = games[gameId].players[clientId].playerCards.findIndex(x => x == CardVariants.EMPTY_CARD);
		games[gameId].players[clientId].playerCards.splice(playedCardIndex, 1);
	} else {
		let playedCardIndex = games[gameId].players[clientId].playerCards.findIndex(x => x == card.cardText);
		games[gameId].players[clientId].playerCards.splice(playedCardIndex, 1);
	}
	games[gameId].currentManche.addCard(clientId, card);
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
	games[gameId].resetReadyPlayers();
	const payLoad = {
		'method': 'show-winning-card',
		'cardText': games[gameId].currentManche.playedWhiteCards[winner],
		'mancheWinner': games[gameId].players[winner].username,
	}
	sendBroadcastMessage(gameId, payLoad, connection);
}

function handleExecPointCount(message, connection) {
	let gameId = message.gameId;
	let winner = games[gameId].currentManche.winner;
	games[gameId].incReadyPlayers();
	let payLoad;
	if (games[gameId].checkAllPlayersReady()) {
		games[gameId].resetReadyPlayers();
		if (games[gameId].checkGameEnd()) {
			//someone has won
			payLoad = {
				'method': 'win',
				'winner': games[gameId].players[winner].username,
			}
		} else {
			//nobody has won
			payLoad = {
				'method': 'watch-score',
				'winner': games[gameId].players[winner].username,
			}
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
		addWaitingPlayersInGame(gameId);
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
		let result = false;
		if (games[gameId].surveyResult >= 0) {
			games[gameId].skipBlackCard();
			games[gameId].redistributeWhiteCardsPlayed();
			games[gameId].resetPlayedCards();
			result = true;
		}
		games[gameId].resetSurveyCounter();
		games[gameId].resetReadyPlayers();
		const payLoad = {
			'method': 'vote-skip-survey',
			'blackCard': games[gameId].currentManche.blackCard,
			'result': result,
		}
		sendBroadcastMessage(gameId, payLoad, connection);
	}
}

function handleChangePlayerCards(message, connection) {
	games[message.gameId].changePlayerCards(message.clientId, message.cardsList);
	games[message.gameId].players[message.clientId].decrementPlayerScore(1);
	const payLoad = {
		'method': 'change-player-cards',
		'playerCards': games[message.gameId].players[message.clientId].playerCards,
		'canRestart': false,
	}
	sendMessage(message.clientId, payLoad, connection);
}

/* End functions */

const periodicallyCheck = setInterval(checkClientsConnected, 4000);

async function checkClientsConnected() {
	const release = await mutex.acquire();
	try {
		if (!checking) {
			debugMode && console.log('controllo checking è false');
			checking = true;
			Object.keys(connectedClients).forEach(clientId => {
				//debugMode && console.log(clientId);
				const gameId = getGameIdFromPlayer(clientId);
				if (connectedClients[clientId].alive) {
					connectedClients[clientId].alive = false;
					if (connectedClients[clientId].retryCount > 0) {
						if (connectedClients[clientId].retryCount > 0 == 1) {
							connectedClients[clientId].retryCount = 0;
							const payLoad = {
								'method': MessageTypes.CONNECTION_TROUBLE_MANAGED,
							}
							sendBroadcastMessage(gameId, payLoad);
						} else {
							connectedClients[clientId].retryCount = 0;
							if (!checkSomeoneIsDisconnecting(gameId)) {
								const payLoad = {
									'method': MessageTypes.PLAYER_DISCONNECTION_MANAGED,
								}
								sendBroadcastMessage(gameId, payLoad);
							}
						}
					}
					const payLoad = {
						'method': 'check-connection',
					}
					sendMessage(clientId, payLoad);
				} else if (connectedClients[clientId].alive === 'started') {
					connectedClients[clientId].alive = true;
				} else {
					debugMode && console.log('Retrying connection check for', clientId);
					connectedClients[clientId].retryCount = (connectedClients[clientId].retryCount || 0) + 1;
					if (connectedClients[clientId].retryCount == 1) {
						const payLoad = {
							'method': MessageTypes.CONNECTION_TROUBLE,
						}
						sendMessage(clientId, payLoad);
					}
					if (connectedClients[clientId].retryCount == 2) {
						const payLoad = {
							'method': MessageTypes.PLAYER_DISCONNECTED,
						}
						sendBroadcastMessage(getGameIdFromPlayer(clientId), payLoad);
					}
					if (connectedClients[clientId].retryCount > 4) {
						debugMode && console.log(clientId, ' disconnected after retries');
						if (games[gameId] && games[gameId].players) {
							games[gameId].removePlayer(clientId);
							handleDisconnection(gameId, clientId);				
						}
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
		}
	} finally {
		release();
	}
}

function addWaitingPlayersInGame(gameId) {
	games[gameId].waitingPlayers.forEach(player => {
		games[gameId].addPlayer(player);
	})
	;
	// games[gameId].resetWaitingPlayers(); //rimossi in Game.js per dare carta empty
}

function checkSomeoneIsDisconnecting(gameId) {
	for (const clientId of Object.keys(games[gameId].players)) {
		if (connectedClients[clientId].retryCount > 0) {
			return true;
		}
	}
	return false;
}

function getGameIdFromPlayer(playerId) {
	for (const [gameId, game] of Object.entries(games)) {
		if (game.players.hasOwnProperty(playerId)) {
			return gameId;
		}
	}
}

function handleDisconnection(gameId, clientId) {
	debugMode && console.log('Gestisco disconnessione');
	if (games[gameId].gameState === GameState.CHOOSING_WHITE_CARDS) {
		if (games[gameId].currentManche.master === clientId) {
			games[gameId].skipManche();
			const payLoad = {
				'method': MessageTypes.SKIP_MANCHE,
			}
			sendBroadcastMessage(gameId, payLoad);
			return; //so don't send disconnection-managed 
		} else {
			if (games[gameId].checkMancheComplete()) {
				delete games[gameId].currentManche.playedWhiteCards[clientId];
				const payLoad = {
					'method': 'show-played-cards',
					'playedCards': games[gameId].currentManche.playedWhiteCards,
				}
				sendBroadcastMessage(gameId, payLoad);
			}
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

	const payLoad = {
		'method': MessageTypes.PLAYER_DISCONNECTION_MANAGED,
	}
	sendBroadcastMessage(gameId, payLoad);
	debugMode && console.log('Fine gestione disconnessione');
}

function checkStableConnection(clientId) {
	return connectedClients.hasOwnProperty(clientId);
}

function createGame(vars) {
	let gameId = generateUniqueGameId();
	while (isGameIdExisting(gameId)) {
		gameId = generateUniqueGameId();
	}
	vars.gameId = gameId;
	games[gameId] = new Game(vars);
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
	if (games[gameId] && games[gameId].players) {
		Object.keys(games[gameId].players).forEach(clientId => {
			sendMessage(clientId, payLoad, connection);
		});
	}
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
