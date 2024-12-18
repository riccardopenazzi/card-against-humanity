class Player {
    constructor (clientId, username) {
        this._clientId = clientId;
        this._username = username;
        this._score = 0;
        this._playerCards = [];
        this._playerActive = true;
    }

    get clientId() {
        return this._clientId;
    }

    get username() {
        return this._username;
    }

    get score() {
        return this._score;
    }

    get playerCards() {
        return this._playerCards;
    }

    get playerActive() {
        return this._playerActive;
    }
    
    addPoint() {
        this._score++;
    }

    initPlayerCards(playerCardsList) {
       this._playerCards = playerCardsList;
    }

    addNewCard(card) {
        this._playerCards.push(card);
    }

    changePlayerActive(state) {
        if (typeof state === "boolean") {
            this._playerActive = state;
        }
    }

    removeCard(card) {
        let index = this._playerCards.findIndex(x => x == card);
        if (index != -1) {
            this._playerCards.splice(index, 1);
        }
    }

    decrementPlayerScore(quantity) {
        this._score = this._score - quantity;
    }
}

module.exports = Player;