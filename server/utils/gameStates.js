const GameState = Object.freeze({
    WAITING_FOR_PLAYERS: 'waiting-for-players',
    CHOOSING_WHITE_CARDS: 'choosing-white-cards',
    VOTING_SURVEY: 'voting-survey',
    CHOOSING_WINNER: 'choosing-winner',
    WATCHING_SCORES: 'watching-scores',
});

module.exports = GameState;