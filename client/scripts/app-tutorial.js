import { navigateTo } from "./router.js";
import { showLoadingMask, hideLoadingMask} from "./loading-mask-controller.js";
import { paintTutorialScreen } from "./playing-room-script.js";
import Shepherd from 'https://cdn.jsdelivr.net/npm/shepherd.js@13.0.0/dist/esm/shepherd.mjs';

function startTutorial() {
    const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
            classes: 'shepherd-theme-dark',
            scrollTo: true,
            cancelIcon: { enabled: false },
        },
    })
    ;

    tour.addStep({
        title: 'Benvenuto nel tutorial',
        text: 'In questo tutorial vedrai come utilizzare al meglio l\' app. Iniziamo!',
        attachTo: { element: '#inesistente', on: 'bottom' },
        buttons: [
            {
                text: 'Prossimo',
                action: () => {
                    tour.next();
                },
            },
        ],
    });

    tour.addStep({
        title: 'Crea una partita',
        text: 'Per creare una partita utilizza questo pulsante',
        attachTo: { element: '#btn-create-container', on: 'bottom' },
        buttons: [
            {
                text: 'Prossimo',
                action: () => {
                    tour.next();
                },
            },
        ],
    });

    tour.addStep({
        title: 'Entra in una partita',
        text: 'Se i tuoi amici hanno già creato una partita inserisci qui il codice e premi sul bottone per entrare in quella partita',
        attachTo: { element: '#input-game-code-container', on: 'bottom' },
        buttons: [
            {
                text: 'Prossimo',
                action: () => {
                    navigateTo('settings');
                    tour.next();
                },
            },
        ],
    });

    tour.addStep({
        title: 'Impostazioni',
        text: 'Se stai creando una partita qui puoi configurare le sue regole',
        /* when: {
            show: () => navigateTo('settings'),
        }, */
        attachTo: { element: '#inesistente', on: 'bottom' },
        buttons: [
            {
                text: 'Prossimo',
                action: () => {
                    tour.next();
                },
            },
        ],
    });

    tour.addStep({
        title: 'Carte per ogni giocatore',
        text: 'Qui puoi impostare il numero di carte che ogni giocatore ha in mano',
        attachTo: { element: '#player-cards-range', on: 'bottom' },
        buttons: [
            {
                text: 'Prossimo',
                action: () => {
                    tour.next();
                },
            },
        ],
    });

    tour.addStep({
        title: 'Vittorie necessarie',
        text: 'Qui puoi impostare il numero di vittorie necessarie per terminare la partita',
        attachTo: { element: '#win-number-range', on: 'bottom' },
        buttons: [
            {
                text: 'Prossimo',
                action: () => {
                    tour.next();
                },
            },
        ],
    });

    tour.addStep({
        title: 'Conferma impostazioni',
        text: 'Una volta impostate le tue preferenze usa questo pulsante per confermarle e andare alla waiting room',
        attachTo: { element: '#btn-confirm-settings-container', on: 'bottom' },
        buttons: [
            {
                text: 'Prossimo',
                action: () => {
                    navigateTo('waiting-room');
                    tour.next();
                },
            },
        ],
    });

    tour.addStep({
        title: 'Waiting room',
        text: 'Questa è la waiting-room, qui i giocatori aspettano che la partita inizi',
        /* when: {
            show: () => navigateTo('waiting-room'),
        }, */
        attachTo: { element: '#inesistente', on: 'bottom' },
        buttons: [
            {
                text: 'Prossimo',
                action: () => {
                    tour.next();
                },
            },
        ],
    });

    tour.addStep({
        title: 'Codice partita',
        text: 'In questa sezione si trova il codice partita, se i tuoi amici vogliono partecipare è necessario che inseriscano questo codice',
        attachTo: { element: '#copy-code-tutorial', on: 'bottom' },
        buttons: [
            {
                text: 'Prossimo',
                action: () => {
                    tour.next();
                },
            },
        ],
    });

    tour.addStep({
        title: 'Link codice partita',
        text: 'In alternativa puoi copiare da qui un link che permette ai tuoi amici di entrare direttamente nella partita',
        attachTo: { element: '#copy-code-tutorial', on: 'bottom' },
        buttons: [
            {
                text: 'Prossimo',
                action: () => {
                    tour.next();
                },
            },
        ],
    });

    tour.addStep({
        title: 'Username',
        text: 'Inserisci qui il tuo username e conferma con il bottone sottostante, fatto questo sarai effettivamente nella partita',
        attachTo: { element: '#txt-username', on: 'bottom' },
        buttons: [
            {
                text: 'Prossimo',
                action: () => {
                    tour.next();
                },
            },
        ],
    });

    tour.addStep({
        title: 'Avvia partita',
        text: 'Questo pulsante sarà mostrato solo all\'host della partita, cioè chi l\'ha creata, e serve per iniziare a giocare. Premilo solo dopo che tutti i giocatori hanno scelto uno username',
        attachTo: { element: '#btn-start-game', on: 'bottom' },
        buttons: [
            {
                text: 'Prossimo',
                action: () => {
                    navigateTo('playing-room');
                    tour.next();
                },
            },
        ],
    });

    tour.addStep({
        title: 'Playing room',
        text: 'Questa è la playing-room, qui è dove si sviluppa il gioco! Vedrai prima i comandi da utente master, ovvero che deve scegliere il vincitore',
        attachTo: { element: '#inesistente', on: 'bottom' },
        buttons: [
            {
                text: 'Prossimo',
                action: () => {
                    tour.next();
                },
            },
        ],
    });

    tour.addStep({
        title: 'Carta da completare',
        text: 'Questa è la carta da completare, le frasi dei giocatori saranno inserite al posto del _',
        attachTo: { element: '#black-card', on: 'bottom' },
        buttons: [
            {
                text: 'Prossimo',
                action: () => {
                    tour.next();
                },
            },
        ],
    });

    tour.addStep({
        title: 'Salta carta',
        text: 'Se la carta da completare non ti piace o non piace agli altri giocatori puoi avviare un sondaggio per decidere di cambiarla. Attenzione questo pulsante è mostrato solo al master ed è possibile farlo una volta sola per manche',
        attachTo: { element: '#btn-skip-card', on: 'bottom' },
        buttons: [
            {
                text: 'Prossimo',
                action: () => {
                    /* showLoadingMask();
                    navigateTo('waiting-room'); */
                    paintTutorialScreen();
                    tour.next();
                },
            },
        ],
    });

   /*  tour.addStep({
        when: {
            show: () => {
                setTimeout(() => {
                    navigateTo('playing-room');
                    tour.next();
                }, 2000);
            }
        },
    }); */

    tour.addStep({
        title: 'Scelta vincitore',
        text: 'Una volta che tutti i giocatori hanno scelto una carta dovrai scegliere il vincitore, per farlo seleziona la carta con la frase vincente con un click, noterai che si alzerà rispetto alle altre',
        attachTo: { element: '#played-card-tutorial', on: 'bottom' },
        when: {
            show: () => hideLoadingMask(),
        },
        buttons: [
            {
                text: 'Prossimo',
                action: () => {
                    tour.next();
                },
            },
        ],
    });

    tour.addStep({
        title: 'Scelta vincitore',
        text: 'Usa questo pulsante per scegliere il vincitore',
        attachTo: { element: '#btn-winning-card', on: 'bottom' },
        buttons: [
            {
                text: 'Prossimo',
                action: () => {
                    /* showLoadingMask();
                    navigateTo('waiting-room'); */
                    paintTutorialScreen();
                    tour.next();
                },
            },
        ],
    });

    /* tour.addStep({
        when: {
            show: () => {
                setTimeout(() => {
                    navigateTo('playing-room');
                    tour.next();
                }, 2000);
            }
        },
    }); */

    tour.addStep({
        title: 'Playing room',
        text: 'Ora vedrai ciò che ti aspetta nel ruolo di giocatore normale',
        attachTo: { element: '#inesistente', on: 'bottom' },
        when: {
            show: () => {
                hideLoadingMask();
            },
        },
        buttons: [
            {
                text: 'Prossimo',
                action: () => {
                    tour.next();
                },
            },
        ],
    });

    tour.addStep({
        title: 'Carta da completare',
        text: 'Questa è la carta da completare, la tua frase sarà inserita al posto del _',
        attachTo: { element: '#black-card', on: 'bottom' },
        buttons: [
            {
                text: 'Prossimo',
                action: () => {
                    tour.next();
                },
            },
        ],
    });

    tour.addStep({
        title: 'Carte in mano',
        text: 'Questo è l\'elenco delle carte che hai in mano, quando trovi quella giusta selezionala clickandoci sopra, noterai che si alzerà rispetto alle altre',
        attachTo: { element: '#scrollable-cards', on: 'bottom' },
        buttons: [
            {
                text: 'Prossimo',
                action: () => {
                    tour.next();
                },
            },
        ],
    });

    tour.addStep({
        title: 'Conferma carta',
        text: 'Una volta scelta la carta che vuoi giocare usa questo pulsante per confermarla',
        attachTo: { element: '#btn-confirm-card', on: 'bottom' },
        buttons: [
            {
                text: 'Prossimo',
                action: () => {
                    tour.next();
                },
            },
        ],
    });

    tour.addStep({
        title: 'Fine tutorial',
        text: 'Ora sai tutto ciò che ti serve per giocare! Ricorda che è ancora una beta, potrebbero esserci bug, evita il più possibile di ricaricare la pagina. Buon divertimento!',
        attachTo: { element: '#inesistente', on: 'bottom' },
        buttons: [
            {
                text: 'Fine',
                action: () => {
                    sessionStorage.clear();
                    sessionStorage.setItem('tutorialReloadRequired', true);
                    navigateTo('');
                    tour.complete();
                },
            },
        ],
    });

    tour.start();
}

export { startTutorial };