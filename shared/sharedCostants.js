const MessageTypes = Object.freeze({
	CONNECT: 'connect',
	CONNECT_AGAIN: 'connect-again',
	CREATE: 'create',
	VERIFY_GAME_CODE: 'verify-game-code',
	JOIN: 'join',
	START_GAME: 'start-game',
	START_MANCHE: 'start-manche',
	REQ_PLAYER_CARDS: 'req-player-cards',
	PLAY_CARD: 'play-card',
	SHOW_NEXT_CARD: 'show-next-card',
	GO_TO_CHOOSING_WINNER: 'go-to-choosing-winner',
	CHOOSING_WINNER: 'choosing-winner',
	REQ_SCORE: 'req-score',
	NEW_MANCHE: 'new-manche',
	CHECK_CONNECTION: 'check-connection',
	REQ_BLACK_CARD_CHANGE: 'req-black-card-change',
	VOTE_SKIP_SURVEY: 'vote-skip-survey',
	PLAYER_DISCONNECTED: 'player-disconnected',
	PLAYER_DISCONNECTION_MANAGED: 'player-disconnection-managed',
	SKIP_MANCHE: 'skip-manche',
	CONNECTION_TROUBLE: 'connection-trouble',
	CONNECTION_TROUBLE_MANAGED: 'connection-trouble-managed',
	EXEC_POINT_COUNT: 'exec-point-count',
	SHOW_BLACK_EMPTY_CARD: 'show-black-empty-card',
	CHANGE_PLAYER_CARDS: 'change-player-cards',
});

const CardVariants = Object.freeze({
	EMPTY_CARD: 'empty_card', //empty card used in "white card mode"
});

if (typeof module !== 'undefined' && module.exports) {
	module.exports = { MessageTypes, CardVariants };
} else {
	window.MessageTypes = MessageTypes;
	window.CardVariants = CardVariants;
}