class Player {
    constructor (clientId, username) {
        this._clientId = clientId;
        this._username = username;
        this._score = 0;
        this._playerCards = [];
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
    
    addPoint() {
        this._score++;
    }

    initPlayerCards(playerCardsList) {
       this._playerCards = playerCardsList;
    }

    addNewCart(cart) {
        this._playerCards.push(cart);
    }
}

module.exports = Player;