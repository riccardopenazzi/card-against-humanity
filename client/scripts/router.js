import { clearMessageListeners } from "./connection-manager.js";
import { paintHomePage } from "./paint-home-page.js";
import { paintSettingsPage } from "./paint-settings.js";
import { paintWaitingRoom } from "./paint-waiting-room.js";
import { paintPlayingRoom } from "./paint-playing-room.js";

const routes = {
    '/': {paint: paintHomePage, script: './home-page-script.js'},
    '/settings': {paint: paintSettingsPage, script: './settings-script.js'},
    '/waiting-room': {paint: paintWaitingRoom, script: './waiting-room-script.js'},
    '/playing-room': {paint: paintPlayingRoom, script: './playing-room-script.js'},
}

function handleRouteChange() {
    clearMessageListeners();
    const path = window.location.hash.slice(1) || '/';
    const route = routes[path];
    if (route) {
        route.paint();
        import(route.script);
    }
}

window.addEventListener('hashchange', handleRouteChange);
window.addEventListener('load', handleRouteChange);

function navigateTo(route) {
    window.location.hash = route;
}

export { navigateTo };