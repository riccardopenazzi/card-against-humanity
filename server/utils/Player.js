class Player {
    constructor (clientId, username) {
        this._clientId = clientId;
        this._username = username;
        this._score = 0;
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

    addPoint() {
        this._score++;
    }
}