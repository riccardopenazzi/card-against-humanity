let debugMode = true;

class Manche {
    constructor(blackCard, master) {
        this._blackCard = blackCard;
        this._playedWhiteCards = {};
        this._master = master;
        this._winner = '';
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

    get winner() {
        return this._winner;
    }

    addCard(clientId, card) {
        this._playedWhiteCards[clientId] = card;
        debugMode && console.log(this._playedWhiteCards);
    }

    whiteCardsPlayed() {
        return Object.keys(this._playedWhiteCards).length;
    }

    setWinner(winnerId) {
        this._winner = winnerId;
    }

    changeBlackCard(blackCard) {
        this._blackCard = blackCard;
    }
}

module.exports = Manche;