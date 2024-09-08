let debugMode = true;
class Game {
    constructor(gameId) {
        this._gameId = gameId;
        this._players = [];
        this._manches = [];
    }

    addPlayer(player) {
        this._players.push(player);
        debugMode && console.log('Player added');
    }

    removePlayer(player) {
        const playerIndex = this._players.indexOf(player);
        if (playerIndex !== -1) {
            this._players.splice(playerIndex, 1);
            debugMode && console.log('Player removed');
        } else {
            console.log('Player not found');
        }
    }

    get players() {
        return this._players;
    }

    get gameId() {
        return this._gameId;
    }

    //TODO manches management
}