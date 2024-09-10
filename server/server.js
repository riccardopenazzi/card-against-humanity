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
			connectedClients[message.clientId].connection = connection;
			const payLoad = {
				'method': 'reconnected',
			}
			sendMessage(message.clientId, payLoad);
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

		if (message.method === 'join') {
			let player = new Player(message.clientId, message.username);
			games[message.gameId].addPlayer(player);
			debugMode && console.log('Player added, ', games[message.gameId].players);
			const payLoad = {
				'method': 'update-players-list',
				'playersList': games[message.gameId].usernamesList,
			};
			sendBroadcastMessage(message.gameId, payLoad);
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
			const payLoad = {
				'method': 'start-manche',
				'blackCard': games[gameId].currentManche.blackCard,
				'mancheNumber': games[gameId].manches.length,
				'masterId': games[gameId].currentManche.master,
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
				console.log('Fine');
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
			if (games[gameId].checkGameEnd() != -1) {
				//someone has won
				
			} else {
				//nobody has won
				const payLoad = {
					'method': 'watch-score',
					'winner': games[gameId].players[winner].username,
				}
				sendBroadcastMessage(gameId, payLoad);
			}
		}

	});

});

function createGame(hostId) {
	let gameId = generateUniqueGameId();
	while (isGameIdExisting(gameId)) {
		gameId = generateUniqueGameId();
	}
	games[gameId] = new Game(gameId, hostId, 3);
	return gameId;
}

function generateUniqueGameId() {
	const randomNumber = Math.floor(Math.random() * 36 ** 6);
	return randomNumber.toString(36).toUpperCase().padStart(6, '0');
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
