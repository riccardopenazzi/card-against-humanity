import { webSocket, clientId } from "./main-script.js";
document.getElementById('btn-create-game').addEventListener('click', event => {
    const payLoad = {
        "method": "create",
        "clientId": clientId,
    }
    webSocket.send(JSON.stringify(payLoad));
});