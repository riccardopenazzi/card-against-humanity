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

        switch(message.method) {
            case 'connect':
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
                break;
            case 'connect-again':
                connectedClients[message.clientId].connection = connection;
                break;
            case 'create':
                let gameId = createGame();
                const createPayload = {
                    "method": "create",
                    "gameId": gameId,
                };
                sendMessage(message.clientId, createPayload);
                break;

            case 'join':
                let player = new Player(message.clientId, message.username);
                games[message.gameId].addPlayer(player);
                debugMode && console.log('Player added, ', games[message.gameId].players);
                games[message.gameId].players.forEach(client => {
                    const updatePayload = {
                        'method': 'update-players-list',
                        'playersList': games[message.gameId].usernamesList,
                    };
                    sendMessage(client.clientId, updatePayload);
                });
                break;
        }
    });

});

function createGame() {
    let gameId = generateUniqueGameId();
    while (isGameIdExisting(gameId)) {
        gameId = generateUniqueGameId();
    }
    games[gameId] = new Game(gameId);
    return gameId;
}

function generateUniqueGameId() {
    const randomNumber = Math.floor(Math.random() * 36 ** 6);
    return randomNumber.toString(36).toUpperCase().padStart(6, '0');
}

function isGameIdExisting(gameId) {
    return gameId in games;
}

function sendMessage(clientId, payLoad) {
    const connection = connectedClients[clientId].connection;
    connection.send(JSON.stringify(payLoad));
}