import { clearMessageListeners } from "./connection-manager.js";
import { paintHomePage } from "./paint-home-page.js";
import { paintSettingsPage } from "./paint-settings.js";
import { paintWaitingRoom } from "./paint-waiting-room.js";
import { paintPlayingRoom } from "./paint-playing-room.js";
import { paintScore } from "./paint-score.js";
import { paintFinalRanking } from "./paint-final-ranking.js";

const routes = {
    '/': {paint: paintHomePage, script: './home-page-script.js'},
    '/settings': {paint: paintSettingsPage, script: './settings-script.js'},
    '/waiting-room': {paint: paintWaitingRoom, script: './waiting-room-script.js'},
    '/playing-room': {paint: paintPlayingRoom, script: './playing-room-script.js'},
    '/score': {paint: paintScore, script: './score-script.js'},
    '/final-ranking': {paint: paintFinalRanking, script: './final-ranking-script.js'},
}

async function handleRouteChange() {
    clearMessageListeners();
    const path = window.location.hash.slice(1) || '/';
    const route = routes[path];
    if (route) {
        try {
            await route.paint();
            const module = await import(route.script);
            if (typeof module.startScript === 'function') {
                console.log('Chiamo start')
                module.startScript();
            } else {
                console.log('Chiamo connect');
                module.executeConnect();
            }
        } catch (error) {
            console.error("Error during script loading", error);
        }
    }
}

window.addEventListener('hashchange', handleRouteChange);
window.addEventListener('load', handleRouteChange);

function navigateTo(route) {
    window.location.hash = route;
}

export { navigateTo };