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
		this._waitingPlayers = [];
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

	get waitingPlayers() {
		return this._waitingPlayers;
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
			card.forEach(card => {
				if (card.standard) {
					this._players[player].addNewCard(card.cardText);
				} else {
					this._players[player].addNewCard(CardVariants.EMPTY_CARD);
				}
			})
			;
		}
	}

	resetPlayedCards() {
		this.currentManche.resetPlayedCards();
	}

	checkMancheComplete() {
		let playedWhiteCards = this.currentManche.playedWhiteCards;
		if (Object.keys(playedWhiteCards).length != (Object.keys(this._players).length - 1)) {
			return false;
		}
		let necessaryCards = this.currentManche.blackCard.split("_").length - 1;
		for (const cards of Object.values(playedWhiteCards)) {
			if (cards.length < necessaryCards) {
				return false;
			} 
		}
		return true;
		/* return this.currentManche.whiteCardsPlayed() == (Object.keys(this._players).length - 1); */
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
			playedCard.forEach(singleCard => {
				this._whiteCardsPlayed.push(playedCard);
			})
			;
		})
		;
		Object.keys(this._players).forEach(player => {
			if (player !== this.currentManche.master) {
				if (this._whiteCardMode && this._waitingPlayers.some(x => x.clientId == player)) {
					this._players[player].addNewCard(CardVariants.EMPTY_CARD);
				}
				let cardsToAdd = this._startCardNumber - this.getRealPlayerCardsNumber(player);
				while (cardsToAdd-- > 0) {
					if (this._whiteCards.length === 0) {
						this._whiteCards = [...this._whiteCardsPlayed].sort(() => Math.random() - 0.5);
						this._whiteCardsPlayed = [];
					}
					this._players[player].addNewCard(this._whiteCards.pop());
				}
				let index = this._waitingPlayers.findIndex(x => x.clientId == player);
				index != -1 && this._waitingPlayers.splice(index, 1);
			}
		});
		if (this._blackCards.length === 0) {
			this._blackCards = this.#initBlackDeck();
			this._blackCards.sort(() => Math.random() - 0.5);
		}
		//Per essere sicuro che la carta contenga almeno un _ altrimenti il gioco va in bomba
		let blackCard = this._blackCards.pop();
		while (!blackCard.includes('_')) {
			blackCard = this._blackCards.pop();
		}
		this._manches.push(new Manche(blackCard, this.currentManche.winner));
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

	addWaitingPlayer(player) {
		this._waitingPlayers.push(player);
	}

	resetWaitingPlayers() {
		this._waitingPlayers = [];
	}

	#initBlackDeck() {
		debugMode && console.log('Init black deck');
		return [
			"Invece del carbone ora la befana porta _ ai bambini cattivi.",
			"Step 1: _ Step 2: _ Step 3: Profitto.",
			"Consiglio divertente! Quando il tuo ragazzo ti chiede di fargli sesso orale prova invece a sorprenderlo con _ .",
			"_ + _ = _ .",
			"Dopo 4 album di platino e 3 Grammys, è ora di tornare alle origini, a ciò che mi ha ispirato all'inizio: _ .",
			"Prossimamente su Rai Sport 2: i mondiali di _ .",
			"Cosa sarà disponibile a volontà in paradiso? _ .",
			"Come ho perso la mia verginità? _ .",
			"Qual è il guilty pleasure di Batman? _ .",
			"Le nuove norme sulla sicurezza ora proibiscono _ sugli aerei.",
			"Cosa permette ad una persona di portarti a letto senza difficoltà? _ .",
			"La gita di classe è stata completamente rovinata da _ .",
			"_ ecco perchè ho male ovunque.",
			"É corretto, ho ucciso _ , \"Come?\" ti chiederai, beh _ .",
			"Quando il faraone è rimasto impassibile Mosè ha ordinato una piaga di _ .",
			"Papà perchè la mamma sta piangendo? _ .",
			"Cos'è questo odore? _ .",
			"Perchè non riesco a dormire la notte? _ .",
			"_ : testato sui bambini, approvato dalle mamme.",
			"Per il mio prossimo trucco di magia tirerò fuori _ da _ .",
			"La medicina alternativa sta ora adottando i poteri curativi di _ .",
			"Medusa Film presenta: _ la storia di _ .",
			"Ragazzi non ho bisogno di droghe per sballarmi, io mi sballo con _ .",
			"Quando sarò milionario erigerò una statua di 50 metri per commemorare _ .",
			"A cosa sta pensando Matteo Salvini in questo momento? _ .",
			"Cosa ha reso il mio primo bacio così orrendo? _ .",
			"Cosa mi stanno nascondendo i miei genitori? _ .",
			"In un mondo rovinato da _ la nostra unica speranza resta _ .",
			"Cosa non fallisce mai nel ravvivare una festa? _ .",
			"Quale sarà la prossima sorpresa dell'Happy Meal? _ .",
			"Guerra! Per cosa è buona? _ .",
			"Questo è come il mondo finirà, non con una esplosione ma con _ .",
			"Hey Reddit! Sono _ , chiedetemi qualcosa.",
			"In arrivo a Broadway quest'anno, _ : il musical.",
			"Cos'è che mia nonna troverebbe strano ma allo stesso tempo anche eccitante? _ .",
			"Cara Abby, sto avendo un po' di problemi con _ e mi piacerebbe avere un tuo consiglio.",
			"_ è un pendio scivoloso che ti porta a _ .",
			"Quando ero sotto acidi _ si è trasformato in _ .",
			"Nel carcere di Los Angeles le voci dicono che puoi scambiare 200 sigarette per _ .",
			"Ma prima che mi uccida Signor Bond le voglio mostrare _ .",
			"Ho un sacco di problemi ma _ non è fra questi.",
			"Dopo il terremoto Sean Penn portò _ alle persone di Haiti.",
			"È un peccato che i ragazzini al giorno d'oggi partecipino a _ .",
			"Quale cosa l'Italia ha paracadutato ai bambini afghani? _ .",
			"Quando sarò presidente creerò il ministero degli _ .",
			"Cos'è il miglior amico di una ragazza? _ .",
			"Ai bianchi piace _ .",
			"Ai neri piace _ .",
			"Ciao ragazzi, so che è stata una mia idea ma sto avendo seri dubbi su _ .",
			"Una cena romantica a lume di candela sarebbe incompleta senza _ .",
			"Nel nuovo film della Disney, Hannah Montana si scontra per la prima volta contro _ .",
			"Cosa non vuoi trovare nel tuo cibo cinese? _ .",
			"_ è una trappola!",
			"Qual è il mio potere segreto? _ .",
			"Cosa ho portato dal Messico? _ .",
			"Nel tentativo di attrarre nuove persone, il museo nazionale di Storia Naturale inaugurerà una mostra interattiva su _ .",
			"Non ho mai veramente capito _ finchè non ho incontrato _ .",
			"Presentato il nuovo incredibile duo supereroe/aiutante! É composto da _ e _ .",
			"Oggi a Porta a Porta: aiutatemi mio figlio è _ .",
			"Mentre scopo mi piace pensare a _ .",
			"Ci hanno detto che eravamo matti, secondo loro non potevamo mettere _ dentro a _ . Si sbagliavano.",
			"Scusatemi ma ho un appuntamento con _ .",
			"Ho appena visto questo video sconvolgente! Per favore condividetelo! #stop _ .",
			"Bevo per dimenticare _ .",
			"Mentre gli USA facevano a gara con l'URSS per la corsa alla luna, il governo messicano ha speso milioni di pesos nella ricerca su _ .",
			"Cos'è questo rumore? _ .",
			"Qual è stata la causa della fine della mia ultima relazione? _ .",
			"Un recente studio ha dimostrato che gli studenti universitari facevano il 50% di sesso in meno dopo essere stati esposti a _ .",
			"Scusi professore ma non ho potuto fare i compiti a causa di _ .",
			"Presentato X-treme Baseball, è come baseball ma con _ .",
			"_ , dammi un cinque fratello!",
			"_ , scommetto che non puoi fartene uno solo.",
			"Me la caverò con un piccolo aiuto da _ .",
			"La vita degli indiani d'America cambiò per sempre quando l'uomo bianco gli fece scoprire _ .",
			"E il premio per _ va a _ . Congratulazioni!",
			"Forse è nata con quello. Forse è _ .",
			"_ , buono fino all'ultima goccia!",
			"Cosa mi fa venire flatulenze incontrollabili? _ .",
			"Nulla mi eccita più di _ .",
			"Quando torno da _ come prima cosa faccio sempre _ .",
			"Fra 1.000 anni, quando le banconote saranno soltanto un ricordo lontano, _ sarà il nostro denaro.",
			"La lega serie A ha vietato _ poichè dà un vantaggio ingiusto ai giocatori.",
			"Il prossimo romanzo di J.K.Rowling. Harry Potter e la camera dei _ .",
			"Qual è la nuova dieta del momento? _ .",
			"Un _ senza _ non ha senso.",
			"Cosa usano gli insegnanti per ispirare al successo i ragazzi? _",
			"Amaro Montenegro. Sapore di _ .",
			"Se ti piace _ adorerai _ .",
			"Sono Valerio Staffelli e sono qui per parlavi di _ .",
			"Un _ in culo e una _ in mano.",
			"Cosa migliora con l'età? _ .",
			"Il nuovo reality show di MTV presenterà otto celebrità sull'orlo dello sfinimento che vivranno con _ .",
			"_ così è come voglio morire!",
			"Einstein disse: Non so con che armi sarà combattuta la terza guerra mondiale. Ma nella quarta si useranno sicuramente _ .",
			"Gli antropologi hanno recentemente scoperto un'antica tribù che venera _ .",
			"Di cosa odorano le persone anziane? _ .",
			"Durante il trascurato Periodo Marrone, Picasso ha prodotto centinai di quadri su _ .",
			"_ fa senza dubbio parte della cultura italiana.",
			"_ odio quando mi succede!",
			"_ è proprio ciò che ci vuole dopo una dura giornata di lavoro.",
			"Ciò che amo fare dopo un'intensa maratona di sesso è _ .",
			"Annunciata la nuova serie con Bruno Barbieri, si chiamerà 4 _ .",
			"La mia infanzia è finita quando _ .",
			"_ mi è successo proprio ieri.",
			"_ è il mio passatempo preferito.",
			"Mia moglie mi ha lasciato dopo che _ .",
			"La cosa che odio di più dei napoletani è _ .",
			"Nonna ora togliti la dentiera e _ .",
			"L'unica cosa che odio di più dei gay è _ .",
			"Secondo me un dildo per essere perfetto deve avere 3 caratteristiche: lungo, grosso e _ .",
			"L'ultimo libro che ho letto parlava di _ , mi ha ispirato moltissimo."
		];
	}

	#initWhiteDeck() {
		debugMode && console.log('Init white deck');
		return [
			"Cristalli di metanfetamina",
			"Pedofili",
			"Un AR-15 da assalto",
			"Un attacco infinito di diarrea",
			"Oompa-Loompa",
			"La mano invisibile",
			"Fantasie di un taglialegna",
			"Disfunzione erettile",
			"Motoseghe al posto delle mani",
			"Post-it passivi aggressivi",
			"Lanciare un vergine in un vulcano",
			"Il primo presidente chimpanzee",
			"Torsione di un testicolo",
			"Dio",
			"Il tuo strano vicino",
			"Pubertà",
			"Bambini al guinzaglio",
			"Una tartaruga che morde la punta del tuo pene",
			"Il Big Bang",
			"Denudarsi e guardare Nickelodeon",
			"Stupidità incontrollabile",
			"AIDS",
			"HIV",
			"3 cazzi nello stesso momento",
			"Una piramide di teste mozzate",
			"Concorsi di bellezza per bambini",
			"L'agenda di un omosessuale",
			"Una buona sniffata",
			"La placenta",
			"Segarsi in una piscina di lacrime di bambini",
			"La brutalità della polizia",
			"Preadolescenti",
			"Abusi infantili",
			"Il delizioso buco di culo di Bruno Vespa",
			"Il sangue di Cristo",
			"L'odore delle persone anziane",
			"Sballarsi veramente tanto",
			"Pulizia etnica",
			"Serpenti volanti che fanno sesso",
			"Un mimo che ha un infarto",
			"1kg di dolcissima eroina messicana",
			"Preliminari a metà",
			"Carne di cavallo",
			"Omicidio colposo",
			"Bambini africani",
			"Un mare di guai",
			"Attrito",
			"Miley Cyrus a 55 anni",
			"Campioni gratuiti di sperma",
			"Campioni gratuiti di squirt",
			"Uccelli incapaci di volare",
			"Stephen Hawking che parla sporco",
			"Consigli da un saggio, vecchio nero",
			"Sovracompensazione",
			"Un bukkake censurato",
			"Suffragio femminile",
			"Una tribù di guerrieri femmine",
			"Prendere fuoco",
			"Carne umana",
			"Lavoro",
			"Le mie tette",
			"Le mie palle",
			"Morire",
			"Essere schiacciato da un distributore automatico",
			"Carestia",
			"La mia anima",
			"Una colazione bilanciata",
			"Repressione",
			"Depressione",
			"Persone povere",
			"Una vita di tristezza",
			"Goblin",
			"Stabilire una posizione dominante",
			"Terroristi",
			"Pollici opponibili",
			"Dare un pugno in faccia a un deputato",
			"Essere ricchi",
			"Un rapimento",
			"Oggetti lucenti",
			"Il diavolo in persona",
			"Leccare le cose per dichiararle tue",
			"2 nani che cagano in un secchio",
			"Razzismo",
			"Svanire nel nulla",
			"Un buco di culo sbiancato",
			"Un buco di culo smerdato",
			"Lame per capezzoli",
			"Ebrei",
			"Dita a forma di cazzo",
			"Non ricambiare sesso orale",
			"Una spagnola asimmetrica",
			"Una lobotomia fatta con un rompighiaccio",
			"Mine anti uomo",
			"Conati di vomito",
			"Un micropene",
			"Mister muscolo dietro di te",
			"La voce di Morgan Freeman",
			"La voce di Bruno Vespa",
			"Bruno Vespa che ti sussurra cose sporche",
			"Domande razziste ai controlli di sicurezza",
			"Esplosioni",
			"Ammiccare a persone anziane",
			"Il KKK",
			"Terribili incidenti con laser per epilazione",
			"Confidenza ingiustificata",
			"Farlo nel culo",
			"La mia ex moglie",
			"Oche",
			"Fare il broncio",
			"Il clitoride",
			"Nonna",
			"Nonno",
			"Una dolce carezza nell'interno coscia",
			"Tuo nipote",
			"Tua nipote",
			"Pantaloni estremamente attillati",
			"Respirare dal cazzo",
			"Tirarlo fuori",
			"Sbattere il cazzo sulla tavola ad una cena di famiglia",
			"Una dolcissima vendetta",
			"Fuoco amico",
			"Commettere crimini",
			"Gandhi",
			"Gravidanze adolescenziali",
			"Sogni bagnati",
			"Orgasmo femminile",
			"Gloryholes",
			"I gay",
			"Scienza",
			"Pregare che i gay vadano via",
			"Camminare in modo gay",
			"Mangiare in modo gay",
			"Guidare da gay",
			"Parlare da gay",
			"Combustione umana spontanea",
			"Il duro lavoro messicano",
			"Persone eccitanti",
			"Il testicolo mancante di Lance Armstrong",
			"La mia vita sessuale",
			"Palle",
			"Asiatici pessimi in matematica",
			"Un preservativo difettoso",
			"Un montaggio pallavolistico omoerotico",
			"Un'erezione che dura più di 4 ore",
			"Vendere crack ai bambini",
			"Un uomo che sta per avere un orgasmo",
			"Una sega triste",
			"Avere ani al posto degli occhi",
			"La fondazione Save the children",
			"Sesso con Bruno Vespa",
			"Una dimostrazione di accoppiamento",
			"Iniezioni ormonali",
			"Il team cinese di ginnastica artistica",
			"Finire lo sperma",
			"Povertà",
			"Arrabbiarsi talmente tanto da avere un'erezione",
			"Lebbra",
			"72 vergini",
			"Tenere fermo un bambino e scoreggiarli addosso",
			"Dare il 110%",
			"50000 volts diretti ai capezzoli",
			"Un miliardo di dollari",
			"Il compromesso dei 3/5",
			"All you can eat di gamberetti per 8.99$",
			"La pace nel mondo",
			"Donne nella pubblicità di yogurt",
			"Aspettare fino al matrimonio",
			"Alcolismo",
			"Uno schiaffo da una puttana",
			"Annegare i bambini nella vasca",
			"Gli amish",
			"Il sud",
			"Caccole",
			"Un tumore cerebrale",
			"Una scimmia che fuma un sigaro",
			"Il mio stato relazione",
			"Fare un po' di pipì",
			"Cards against humanity",
			"I miei genitali",
			"Una torcia",
			"Il papa",
			"Schiavitù",
			"Un robusto mongoloide",
			"Un mulino a vento pieno di corpi",
			"La collera di Vladimir Putin",
			"Il patriarcato",
			"Il soffitto di cristallo",
			"Un frigorifero pieno di organi",
			"Il sogno americano",
			"Non indossare i pantaloni",
			"Le mie palle sulla tua faccia",
			"Cagare in un laptop e chiuderlo",
			"Bambini morti",
			"Prepuzio",
			"Italiani",
			"Benito Mussolini",
			"Il duce",
			"I fasci",
			"Un feto",
			"Sparare colpi in aria mentre penetri un maiale",
			"Mutilati",
			"Cucina autentica messicana",
			"Scoreggiare e andare via",
			"Un omicidio davvero atroce",
			"Scelte di vita sbagliate",
			"Una pallina di cerume, sperma e ritagli di unghie del piede",
			"Uomini giapponesi anziani",
			"Stalin",
			"Un pube randagio",
			"Fratellanza ebraica",
			"Piloti kamikaze",
			"Fingering",
			"Tensione sessuale",
			"Deporre un uovo",
			"Una donna molto più giovane",
			"Bere da solo",
			"Ferite da taglio multiple",
			"Invadere la Polonia",
			"La mia vagina",
			"Ragazzi senza culo",
			"Uomini",
			"Selezione naturale",
			"Risolvere problemi con la violenza",
			"Nazisti",
			"Parenti morti",
			"Saccheggiare tombe",
			"Essere ancora vergine",
			"Privilegi dei bianchi",
			"Auschwitz",
			"Essere un figlio di puttana",
			"Palline anali",
			"Essere emarginati",
			"Bere dal cesso e mangiare spazzatura",
			"Rabbia mestruale",
			"Una donna di colore impertinente",
			"Golden shower",
			"Foto di tette",
			"I bianchi",
			"I neri",
			"Battute sull'olocausto",
			"Battute sull'olocausto nel momento sbagliato",
			"Battute sui gay",
			"Battute sui gay nel momento sbagliato",
			"Speranza",
			"Sesso tra panda",
			"Essere grassi e stupidi",
			"Essere neri",
			"Essere bianchi",
			"Essere gay",
			"Eterosessuali",
			"Omosessuali",
			"Incesto",
			"Scoparsi la sorella",
			"Scoparsi il fratello",
			"Vedere tua nonna nuda",
			"Vedere tua nonna che fa uno spogliarello",
			"Persone marroni",
			"I cinesi",
			"Aborti tramite attaccapanni",
			"Aborto",
			"Mutande commestibili",
			"Herpes alla bocca",
			"La mia collezione di sex toys tecnologici",
			"Tutta l'erba che 20$ possono comprare",
			"Asciugarle il culo",
			"Senzatetto",
			"Una noiosa orgia",
			"Un'orgia",
			"Un party a base di sesso",
			"Rapporti omosessuali",
			"Trangugiare sperma in modo incontrollabile",
			"Allattamento",
			"Mostrare le tette alla tua famiglia",
			"Invidiare il pene",
			"Mutande usate",
			"Esattamente ciò che ti aspetti",
			"Sesso a sorpresa",
			"Non fregarsene un cazzo del terzo mondo",
			"Urla, terribili urla",
			"Fare la cosa giusta",
			"Fingere di preoccuparsi",
			"Coccole",
			"Coccolare un buco del culo",
			"Coccolare un pisello",
			"Aspettarsi un rutto e vomitare sul pavimento",
			"Scientology",
			"Il mio culo nero",
			"Fare un occhio nero a tua moglie",
			"Doveri coniugali",
			"Silenzio",
			"Cagare in modo fiero",
			"Infilarsi un vaso di vetro nel culo",
			"Il vero significato del natale",
			"Masturbarsi",
			"Masturbarsi di nascosto",
			"Avere onlyfans",
			"Il profilo onlyfans di tua madre",
			"Bambini con il cancro al buco del culo",
			"Una sorpresa salata",
			"La violazione dei diritti umani basilari",
			"Sesso consensuale",
			"Necrofilia",
			"Pedofilia",
			"Puttane",
			"Persone profondamente handicappate",
			"Orfani commoventi",
			"Problemi con il padre",
			"Distruggere un matrimonio",
			"Giocare d'azzardo",
			"Viagra",
			"Essere uno stronzo con i bambini",
			"Lo scalpo di un uomo bianco",
			"Crocifissione",
			"Un flato vaginale",
			"Scambiare una scorreggia per un flato vaginale",
			"Nascondere un'erezione",
			"Avere grandi sogni ma nessuna possibilità di realizzarli",
			"Sniffare colla",
			"Una bella sniffata di prima mattina",
			"La Sacra Bibbia",
			"Sexting",
			"Pornostar",
			"Stupro e saccheggio",
			"Avere l'approvazione di Lapo Elkan",
			"Nudità completa",
			"Spogliarsi e mettersi a guardare l'Albero Azzurro",
			"Scambiarsi le siringhe",
			"Compiti da moglie",
			"Un robusto mongoloide",
			"Mangiarsi tutti i dolci prima dell'inizio della cena di beneficenza per i malati di AIDS",
			"Preliminari meschini",
			"Rimorchiare ragazze all'ospedale dopo un aborto",
			"Una grattata di culo clandestina",
			"Polluzione notturna",
			"Toccare una tetta senza dare nell'occhio",
			"Obbiettivi politici degli omosessuali",
			"Ditalini",
			"Bruno Vespa che si impiglia con lo scroto in un gancio per le tende",
			"Leccare uno scroto sudato",
			"Un succulento seno",
			"Petting duro",
			"Un Liquidator pieno di piscio di gatto",
			"Combattimenti tra galli",
			"Curare l'omosessualità pregando",
			"Lancio dei nani",
			"Hitler",
			"Stupro su appuntamento",
			"Barare alle Paraolimpiadi",
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
			"Le emorroidi"
			]
	}
}

module.exports = Game;