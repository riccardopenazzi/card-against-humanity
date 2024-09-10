const Manche = require("./Manche");

let debugMode = true;
class Game {
	constructor(gameId, hostId, startCardNumber, targetScore) {
		this._gameId = gameId;
		this._players = {};
		this._manches = [];
		this._usernamesList = [];
		this._hostId = hostId;
		this._blackCards = [];
		this._whiteCards = [];
		this._startCardNumber = startCardNumber;
		this._gameState = 'waiting-players';
		this._targetScore = targetScore;
		this._readyPlayersCounter = 0;
	}

	addPlayer(player) {
		this._players[player.clientId] = player;
		this._usernamesList.push(player.username);
		debugMode && console.log('Player added');   
	}
	
	removePlayer(player) {
		/* const playerIndex = this._players.indexOf(player);
		if (playerIndex !== -1) {
			this._players.splice(playerIndex, 1);
			debugMode && console.log('Player removed');
		} */
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

	get manches() {
		return this._manches;
	}

	get currentManche() {
		return this._manches[this._manches.length - 1];
	}

	get gameState() {
		return this._gameState;
	}

	initGame() {
		this._blackCards = this.#initBlackDeck();
		this._whiteCards = this.#initWhiteDeck();
		this._manches.push(new Manche(this._blackCards.pop(), this._hostId));
		Object.keys(this._players).forEach(player => {
			this._players[player].initPlayerCards(this._whiteCards.splice(-this._startCardNumber));
		});
		this._gameState = 'waiting-white-cards';
	}

	checkMancheComplete() {
		return this.currentManche.whiteCardsPlayed() == (Object.keys(this._players).length - 1);
	}

	checkGameEnd() {
		Object.entries(this._players).forEach(entry => {
			const [id, player] = entry;
			if (player.score == this._targetScore) {
				return id;
			}
		});
		return -1;
	}

	getScores() {
		return Object.values(this._players).sort((a, b) => b.score - a.score).map(player => ({
			username: player.username,
			score: player.score,
		}));
	}

	incReadyPlayers() {
		this._readyPlayersCounter++;
	}

	resetReadyPlayers() {
		this._readyPlayersCounter = 0;
	}

	checkAllPlayersReady() {
		return this._readyPlayersCounter == Object.keys(this._players).length;
	}

	setMancheWinner(winnerId) {
		this.currentManche.setWinner(winnerId);
	}

	newManche() {
		this._manches.push(new Manche(this._blackCards.pop(), this.currentManche.winner));
		this._readyPlayersCounter = 0;
	}

	#initBlackDeck() {
		debugMode && console.log('Init black deck');
		return [
			"La nuova norma sulla sicurezza ora proibisce .............. sugli aerei.",
			"È un peccato che i ragazzini al giorno d’oggi partecipino a .........................",
			"Fra 1.000 anni, quando le banconote saranno soltanto un ricordo lontano, ............... sarà il nostro denaro.",
			"La lega serie A ha vietato ................ poiché dà un vantaggio ingiusto ai giocatori.",
			"Qual è il vizio segreto di Batman?",
			"Il prossimo romanzo di J.K.Rowling. Harry Potter e la camera dei ......... .",
			"Si, ho ucciso .......... Ti domandi come? .................",
			"Prof. mi dispiace ma non ho potuto finire i compiti per colpa di ...............",
			"E il premio Oscar per .............. va a ............................",
			"Per il mio prossimo numero tirerò fuori ........... da ...........",
		  ];
	}

	#initWhiteDeck() {
		debugMode && console.log('Init white deck');
		return [
			"Una maledizione di un Gitano.",
			"Un momento di silenzio.",
			"Un festival della salsiccia.",
			"Un poliziotto onesto che non ha niente da perdere.",
			"Carestia.",
			"Batteri Mangia-Carne.",
			"Serpenti volanti che fanno sesso.",
			"Non fregarsene un cazzo del Terzo Mondo.",
			"Sexting.",
			"Benny Benassi.",
		];
	}

	//TODO manches management
}

module.exports = Game;