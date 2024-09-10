let debugMode = true;

class Manche {
    constructor(blackCard, master) {
        this._blackCard = blackCard;
        this._playedWhiteCards = {};
        this._master = master;
    }

    get blackCard() {
        return this._blackCard;
    }

    get playedWhiteCards() {
        return this._playedWhiteCards;
    }

    get master() {
        return this._master;
    }

    addCart(clientId, card) {
        this._playedWhiteCards[clientId] = card;
        console.log(this._playedWhiteCards);
    }

    whiteCardsPlayed() {
        return Object.keys(this._playedWhiteCards).length;
    }
}

module.exports = Manche;