import { paintHomePage } from "./paint-home-page.js";
const routes = {
    '/': {paint: paintHomePage, script: './home-page-script.js'},
}

function handleRouteChange() {
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