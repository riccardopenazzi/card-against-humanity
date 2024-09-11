const Manche = require("./Manche");

let debugMode = true;
class Game {
	constructor(gameId, hostId, startCardNumber, targetScore) {
		this._gameId = gameId;
		this._players = {};
		this._manches = [];
		this._usernamesList = [];
		this._hostId = hostId;
		this._blackCards = [];
		this._whiteCards = [];
		this._startCardNumber = startCardNumber;
		this._gameState = 'waiting-players';
		this._targetScore = targetScore;
		this._readyPlayersCounter = 0;
	}

	addPlayer(player) {
		this._players[player.clientId] = player;
		this._usernamesList.push(player.username);
		debugMode && console.log('Player added');   
	}
	
	removePlayer(player) {
		/* const playerIndex = this._players.indexOf(player);
		if (playerIndex !== -1) {
			this._players.splice(playerIndex, 1);
			debugMode && console.log('Player removed');
		} */
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

	initGame() {
		this._blackCards = this.#initBlackDeck();
		this._blackCards.sort(() => Math.random() - 0.5);
		this._whiteCards = this.#initWhiteDeck();
		this._whiteCards.sort(() => Math.random() - 0.5);
		this._manches.push(new Manche(this._blackCards.pop(), this._hostId));
		Object.keys(this._players).forEach(player => {
			this._players[player].initPlayerCards(this._whiteCards.splice(-this._startCardNumber));
		});
		this._gameState = 'waiting-white-cards';
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
		Object.keys(this._players).forEach(player => {
			console.log(player + ' ' + this.currentManche.master);
			if (player !== this.currentManche.master) {
				this._players[player].addNewCart(this._whiteCards.pop());
			}
		});
		this._manches.push(new Manche(this._blackCards.pop(), this.currentManche.winner));
		this._readyPlayersCounter = 0;
	}

	#initBlackDeck() {
		debugMode && console.log('Init black deck');
		return [
			"La nuova norma sulla sicurezza ora proibisce _ sugli aerei.",
			"è un peccato che i ragazzini al giorno d'oggi partecipino a _",
					"Fra 1.000 anni, quando le banconote saranno soltanto un ricordo lontano, _ sarà il nostro denaro.",
				"La lega serie A ha vietato _ poichè dà un vantaggio ingiusto ai giocatori.",
			   "Qual è il vizio segreto di Batman?",
				"Il prossimo romanzo di J.K.Rowling. Harry Potter e la camera dei _",
				"Si, ho ucciso _ Ti domandi come? _",
				"Prof. mi dispiace ma non ho potuto finire i compiti per colpa di _",
			   "E il premio Oscar per _ va a _",
				"Per il mio prossimo numero tirerò fuori _ da _",
			   "Cosa ho portato dal Messico?",
				"è un app per quello.",
				"Passo 1: _ Passo 2: _ Passo 3: Guadagno!",
			   "_ Scommetto che non ne desideri soltanto uno!",
			   "Qual è il mio antidroga?",
			   "Mentre gli USA e la Russia gareggiavano per la conquista della Luna, il Messico ha investito milioni di pesos in _",
			   "Nel nuovo film della Disney, Hannah Montana si scontra per la prima volta contro _",
			   "Qual è il mio potere segreto?",
			"Qual è la nuova dieta del momento?",
			"Cosa si mangia Vin Diesel per cena?",
			"Quando il faraone rimase impassibile, Mosè scateno la piaga _",
			"Come faccio a mantenere la mia attuale relazione?",
			"Qual è la cosa più incrostata?",
			"Nel carcere di Los Angeles le voci dicono che puoi scambiare 200 sigarette per _",
			"Dopo il terremoto Sean Penn portò _ alle persone di Haiti.",
			"Invece del carbone la Befana ora porta ai bambini cattivi _",
			"La vita degli indiani d'America cambiò per sempre quando gli uomini bianchi Ii introdussero a _",
			"Cosa usano gli insegnanti per ispirare al successo i ragazzi?",
			"Amaro Montenegro. Sapore di _",
			"Negli ultimi istanti di vita di Michael Jackson lui pensò a _",
			"Ai neri piace _",
			"Perchè ho male ovunque?",
			"Una romantica cena a lume di candela è incompleta senza _",
			"Cosa posso andare a prendere dal passato per convincere la gente di essere un potente stregone?",
			"Sono Valerio Staffelli e sono qui per parlavi di _",
			"La gita scolastica fu completamente rovinata da _",
			"Qual è il miglior amico di una ragazza?",
			"Cara TopGirl, ho difficoltà con _ e vorrei qualche consiglio.",
			"Quando sarò il capo del governo creerò il Ministero del _",
			"Cosa mi stanno nascondendo i miei genitori?",
			"Cosa non fallisce mai nel ravvivare una festa?",
			"Cosa migliora con l'età?",
			"_ buono fino all'ultima goccia.",
			"Ho un sacco di problemi ma _ non è fra questi.",
			"_ è una trappola!",
			"Il nuovo reality show di MTV presenterà otto celebrità sull'orlo dello sfinimento che vivranno con _",
			"Cos'è che mia nonna troverebbe allarmante ma nello stesso tempo anche stranamente affascinante?",
			"Chi è il più emo?",
			"Non avevo veramente compreso _ finchè non incontrai _",
			"Durante il sesso mi piace pensare a _",
			"Cosa fece finire la mia passata relazione?",
			"Cos'è questo suono?",
			"_ Così è come voglio morire!",
			"Perchè sono appiccicoso?",
			"Quale sarà il prossimo giocattolo dell'Happy Meal?",
			"Cosa sarà disponibile a volontà in paradiso?",
			"Non so con che armi sarà combattuta la terza guerra mondiale. Ma nella quarta si useranno _",
			"Cosa ti permette di portarti a letto, con assoluta certezza, una ragazza?",
			"Voci dicono che il piatto preferito di Vladimir Putin è _ ripieno di _",
			"Perchè non riesco a dormire?",
			"Cos'è questo odore?",
			"Cosa aiuterebbe Monti a rilassarsi?",
			"Questo è come il mondo finirà, non con una esplosione ma con _",
			"In arrivo a Broadway quest'anno, _: il musical.",
			"Gli antropologi hanno recentemente scoperto un'antica tribù che venera _",
			"Ma prima che la uccida Signor Bond le voglio mostrare _",
			"Recenti studi hanno mostrato che topi di laboratorio impiegano il 50% in meno per uscire da un labirinto se sono stati esposti a _",
			"Quale sarà la prossima coppia di supereroi?",
			"Prossimamente su Rai Sport 2: i mondiali di _",
			"Quando sarò milionario erigerò una statua di 30 metri per commemorare _",
			"Nel tentativo di attrarre nuove persone, il museo nazionale di Storia Naturale inaugurerà una mostra interattiva su _",
			"Guerra! A cosa ci serve?",
			"Cosa mi crea flatulenze incontrollabili?",
			"Di cosa odorano le persone anziane?",
			"A cosa rinuncio per la quaresima?",
			"La medicina alternativa sta ora adottando i poteri curativi di _",
			"Quale cosa l'Italia ha paracadutato ai bambini afghani?",
			"Cosa piace a Silvio Berlusconi?",
			"Durante il trascurato Periodo Marrone, Picasso ha prodotto centinai di quadri su _",
			"Cosa non vuoi trovare nel tuo cibo cinese?",
			"Bevo per dimenticare _",
			  "_ Dammi un cinque fratello!",
		];
	}

