const { games } = require('../server.js');
function joinGame(message) {
    let player = new Player(message.clientId, message.username);
    games[message.gameId].addPlayer(player);
}

module.exports = {joinGame};