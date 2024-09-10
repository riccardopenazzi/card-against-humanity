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
			const connectPayload = {
				"method": "connect",
				"clientId": clientId,
			};
			sendMessage(clientId, connectPayload);
		}

		if (message.method === 'connect-again') {
			connectedClients[message.clientId].connection = connection;
		}

		if (message.method === 'create') {
			let clientId = message.clientId;
			let gameId = createGame(clientId);
			const createPayload = {
				"method": "create",
				"gameId": gameId,
				"hostId": clientId,
			};
			sendMessage(message.clientId, createPayload);
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

	});

});

function createGame(hostId) {
	let gameId = generateUniqueGameId();
	while (isGameIdExisting(gameId)) {
		gameId = generateUniqueGameId();
	}
	games[gameId] = new Game(gameId, hostId);
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
	games[gameId].players.forEach(client => {
		sendMessage(client.clientId, payLoad);
	});
}

function sendMessage(clientId, payLoad) {
	const connection = connectedClients[clientId].connection;
	connection.send(JSON.stringify(payLoad));
}
