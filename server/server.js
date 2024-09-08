const serverPort = 9090;
const expressPort = 9091;

const express = require("express");
const http = require("http");
const app = require("express")();
const path = require("path");

const { v4: uuidv4 } = require('uuid');

app.use(express.static(path.join(__dirname, "../client")));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "../client/screens/index.html")));
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

wsServer.on("request", request => {
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("opened"));
	connection.on("close", () => console.log("closed"));

    //unique id to identify the client that just connected
    const clientId = uuidv4();
    connectedClients[clientId] = {
        "connection": connection,
    };

    //first payLoad sent to the client, it includes the unique clientId
    const payLoad = {
        "method": "connect",
        "clientId": clientId,
    };

    //send the payLoad to the client
    connection.send(JSON.stringify(payLoad));
});