	#initWhiteDeck() {
		debugMode && console.log('Init white deck');
		return [
			"Una maledizione di un Gitano.",
			"Un momento di silenzio.",
			"Un festival della salsiccia.",
			"Un poliziotto onesto che non ha niente da perdere.",
			"Carestia.",
			"Batteri Mangia-Carne.",
			"Serpenti volanti che fanno sesso.",
			"Non fregarsene un cazzo del Terzo Mondo.",
			"Sexting.",
			"Benny Benassi.",
			"Pornostar.",
			"Stupro e Saccheggio.",
			"72 vergini.",
			"Sparatoria da auto in corsa.",
			"Un paradosso da viaggio nel tempo.",
			"Cucina autentica messicana.",
			"Gioielli da rapper.",
			"Consulente.",
			"Oberato dai debiti.",
			"Problemi col babbo.",
			"Avere l'approvazione di Lapo Elkan.",
			"Far cadere un lampadario sopra ai tuoi nemici e farsi sollevare dalla corda che lo sosteneva.",
			"L'Ex presidente George W. Bush.",
			"Nudità completa.",
			"Iniezioni ormonali.",
			"Covare un uovo.",
			"Spogliarsi e mettersi a guardare l'Albero Azzurro.",
			"Far finta di interessarsi.",
			"Ridicolizzarsi in pubblico.",
			"Scambiarsi le siringhe.",
			"Caccole.",
			"L'inevitabile morte termica dell'universo.",
			"Il miracolo della nascita.",
			"Il rapimento alieno.",
			"Tirarlo fuori.",
			"I privilegi dei bianchi.",
			"Compiti da moglie.",
			"La banda Bassotti.",
			"Deodorante AXE.",
			"Il sangue di Cristo.",
			"Orribili incidenti dovuti alla depilazione laser.",
			"BATMAN!!!",
			"Agricoltura.",
			"Un robusto mongoloide.",
			"Selezione naturale.",
			"Aborti fatti con l'appendiabiti.",
			"Mangiarsi tutti i dolci prima dell'inizio della cena di beneficenza per i malati di AIDS.",
			"Le braccia di Michelle Obama.",
			"World of Warcraft.",
			"Andare in picchiata.",
			"Obesità.",
			"Un montaggio pallavolistico omoerotico.",
			"Tetano.",
			"Una dimostrazione di un accoppiamento.",
			"Torsione del testicolo.",
			"Cena a buffet per 5 euro.",
			"Pizza con la nutella.",
			"Gigi D'Alessio.",
			"Formaggio piccante.",
			"Attacchi da Velociraptor.",
			"Togliersi la maglietta.",
			"Smegma.",
			"Alcolismo.",
			"Un uomo di mezza eta' con un paio di pattini in linea.",
			"Lo sguardo fisso di una Winx.",
			"Abbuffarsi e vomitare.",
			"Lecca-Lecca giganti.",
			"Disgusto di sè.",
			"Bambini al guinzaglio.",
			"Preliminari meschini.",
			"La sacra Bibbia.",
			"Porno in un sotterraneo tedesco.",
			"Essere in fiamme.",
			"Gravidanza in età adolescenziale.",
			"Gandhi.",
			"Lasciare un messaggio imbarazzante in segreteria.",
			"Montanti.",
			"Agente del servizio clienti.",
			"Un'erezione che dura più di quattro ore.",
			"I miei genitali.",
			"Rimorchiare ragazze all'ospedale dopo un aborto.",
			"Scienza.",
			"Sesso orale non ricambiato.",
			"Uccelli incapaci di volare.",
			"Una buona sniffata.",
			"Tortura cinese.",
			"Una colazione bilanciata.",
			"Scuole gestite da suore.",
			"Rubare veramente una caramella ad un bambino.",
			"La fondazione Make-A-Wish.",
			"Una grattata di culo clandestina.",
			"Post-it passivi aggressivi.",
			"La squadra di ginnastica artistica cinese.",
			"Passare a Vodafone.",
			"Fare solo un pochino di pipì.",
			"Video di Barbara D'Urso in lacrime mentre ascolta una storia triste.",
			"Polluzione notturna.",
			"Gli ebrei.",
			"Le mie tette.",
			"Cosce poderose.",
			"Fare I'occhioIino a persone anziane.",
			"Mr. Muscolo, giusto dietro di te.",
			"Una gentile carezza nell'interno della coscia.",
			"Tensione sessuale.",
			"Il frutto proibito.",
			"Skeletor.",
			"KiteKat.",
			"Essere ricco.",
			"Dolce, dolce vendetta.",
			"Popolo delle Libertà.",
			"Centauri.",
			"Un'antiIope che soffre di flatulenza.",
			"Natalie Portman.",
			"Toccare una tetta senza dare nell'occhio.",
			"Piloti Kamikaze.",
			"Sean Connery.",
			"Obbiettivi politici degli omosessuali.",
			"Un operoso cinese.",
			"Un falco con un cappuccio in testa.",
			"Chierichetti.",
			"Pac-Man.",
			"Diventare così arrabbiati da farsi venire un'erezione.",
			"Campioni gratuiti.",
			"Un gran rumore per nulla.",
			"Fare la cosa giusta.",
			"I patti Lateranensi.",
			"Allattamento.",
			"La pace nel mondo.",
			"RoboCop.",
			"Faccia tosta.",
			"Justin Bieber.",
			"Oompa-Loompa.",
			"Gorgheggi in momenti inappropriati.",
			"Pubertà.",
			"Fantasmi.",
			"Una spagnola non simmetrica.",
			"Mani vigorose da jazzista.",
			"Ditalini.",
			"Bruno Vespa che si impiglia con lo scroto in un gancio per le tende.",
			"Polaretti.",
			"Violenza della polizia.",
			"Totò Riina.",
			"Preadolescente.",
			"Scalpare.",
			"Mascherare una risata quando vengono menzionati gli Hutu e i Tutsi.",
			"Twittare.",
			"Darth Fenner.",
			"Una pugnetta triste.",
			"Esattamente quello che ti aspetti.",
			"Aspettarsi un rutto e invece vomitare sul pavimento.",
			"Psicofarmaci.",
			"Cellule staminali embrionali.",
			"Un succulento seno.",
			"Sesso tra panda.",
			"Una Iobotomia fatta con un punteruolo.",
			"Tom Cruise.",
			"Herpes labiale.",
			"Capodogli.",
			"Barboni.",
			"Petting duro.",
			"Incesto.",
			"Pac-Man che trangugia sperma.",
			"Un mimo che ha un infarto.",
			"Hulk Hogan.",
			"Dio.",
			"Esfoliarsi la pelle sotto i rotoli di grasso.",
			"Doccia di piscio.",
			"Emozioni.",
			"Leccare cose per rivendicarle come proprie.",
			"Birra Moretti.",
			"La placenta.",
			"Combustione umana spontanea.",
			"Scopamici.",
			"Dipingere con le dita.",
			"L'odore delle persone vecchie.",
			"Avere soltanto un pollo di gomma con una carrucola in mezzo.",
			"I miei demoni interiori.",
			"Un Liquidator pieno di piscio di gatto.",
			"Giuseppe Mazzini.",
			"Coccolarsi.",
			"Rosso relativo.",
			"Combattimenti tra galli.",
			"Fuoco amico.",
			"Ronald Reagan.",
			"Un compleanno deludente.",
			"Una sfacciata donna di colore.",
			"Ragazzini che partecipano alle olimpiadi della matematica.",
			"Un minuscolo cavallo.",
			"Diego Abatantuono.",
			"Cavalcare al tramonto.",
			"Un colpo di scena degno di M. Night Shyamalan.",
			"Dredlock.",
			"Distruzione reciproca.",
			"Pedofili.",
			"Lievito.",
			"Saccheggiare tombe.",
			"Mangiare I'ultimo bisonte.",
			"Catapulte.",
			"Persone povere.",
			"Il nome della rosa.",
			"La forza.",
			"Pulirle il culo.",
			"Creazionismo.",
			"Bocca larga.",
			"AIDS.",
			"Foto di tette.",
			"Il superuomo.",
			"Sarah Palin.",
			"Giochi senza frontiere.",
			"Sballarsi.",
			"Scientology.",
			"L'invidia per il pene.",
			"Curare l'omosessualità pregando.",
			"Spassarsela.",
			"Due nani che stanno cagando in un secchio.",
			"Il KKK.",
			"Gengis Khan.",
			"Cristalli di metanfetamina.",
			"Servi della gleba. Il pericolo degli sconosciuti.",
			"Bop it",
			"La carriera di attore di Shaquille O'NeaI.",
			"Baldanzoso.",
			"La giustizia spicciola.",
			"Un bukkake censurato.",
			"Una vita di tristezza.",
			"Razzismo.",
			"Lancio dei nani.",
			"Sole e arcobaleni.",
			"Una scimmia che fuma un sigaro.",
			"Inondazione improvvisa.",
			"Il testicolo mancante di Lance Armstrong.",
			"Conati di vomito.",
			"I terroristi.",
			"Britney Spears a 55 anni.",
			"Atteggiamento.",
			"Entrare a canzone iniziata e mettersi a ballare selvaggiamente.",
			"Lebbra.",
			"Gloryholes.",
			"Lame nei capezzoli.",
			"Il cuore di un bambino.",
			"Cuccioli!",
			"Svegliarsi mezzo nudo nel parcheggio di un McDonald.",
			"Dighe dentali.",
			"La vagina di Oriana Fallaci.",
			"Il perineo.",
			"Ascolto interessato.",
			"Pulizia etnica.",
			"Il brutto anatroccolo.",
			"La mano invisibile.",
			"Aspettare fino al matrimonio.",
			"Stupidita' incomprensibile.",
			"Euphoria di Calvin Klein",
			"Riciclare regali.",
			"Disfunzione erettile.",
			"Sovra-compensazione.",
			"Auto-cannibalismo.",
			"La mia collezione di giocattoli erotici high-tech.",
			"Il Papa.",
			"Le persone non di colore.",
			"Porno Tentacolari.",
			"Giuliano Ferrara che vomita convulsamente mentre una nidiata di granchi-ragno si schiude nel suo cervello e fuoriesce dai suoi condotti lacrimali.",
			"Troppo gel per capelli.",
			"Seppuku.",
			"Ballare su ghiaccio con persone dello stesso sesso.",
			"Barare alle Paraolimpiadi.",
			"Carisma.",
			"Keanu Reeves.",
			"Dario Argento.",
			"Nickelback.",
			"Una rapida occhiata.",
			"Cagarsi l'anima.",
			"Bambini con il cancro al culo.",
			"Una sorpresa salata.",
			"Il sud.",
			"La violazione dei nostri diritti umani basilari.",
			"DEVI COSTRUIRE ALTRI PILONI.",
			"Stupro su appuntamento.",
			"Essere fantastici.",
			"Necrofilia.",
			"Super Quark.",
			"Le persone di colore.",
			"Codice cavalleresco.",
			"Lunchables.",
			"Stronze.",
			"Le persone totalmente handicappate.",
			"Orfani commoventi.",
			"Hitler.",
			"Cacca che fa bruciare il culo.",
			"Un altro dannato film sui vampiri.",
			"Molle Slinky attorcigliate.",
			"Il vero significato del Natale.",
			"Estrogeni.",
			"Un'aspra marmellata per colazione.",
			"Quella cosa che dà la scossa agli addominali.",
			"Espellere un calcolo renale.",
			"Un buco del culo sbiancato.",
			"Michael Jackson.",
			"Impianti cibernetici.",
			"Ragazzi che non telefonano.",
			"Untori.",
			"Masturbazione.",
			"Allusione sul ceto sociale.",
			"Flato vaginale.",
			"Nascondere un'erezione.",
			"Intimo commestibile.",
			"Viagra.",
			"Zuppa che è troppo calda.",
			"Maometto.",
			"Sesso a sorpresa!",
			"Mac.",
			"Bere da solo.",
			"Dita a forma di cazzo.",
			"Ferite da arma da taglio multiple.",
			"Farsela addosso.",
			"Abusi infantili.",
			"Palline anali.",
			"Morti civili.",
			"Salto della quaglia.",
			"Christian De Sica.",
			"Carne di cavallo.",
			"Un cappello davvero alla moda.",
			"Kim Jong-il.",
			"Peli pubici sul bordo del cesso.",
			"Testimoni di Geova.",
			"Discriminazione politica.",
			"Farlo dall'entrata posteriore.",
			"Imboccare Platinette.",
			"Insegnare a un robot ad amare.",
			"Un mare di guai.",
			"Un mulino a vento pieno di cadaveri.",
			"La tigre dei KeIIogg's.",
			"Indossare la biancheria al contrario per evitare di lavarla.",
			"Un raggio della morte.",
			"Il soffitto di vetro.",
			"Un frigorifero pieno di organi.",
			"Il sogno americano.",
			"Bere un barile di birra a testa in giù.",
			"Quando scoreggi ma ti esce anche una sgommata.",
			"Rimangiarsi quello che si è detto.",
			"Neonati morti.",
			"Prepuzio.",
			"Assoli di Sassofoni.",
			"Americani.",
			"Un feto.",
			"Sparare fucilate al cielo mentre stai penetrando fino alle palle un cinghiale urlante.",
			"Giorgio Napolitano.",
			"Mutilati.",
			"Eugenetica.",
			"La mia situazione sentimentale.",
			"Christopher Walken.",
			"Api?",
			"Harry Potter erotica.",
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
			"Nicolas Cage.",
			"Una sfilata di bellezza per bambini.",
			"Esplosioni.",
			"Sniffare colla.",
			"Bruno Vespa molestato da uno stormo di avvoltoi.",
			"Repressione.",
			"Rufis.",
			"La mia vagina.",
			"Pantaloni da cowboy senza sedere.",
			"Psyco.",
			"Dare il 110%.",
			"Sua altezza reale, regina Elisabetta ll.",
			"I Rhapsody of Fire.",
			"Essere tenuto in disparte.",
			"Goblin.",
			"Speranza.",
			"Martin Luther King.",
			"Un micropene.",
			"La mia anima.",
			"Un'orgia.",
			"Vichinghi.",
			"Persone eccitanti.",
			"Seduzione.",
			"Il complesso di Edipo.",
			"Oche.",
			"Riscaldamento globale.",
			"Musica New Age.",
			"Scaldamani tascabili.",
			"Fare il labbrino.",
			"Omicidio mediante veicolo a motore.",
			"Suffragio femminile.",
			"Un profilattico difettoso.",
			"Forum.",
			"Bambini africani.",
			"Massacro di Utoya in Norvegia.",
			"Barack Obama.",
			"Asiatici che non sono bravi in matematica.",
			"Anziani uomini giapponesi.",
			"Scambiarsi battute divertenti.",
			"Coppie omosessuali.",
			"Dividere le acque del Mar Rosso.",
			"Arnold Schwarzenegger.",
			"Pompino alla guida.",
			"Addominali spettacolari.",
			"Panettone.",
			"Un leone depresso.",
			"Un sacchetto di fagioli magici.",
			"Scelte di vita sbagliate.",
			"La mia vita sessuale.",
			"Auschwitz.",
			"Una tartaruga alligatore che ti sta mordendo la punta del pene.",
			"Una detonazione termonucleare.",
			"Il clitoride.",
			"II Big Bang.",
			"Mine antiuomo.",
			"Amici che si mangiano tutti i salatini.",
			"Capre che si stanno mangiando lattine.",
			"Lo Schiaccianoci: La danza della Fata Cofanetto.",
			"Farsi una sega in una piscina di lacrime di bambini.",
			"Flauto a pelle.",
			"Il mio momento.",
			"La metropolitana.",
			"Battute fuori luogo sull'olocausto.",
			"Un mare di guai.",
			"Fantasie di un taglialegna.",
			"Voce di Morgan Freeman.",
			"Donne nelle pubblicità di yogurt.",
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
			"Sistema Oasi Tecnologica del Riposo materassi Eminflex.",
			"Morire.",
			"L'uragano Katrina.",
			"I gay.",
			"La follia di un uomo.",
			"Uomini.",
			"Gli Amish.",
			"Uova di pterodattilo.",
			"Esercizi di \"costruzione del gruppo\".",
			"Un tumore al cervello.",
			"Carte contro l'umanità.",
			"Aver paura di se stesso.",
			"Lady Gaga",
			"L'uomo del latte.",
			"Essere sboccati.",
			"Mestruazioni."
		];
	}

	//TODO manches management
}

module.exports = Game;