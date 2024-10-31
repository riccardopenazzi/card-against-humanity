const Manche = require("./Manche");
const GameState = require("./gameStates");
const { CardVariants } = require('../../shared/sharedCostants');

let debugMode = true;
class Game {
	constructor(vars) {
		this._gameId = vars.gameId;
		this._players = {};
		this._manches = [];
		this._usernamesList = [];
		this._hostId = vars.hostId;
		this._blackCards = [];
		this._whiteCards = [];
		this._startCardNumber = vars.startCardNumber;
		this._gameState = GameState.WAITING_FOR_PLAYERS;
		this._targetScore = parseInt(vars.targetScore);
		this._readyPlayersCounter = 0;
		this._surveyCounter = 0;
		this._whiteCardMode = vars.whiteCardMode;
		this._whiteCardsPlayed = [];
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

	get readyPlayers() {
		return this._readyPlayersCounter;
	}

	get surveyResult() {
		return this._surveyCounter;
	}

	addPlayer(player) {
		this._players[player.clientId] = player;
		this._usernamesList.push(player.username);
		debugMode && console.log('Player added');   
	}
	
	removePlayer(playerId) {
		delete this._players[playerId];
	}

	activatePlayer(playerId) {
		this._players[playerId].changePlayerActive(true);
	}

	deactivatePlayer(playerId) {
		this._players[playerId].changePlayerActive(false);
	}

	initGame() {
		this._blackCards = this.#initBlackDeck();
		this._blackCards.sort(() => Math.random() - 0.5);
		this._whiteCards = this.#initWhiteDeck();
		this._whiteCards.sort(() => Math.random() - 0.5);
		this._manches.push(new Manche(this._blackCards.pop(), this._hostId));
		Object.keys(this._players).forEach(player => {
			this._players[player].initPlayerCards(this._whiteCards.splice(-this._startCardNumber));
			if (this._whiteCardMode) {
				this._players[player].addNewCard(CardVariants.EMPTY_CARD);
			}
		});
	}

	//used to compute real number of cards excluded special cards
	getRealPlayerCardsNumber(playerId) {
		let playerCards = [...this._players[playerId].playerCards]; //create a copy of the original list
		const emptyCardIndex = playerCards.indexOf(CardVariants.EMPTY_CARD);
		emptyCardIndex != -1 && playerCards.splice(emptyCardIndex, 1);
		return playerCards.length;
	}

	redistributeWhiteCardsPlayed() {
		for (const [player, card] of Object.entries(this.currentManche.playedWhiteCards)) {
			if (card === CardVariants.EMPTY_CARD) {
				this._players[player].addNewCard(ardVariants.EMPTY_CARD);
			} else {
				this._players[player].addNewCard(card);
			}
		}
	}

	resetPlayedCards() {
		this.currentManche.resetPlayedCards();
	}

	checkMancheComplete() {
		return this.currentManche.whiteCardsPlayed() == (Object.keys(this._players).length - 1);
	}

	checkAllPlayersCompletedManche() {
		return this.currentManche.whiteCardsPlayed() == (Object.keys(this._players).length - 1);
	}

	checkGameEnd() {
		for (const player of Object.values(this._players)) {
			if (player.score === this._targetScore) {
				return true;
			}
		}
		return false;
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
		Object.values(this.currentManche.playedWhiteCards).forEach(playedCard => {
			this._whiteCardsPlayed.push(playedCard);
		})
		;
		Object.keys(this._players).forEach(player => {
			if (player !== this.currentManche.master) {
				let cardsToAdd = this._startCardNumber - this.getRealPlayerCardsNumber(player);
				console.log('start: ' + this._startCardNumber + ' real: ' + this.getRealPlayerCardsNumber(player) + ' add ' + cardsToAdd)
				while (cardsToAdd-- > 0) {
					if (this._whiteCards.length === 0) {
						this._whiteCards = [...this._whiteCardsPlayed].sort(() => Math.random() - 0.5);
						this._whiteCardsPlayed = [];
					}
					this._players[player].addNewCard(this._whiteCards.pop());
				}
			}
		});
		if (this._blackCards.length === 0) {
			this._blackCards = this.#initBlackDeck();
			this._blackCards.sort(() => Math.random() - 0.5);
		}
		this._manches.push(new Manche(this._blackCards.pop(), this.currentManche.winner));
		this._readyPlayersCounter = 0;
	}

	resetSurveyCounter() {
		this._surveyCounter = 0;
	}

	surveyPositiveVote() {
		this._surveyCounter++;
		this.incReadyPlayers();
	}

	surveyNegativeVote() {
		this._surveyCounter = this._surveyCounter - 1;
		this.incReadyPlayers();
	}

	skipBlackCard() {
		this.currentManche.changeBlackCard(this._blackCards.pop());
	}

	updateGameState(gameState) {
		this._gameState = gameState;
	}

	skipManche() {
		this.redistributeWhiteCardsPlayed();
		this.currentManche.setWinner(Object.keys(this._players)[0]);
	}

	#initBlackDeck() {
		debugMode && console.log('Init black deck');
		return [
			"La nuova norma sulla sicurezza ora proibisce _ sugli aerei.",
			"È un peccato che i ragazzini al giorno d'oggi partecipino a _ .",
			"Fra 1.000 anni, quando le banconote saranno soltanto un ricordo lontano, _ sarà il nostro denaro.",
			"La lega serie A ha vietato _ poichè dà un vantaggio ingiusto ai giocatori.",
			"Qual è il vizio segreto di Batman? _ .",
			"Il prossimo romanzo di J.K.Rowling. Harry Potter e la camera dei _ .",
			"Prof. mi dispiace ma non ho potuto finire i compiti per colpa di _ .",
			"Cosa ho portato dal Messico? _ .",
			"Mentre gli USA e la Russia gareggiavano per la conquista della Luna, il Messico ha investito milioni di pesos in _ .",
			"Nel nuovo film della Disney, Hannah Montana si scontra per la prima volta contro _ .",
			"Qual è la nuova dieta del momento? _ .",
			"Cosa si mangia Vin Diesel per cena? _ .",
			"Quando il faraone rimase impassibile, Mosè scateno la piaga _ .",
			"Nel carcere di Los Angeles le voci dicono che puoi scambiare 200 sigarette per _ .",
			"Dopo il terremoto Sean Penn portò _ alle persone di Haiti.",
			"Invece del carbone la Befana ora porta ai bambini cattivi _ .",
			"La vita degli indiani d'America cambiò per sempre quando gli uomini bianchi Ii introdussero a _ .",
			"Cosa usano gli insegnanti per ispirare al successo i ragazzi? _",
			"Amaro Montenegro. Sapore di _ .",
			"Negli ultimi istanti di vita di Michael Jackson lui pensò a _ .",
			"Ai neri piace _ .",
			"_ ecco perchè ho male ovunque.",
			"Una romantica cena a lume di candela è incompleta senza _ .",
			"Sono Valerio Staffelli e sono qui per parlavi di _ .",
			"La gita scolastica fu completamente rovinata da _ .",
			"Quando sarò il capo del governo creerò il Ministero del _ .",
			"Cosa non fallisce mai nel ravvivare una festa? _ .",
			"Cosa migliora con l'età? _ .",
			"_ buono fino all'ultima goccia.",
			"Ho un sacco di problemi ma _ non è fra questi.",
			"_ è una trappola!",
			"Il nuovo reality show di MTV presenterà otto celebrità sull'orlo dello sfinimento che vivranno con _ .",
			"Cos'è che mia nonna troverebbe allarmante ma nello stesso tempo anche stranamente affascinante? _ .",
			"Durante il sesso mi piace pensare a _ .",
			"_ così è come voglio morire!",
			"Quale sarà il prossimo giocattolo dell'Happy Meal? _ .",
			"Cosa sarà disponibile a volontà in paradiso? _ .",
			"Non so con che armi sarà combattuta la terza guerra mondiale. Ma nella quarta si useranno sicuramente _ .",
			"Cosa ti permette di portarti a letto, con assoluta certezza, una ragazza? _ .",
			"_ ecco perchè non riesco a dormire.",
			"Cos'è questo odore? _ .",
			"Questo è come il mondo finirà, non con una esplosione ma con _ .",
			"In arrivo a Broadway quest'anno, _ : il musical.",
			"Gli antropologi hanno recentemente scoperto un'antica tribù che venera _ .",
			"Ma prima che mi uccida Signor Bond le voglio mostrare _ .",
			"Recenti studi hanno mostrato che topi di laboratorio impiegano il 50% in meno per uscire da un labirinto se sono stati esposti a _ .",
			"Prossimamente su Rai Sport 2: i mondiali di _ .",
			"Quando sarò milionario erigerò una statua di 30 metri per commemorare _ .",
			"Nel tentativo di attrarre nuove persone, il museo nazionale di Storia Naturale inaugurerà una mostra interattiva su _ .",
			"Di cosa odorano le persone anziane? _ .",
			"La medicina alternativa sta ora adottando i poteri curativi di _ .",
			"Quale cosa l'Italia ha paracadutato ai bambini afghani? _ .",
			"Durante il trascurato Periodo Marrone, Picasso ha prodotto centinai di quadri su _ .",
			"Cosa non vuoi trovare nel tuo cibo cinese? _ .",
			"_ ecco perchè bevo per dimenticare.",
			"_ dammi un cinque fratello!",
			"_ fa senza dubbio parte della cultura italiana.",
			"_ odio quando mi succede!",
			"_ è proprio ciò che ci vuole dopo una dura giornata di lavoro.",
			"Ciò che amo fare dopo un'intensa maratona di sesso è _ .",
			"Annunciata la nuova serie con Bruno Barbieri, si chiamerà 4 _ .",
			"La mia infanzia è finita quando _ .",
			"_ mi è successo proprio ieri.",
			"_ è il mio passatempo preferito.",
			"_ è il mio sport preferito.",
			"Mia moglie mi ha lasciato dopo che _ .",
			"La cosa che odio di più dei napoletani è _ .",
			"Nonna ora togliti la dentiera e _ .",
			"Niente mi eccita più di _ .",
			"L'unica cosa che odio di più dei gay è _ .",
			"Secondo me un dildo per essere perfetto deve avere 3 caratteristiche: lungo, grosso e _ .",
			"L'ultimo libro che ho letto parlava di _ .",
		];
	}

