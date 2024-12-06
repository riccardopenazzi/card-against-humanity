import { clearMessageListeners } from "./connection-manager.js";
import { paintHomePage } from "./paint-home-page.js";
import { paintSettingsPage } from "./paint-settings.js";
import { paintWaitingRoom } from "./paint-waiting-room.js";
import { paintPlayingRoom } from "./paint-playing-room.js";
import { paintScore } from "./paint-score.js";
import { paintFinalRanking } from "./paint-final-ranking.js";

const routes = {
    '': { paint: paintHomePage, script: './home-page-script.js', name: 'index' },
    'settings': { paint: paintSettingsPage, script: './settings-script.js', name: 'settings' },
    'waiting-room': { paint: paintWaitingRoom, script: './waiting-room-script.js', name: 'waiting-room' },
    'playing-room': { paint: paintPlayingRoom, script: './playing-room-script.js', name: 'playing-room' },
    'score': { paint: paintScore, script: './score-script.js', name: 'score' },
    'final-ranking': { paint: paintFinalRanking, script: './final-ranking-script.js', name: 'final-ranking' },
};

function onPageVisit(pageName) {
    if ((pageName === 'index' || pageName === 'settings') && sessionStorage.getItem('reloadRequired')) {
        sessionStorage.removeItem('reloadRequired');
        sessionStorage.removeItem('master');
        sessionStorage.removeItem('hostId');
        location.reload();
    }
}

async function handleRouteChange() {
    clearMessageListeners();
    const path = window.location.hash.slice(1) || '';
    const route = routes[path];

    if (route) {
        onPageVisit(route.name);
        try {
            await route.paint();
            const module = await import(route.script);
            if (typeof module.startScript === 'function') {
                console.log('Chiamo start');
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

function navigateTo(routeName) {
    const path = `#${routeName}`;
    window.location.hash = path;
}

window.addEventListener('hashchange', handleRouteChange);
window.addEventListener('load', handleRouteChange);

export { navigateTo };
