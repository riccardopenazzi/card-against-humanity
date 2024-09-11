const debugMode = true;

const serverPort = 9090;
const expressPort = 9091;

const express = require("express");
const http = require("http");
const app = require("express")();
const path = require("path");
const { v4: uuidv4 } = require('uuid');

const Game = require("./utils/Game");
const Player = require("./utils/Player");

app.use(express.static(path.join(__dirname, "../client")));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "../client/screens/index.html")));
app.get("/waiting-room", (req, res) => res.sendFile(path.join(__dirname, "../client/screens/waiting-room.html")));
app.get("/playing-room", (req, res) => res.sendFile(path.join(__dirname, "../client/screens/playing-room.html")));
app.get("/score", (req, res) => res.sendFile(path.join(__dirname, "../client/screens/score.html")));
app.listen(expressPort, () => console.log("Express app listening on port ", expressPort));

const websocketServer = require("websocket").server;
const httpServer = http.createServer();
httpServer.listen(serverPort, () => console.log("Server listening on port ", serverPort));

const wsServer = new websocketServer({
	"httpServer": httpServer,
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
	connection.on("open", () => console.log("opened"));
	connection.on("close", () => console.log("closed"));

	connection.on("message", receivedMessage => {
		const message = JSON.parse(receivedMessage.utf8Data);
		debugMode && console.log(message);

		if (message.method === 'connect') {
			//unique id to identify the client that just connected
			const clientId = uuidv4();
			connectedClients[clientId] = {
				"connection": connection,
			};
			const payLoad = {
				"method": "connect",
				"clientId": clientId,
			};
			sendMessage(clientId, payLoad);
		}

		if (message.method === 'connect-again') {
			let clientId = message.clientId;
			if (checkStableConnection(clientId)) {
				//if connection already exists
				connectedClients[clientId].connection = connection;
				const payLoad = {
					'method': 'reconnected',
				}
				sendMessage(clientId, payLoad);
			} else {
				const newClientId = uuidv4();
				connectedClients[newClientId] = {
					"connection": connection,
				};
				const payLoad = {
					"method": "new-id-set",
					"clientId": newClientId,
					/* "hostId":  */
				};
				sendMessage(newClientId, payLoad);
			}
		}

		if (message.method === 'create') {
			let clientId = message.clientId;
			let gameId = createGame(clientId);
			const payLoad = {
				"method": "create",
				"gameId": gameId,
				"hostId": clientId,
			};
			sendMessage(message.clientId, payLoad);
		}

		if (message.method === 'verify-game-code') {
			let clientId = message.clientId;
			let gameCode = message.gameCode;
			const payLoad = {
				'method': 'verify-game-code',
				'gameCode': gameCode,
				'result': isGameCodeValid(gameCode) ? 'valid' : 'invalid',
			};
			sendMessage(clientId, payLoad);
		}

		if (message.method === 'join') {
			let username = message.username;
			let gameId = message.gameId;
			let clientId = message.clientId;
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
				sendBroadcastMessage(gameId, payLoad);
			} else {
				const payLoad = {
					'method': 'duplicated-username',
				}
				sendMessage(clientId, payLoad);
			}
		}

		if (message.method === 'start-game') {
			let gameId = message.gameId;
			games[gameId].initGame();
			const payLoad = {
				'method': 'start-game',
			}
			sendBroadcastMessage(gameId, payLoad);
		}

		if (message.method === 'start-manche') {
			let clientId = message.clientId;
			let gameId = message.gameId;
			let allPlayersCompleted = games[gameId].checkAllPlayersCompletedManche();
			const payLoad = {
				'method': 'start-manche',
				'blackCard': games[gameId].currentManche.blackCard,
				'mancheNumber': games[gameId].manches.length,
				'masterId': games[gameId].currentManche.master,
				'allPlayersCompleted': allPlayersCompleted,
				'playedCards': games[gameId].currentManche.playedWhiteCards,
			}
			sendMessage(clientId, payLoad);
		}

		if (message.method === 'req-player-cards') {
			let clientId = message.clientId;
			let gameId = message.gameId;
			let playerCards = games[gameId].players[clientId].playerCards;
			const payLoad = {
				'method': 'req-player-cards',
				'playerCards': playerCards,
			}
			sendMessage(clientId, payLoad);
		}

		if (message.method === 'play-card') {
			let clientId = message.clientId;
			let gameId = message.gameId;
			let cardText = message.cardText;
			let playedCardIndex = games[gameId].players[clientId].playerCards.findIndex(x => x == cardText);
			let choosenCard = games[gameId].players[clientId].playerCards.splice(playedCardIndex, 1)[0];
			games[gameId].currentManche.addCart(clientId, choosenCard);
			const payLoad = {
				'method': 'play-card',
			}
			sendMessage(clientId, payLoad);
			if (games[gameId].checkMancheComplete()) {
				const payLoad = {
					'method': 'choosing-winner',
					'playedCards': games[gameId].currentManche.playedWhiteCards,
				}
				sendBroadcastMessage(gameId, payLoad);
			}
		}

		if (message.method === 'choosing-winner') {
			let gameId = message.gameId;
			let winner = message.winner;
			games[gameId].players[winner].addPoint();
			console.log(games[gameId].players[winner].score);
			games[gameId].setMancheWinner(winner);
			if (games[gameId].checkGameEnd()) {
				//someone has won
				const payLoad = {
					'method': 'win',
					'winner': games[gameId].players[winner].username,
				}
				sendBroadcastMessage(gameId, payLoad);
			} else {
				//nobody has won
				const payLoad = {
					'method': 'watch-score',
					'winner': games[gameId].players[winner].username,
				}
				sendBroadcastMessage(gameId, payLoad);
			}
		}

		if (message.method === 'req-score') {
			let clientId = message.clientId;
			let gameId = message.gameId;
			const payLoad = {
				'method': 'req-score',
				'score': games[gameId].getScores(),
			}
			sendMessage(clientId, payLoad);
		}

		if (message.method === 'new-manche') {
			let gameId = message.gameId;
			games[gameId].incReadyPlayers();
			if (games[gameId].checkAllPlayersReady()) {
				games[gameId].newManche();
				const payLoad = {
					'method': 'new-manche',
				}
				sendBroadcastMessage(gameId, payLoad);
			} else {
				const payLoad = {
					'method': 'counter-ready-players',
					'readyPlayers': games[gameId].readyPlayers,
				}
				sendBroadcastMessage(gameId, payLoad);
			}
		}

	});

});

function checkStableConnection(clientId) {
	console.log(connectedClients.hasOwnProperty(clientId));
	return connectedClients.hasOwnProperty(clientId);
}

function createGame(hostId) {
	let gameId = generateUniqueGameId();
	while (isGameIdExisting(gameId)) {
		gameId = generateUniqueGameId();
	}
	games[gameId] = new Game(gameId, hostId, 7, 5);
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

function sendBroadcastMessage(gameId, payLoad) {
	Object.keys(games[gameId].players).forEach(clientId => {
		sendMessage(clientId, payLoad);
	});
}

function sendMessage(clientId, payLoad) {
	const connection = connectedClients[clientId].connection;
	connection.send(JSON.stringify(payLoad));
}

function checkUniqueUsername(gameId, username) {
	for (const player of Object.values(games[gameId].players)) {
		if (player.username === username) {
			return false;
		}
	}
	return true;
	
}
