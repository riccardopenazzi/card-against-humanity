let debugMode = true;
class Game {
	constructor(gameId, hostId) {
		this._gameId = gameId;
		this._players = [];
		this._manches = [];
		this._usernamesList = [];
		this._host = hostId;
	}

	addPlayer(player) {
		this._players.push(player);
		this._usernamesList.push(player.username);
		debugMode && console.log('Player added');   
	}
	
	removePlayer(player) {
		const playerIndex = this._players.indexOf(player);
		if (playerIndex !== -1) {
			this._players.splice(playerIndex, 1);
			debugMode && console.log('Player removed');
		}
	}

	get players() {
		return this._players;
	}

	get gameId() {
		return this._gameId;
	}

	get usernamesList() {
		return this._usernamesList;
	}

	//TODO manches management
}

module.exports = Game;