	#initWhiteDeck() {
		debugMode && console.log('Init white deck');
		return [
			"Serpenti volanti che fanno sesso.",
			"Non fregarsene un cazzo del Terzo Mondo.",
			"Sexting.",
			"Pornostar.",
			"Stupro e Saccheggio.",
			"72 vergini.",
			"Problemi col babbo.",
			"Avere l'approvazione di Lapo Elkan.",
			"Nudità completa.",
			"Iniezioni ormonali.",
			"Spogliarsi e mettersi a guardare l'Albero Azzurro.",
			"Scambiarsi le siringhe.",
			"Tirarlo fuori.",
			"I privilegi dei bianchi.",
			"Compiti da moglie.",
			"Il sangue di Cristo.",
			"Orribili incidenti dovuti alla depilazione laser.",
			"Un robusto mongoloide.",
			"Selezione naturale.",
			"Mangiarsi tutti i dolci prima dell'inizio della cena di beneficenza per i malati di AIDS.",
			"Obesità.",
			"Un montaggio pallavolistico omoerotico.",
			"Una dimostrazione di un accoppiamento.",
			"Torsione del testicolo.",
			"Cena a buffet per 5 euro.",
			"Gigi D'Alessio.",
			"Alcolismo.",
			"Preliminari meschini.",
			"Porno in un sotterraneo tedesco.",
			"Gravidanza in età adolescenziale.",
			"Un'erezione che dura più di quattro ore.",
			"I miei genitali.",
			"Rimorchiare ragazze all'ospedale dopo un aborto.",
			"Sesso orale non ricambiato.",
			"Una buona sniffata.",
			"Una grattata di culo clandestina.",
			"La squadra di ginnastica artistica cinese.",
			"Polluzione notturna.",
			"Gli ebrei.",
			"Le mie tette.",
			"Fare I'occhioIino a persone anziane.",
			"Mr. Muscolo, giusto dietro di te.",
			"Una gentile carezza nell'interno della coscia.",
			"Tensione sessuale.",
			"Toccare una tetta senza dare nell'occhio.",
			"Obbiettivi politici degli omosessuali.",
			"Diventare così arrabbiati da farsi venire un'erezione.",
			"Allattamento.",
			"La pace nel mondo.",
			"Pubertà.",
			"Una spagnola non simmetrica.",
			"Ditalini.",
			"Bruno Vespa che si impiglia con lo scroto in un gancio per le tende.",
			"Polaretti.",
			"Una pugnetta triste.",
			"Aspettarsi un rutto e invece vomitare sul pavimento.",
			"Psicofarmaci.",
			"Un succulento seno.",
			"Sesso tra panda.",
			"Barboni.",
			"Petting duro.",
			"Incesto.",
			"Pac-Man che trangugia sperma.",
			"Un mimo che ha un infarto.",
			"Dio.",
			"Esfoliarsi la pelle sotto i rotoli di grasso.",
			"Doccia di piscio.",
			"Leccare cose per rivendicarle come proprie.",
			"La placenta.",
			"Combustione umana spontanea.",
			"Scopamici.",
			"Dipingere con le dita.",
			"L'odore delle persone vecchie.",
			"Un Liquidator pieno di piscio di gatto.",
			"Combattimenti tra galli.",
			"Fuoco amico.",
			"Una sfacciata donna di colore.",
			"Diego Abatantuono.",
			"Cavalcare al tramonto.",
			"Distruzione reciproca.",
			"Pedofili.",
			"Saccheggiare tombe.",
			"Persone povere.",
			"Pulirle il culo.",
			"Bocca larga.",
			"AIDS.",
			"Foto di tette.",
			"Sballarsi.",
			"Scientology.",
			"L'invidia per il pene.",
			"Curare l'omosessualità pregando.",
			"Spassarsela.",
			"Due nani che stanno cagando in un secchio.",
			"Il KKK.",
			"Cristalli di metanfetamina.",
			"Un bukkake censurato.",
			"Razzismo.",
			"Lancio dei nani.",
			"Una scimmia che fuma un sigaro.",
			"Il testicolo mancante di Lance Armstrong.",
			"Conati di vomito.",
			"I terroristi.",
			"Britney Spears a 55 anni.",
			"Entrare a canzone iniziata e mettersi a ballare selvaggiamente.",
			"Lebbra.",
			"Gloryholes.",
			"Lame nei capezzoli.",
			"Il cuore di un bambino.",
			"Svegliarsi mezzo nudo nel parcheggio di un McDonald.",
			"La vagina di Oriana Fallaci.",
			"Il perineo.",
			"Pulizia etnica.",
			"Il brutto anatroccolo.",
			"La mano invisibile.",
			"Aspettare fino al matrimonio.",
			"Stupidita' incomprensibile.",
			"Riciclare regali.",
			"Disfunzione erettile.",
			"La mia collezione di giocattoli erotici high-tech.",
			"Il Papa.",
			"Le persone non di colore.",
			"Porno Tentacolari.",
			"Giuliano Ferrara che vomita convulsamente mentre una nidiata di granchi-ragno si schiude nel suo cervello e fuoriesce dai suoi condotti lacrimali.",
			"Troppo gel per capelli.",
			"Ballare su ghiaccio con persone dello stesso sesso.",
			"Barare alle Paraolimpiadi.",
			"Una rapida occhiata.",
			"Cagarsi l'anima.",
			"Bambini con il cancro al culo.",
			"Una sorpresa salata.",
			"Il sud.",
			"La violazione dei nostri diritti umani basilari.",
			"Stupro su appuntamento.",
			"Necrofilia.",
			"Le persone di colore.",
			"Stronze.",
			"Le persone totalmente handicappate.",
			"Orfani commoventi.",
			"Hitler.",
			"Cacca che fa bruciare il culo.",
			"Il vero significato del Natale.",
			"Un'aspra marmellata per colazione.",
			"Espellere un calcolo renale.",
			"Un buco del culo sbiancato.",
			"Untori.",
			"Masturbazione.",
			"Flato vaginale.",
			"Nascondere un'erezione.",
			"Intimo commestibile.",
			"Viagra.",
			"Maometto.",
			"Sesso a sorpresa!",
			"Bere da solo.",
			"Dita a forma di cazzo.",
			"Ferite da arma da taglio multiple.",
			"Farsela addosso.",
			"Abusi infantili.",
			"Palline anali.",
			"Salto della quaglia.",
			"Christian De Sica.",
			"Kim Jong-il.",
			"Peli pubici sul bordo del cesso.",
			"Testimoni di Geova.",
			"Discriminazione politica.",
			"Farlo dall'entrata posteriore.",
			"Imboccare Platinette.",
			"Insegnare a un robot ad amare.",
			"Un mulino a vento pieno di cadaveri.",
			"Indossare la biancheria al contrario per evitare di lavarla.",
			"Un frigorifero pieno di organi.",
			"Il sogno americano.",
			"Quando scoreggi ma ti esce anche una sgommata.",
			"Neonati morti.",
			"Prepuzio.",
			"Un feto.",
			"Sparare fucilate al cielo mentre stai penetrando fino alle palle un cinghiale urlante.",
			"Giorgio Napolitano.",
			"Mutilati.",
			"La mia situazione sentimentale.",
			"Scuole Superiori.",
			"Sbronzarsi di collutorio.",
			"Nazisti.",
			"1 kg di eroina Messicana di scarsa qualità.",
			"Stephen Hawking che parla sporco.",
			"Genitori morti.",
			"Permanenza degli oggetti nella sviluppo cognitivo.",
			"Pollici opponibili.",
			"Test di intelligenza con domande razziste.",
			"Parlare a vanvera.",
			"Motoseghe al posto delle mani.",
			"Una sfilata di bellezza per bambini.",
			"Sniffare colla.",
			"Bruno Vespa molestato da uno stormo di avvoltoi.",
			"Rufis.",
			"La mia vagina.",
			"Pantaloni da cowboy senza sedere.",
			"Dare il 110%.",
			"Sua altezza reale, regina Elisabetta II.",
			"Essere tenuto in disparte.",
			"Goblin.",
			"Martin Luther King.",
			"Un micropene.",
			"La mia anima.",
			"Un'orgia.",
			"Persone eccitanti.",
			"Seduzione.",
			"Il complesso di Edipo.",
			"Omicidio mediante veicolo a motore.",
			"Suffragio femminile.",
			"Un profilattico difettoso.",
			"Bambini africani.",
			"Massacro di Utoya in Norvegia.",
			"Barack Obama.",
			"Coppie omosessuali.",
			"Pompino alla guida.",
			"Scelte di vita sbagliate.",
			"La mia vita sessuale.",
			"Auschwitz.",
			"Una tartaruga alligatore che ti sta mordendo la punta del pene.",
			"Il clitoride.",
			"Mine antiuomo.",
			"Farsi una sega in una piscina di lacrime di bambini.",
			"Flauto a palle.",
			"Il mio momento.",
			"Battute fuori luogo sull'olocausto.",
			"Un mare di guai.",
			"Fantasie di un taglialegna.",
			"Voce di Morgan Freeman.",
			"Metodo naturale di allungamento del pene.",
			"Essere un fottuto stregone.",
			"Piercing nei genitali.",
			"Travestiti passabili",
			"Combattimenti sexy con i cuscini.",
			"Palle.",
			"Nonna.",
			"Attrito.",
			"Rompicoglioni.",
			"Scoreggiare e andarsene via.",
			"Essere uno stronzo con i bambini.",
			"Installare, in casa, trappole esplosive per ostacolare i ladri.",
			"Morire.",
			"L'uragano Katrina.",
			"I gay.",
			"La follia di un uomo.",
			"Uomini.",
			"Gli Amish.",
			"Uova di pterodattilo.",
			"Un tumore al cervello.",
			"Mestruazioni.",
			"Scoparsi la babysitter",
			"Uno stupro di gruppo",
			"La propensione naturale delle donne a occuparsi dei bambini e della casa",
			"Picchiare la propria donna",
			"Picchiare il proprio uomo",
			"Sotterrare una puttana in un deserto",
			"Sverginare brutalmente",
			"Scoparsi la vicina",
			"La fila all'ufficio di collocamento",
			"Un sabato sera davanti a Ballando con le stelle",
			"Fare sesso mentre viene annunciato il vincitore di Sanremo",
			"Guardare un porno durante una chiamata di lavoro",
			"Rimanere incinta durante un'orgia",
			"Confondere il sapone con il lubrificante",
			"Fare il prete in una scuola elementare",
			"Lanciarsi da un ponte per non pagare l'affitto",
			"Fare sesso con proprio cugino",
			"Mangiare le ceneri della nonna per un rito satanico",
			"Fare sesso per comprare follower su Instagram",
			"Un matrimonio dove il prete si spoglia",
			"Mandare un sexting al proprio capo per sbaglio",
			"Rubare la protesi di un bambino disabile",
			"Sconfiggere la depressione con la cocaina",
			"Uccidere il proprio coinquilino per non lavare i piatti",	
			"Rubare le caramelle a un bambino e mangiarle davanti a lui",
			"Fare sesso nella casa di riposo della nonna",
			"Scambiarsi i pannolini durante un'orgia",
			"Confondere il Viagra con l'aspirina",
			"Fare uno striptease davanti ai parenti il giorno di Natale",
			"Investire una suora mentre vai a messa",
			"Lasciare un neonato in macchina mentre vai al casinò",
			"Fare pipì nel bicchiere d'acqua di un tuo amico",
			"Scherzare sui disabili in una riunione di beneficenza",
			"Chiedere il divorzio via SMS",
			"Sniffare cocaina dalla schiena di una puttana morta",
			"Usare il cadavere di un parente per girare un TikTok",
			"Guardare un porno durante il battesimo del tuo nipote",
			"Fare una scommessa sulla morte del proprio nonno",
			"Accusare un bambino di aver rubato in un negozio senza prove",
			"Fingere un attacco epilettico per non pagare il conto",
			"Fare sesso sul cofano di una macchina in movimento",
			"Rubare una bambola gonfiabile a una festa",
			"Fare pipì nel caffè del tuo capo",
			"Mettere una telecamera nascosta nella doccia del coinquilino",
			"Fingere di essere morto per saltare il proprio matrimonio",
			"Portare uno stripper a un funerale",
			"Mettere del lassativo nella torta di compleanno di un bambino",
			"Sperperare l'eredità di tua nonna per spassarsela con la sua migliore amica",
			"Minacciare di diventare un serial killer per avere un aumento",
			"Fingere di avere la lebbra per non lavorare",
			"Sorprendere il postino nudo alla porta",
			"Usare un chihuahua per pulirsi il culo",
			"Picchiare Babbo Natale al centro commerciale",
			"Prendere un Uber nudo e non dire nulla",
			"Passare il Natale con una bambola gonfiabile",
			"Fare sesso in una chiesa durante un battesimo",
			"Fare sesso durante un film Disney",
			"Usare il proprio cazzo come pendolo",
			"Dormire con un cuscino imbottito di peli pubici",
			"Un porno di Giorgia Meloni",
			"Un fidget spinner nel culo",
			"Sorprendere i tuoi genitori che fanno sesso (tuo padre è davanti)",
			"Correggere il caffè del tuo capo con della sborra",
			"Un panino farcito di merda",
			"Condividere lo schermo in un meeting e mostrare per sbaglio il porno che hai appena guardato",
			"Geronimo Stilton che pippa cocaina insieme a Bruno Barbieri",
			"Una tazza stracolma di sborra",
			"Il sesso tantrico",
			"Una scatola di biscotti allo squirt",
			"I napoletani",
			"Ciro il napoletano con un raudo in culo",
			"Il naso di Maradona",
			"Odorare di Napoli",
			"11 settembre",
			"Le emorroidi",
		];
	}
}

module.exports = Game;