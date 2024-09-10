const Manche = require("./Manche");

let debugMode = true;
class Game {
	constructor(gameId, hostId) {
		this._gameId = gameId;
		this._players = [];
		this._manches = [];
		this._usernamesList = [];
		this._hostId = hostId;
		this._blackCards = [];
		this._whiteCards = [];
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

	get hostId() {
		return this._hostId;
	}

	initGame() {
		this._blackCards = this.#initBlackDeck();
		this._whiteCards = this.#initWhiteDeck();
		this._manches.push(new Manche(this._blackCards.pop(), this._hostId));
	}

	get manches() {
		return this._manches;
	}

	get currentManche() {
		return this._manches[this._manches.length - 1];
	}

	#initBlackDeck() {
		console.log('Init black deck');
	}

	#initWhiteDeck() {
		console.log('Init white deck');
	}

	//TODO manches management
}

module.exports = Game;