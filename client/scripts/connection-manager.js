import { navigateTo } from "./router.js";

let webSocket = null;
let listeners = [];
let isReconnecting = false;

const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const webSocketPort = window.location.port;

function connect() {
	return new Promise((resolve, reject) => {
		if (webSocket) {
			resolve(webSocket);
			return;
		}

		webSocket = new WebSocket(`${protocol}://${window.location.hostname}:${webSocketPort}`);

		webSocket.onopen = () => {
			console.log('WebSocket connection established');
			isReconnecting = false;
			resolve(webSocket);
		};

		webSocket.onerror = (error) => {
			console.error('WebSocket error:', error);
			reject(error);
		};

		webSocket.onmessage = (event) => {
			const message = JSON.parse(event.data);
			if (message.method === 'invalid-clientId') {
				navigateTo('/');
			} else if (message.method === 'check-connection') { 
				const payLoad = {
					'method': 'check-connection',
					'clientId': sessionStorage.getItem('clientId'),
				}
				send(payLoad);
			}
			else {
				notifyListeners(message);
			}
		};

		webSocket.onclose = () => {
			console.log('WebSocket connection closed');
			webSocket = null;
			handleReconnection();
		};
	});
}

function handleReconnection() {
	if (isReconnecting) return;

	isReconnecting = true;
	let retryInterval = 1000;

	return new Promise((resolve) => {
		const attemptReconnect = () => {
			console.log('Attempting to reconnect...');
			connect().then(() => {
				console.log('Reconnected successfully.');
				send({ method: 'connect-again', clientId: sessionStorage.getItem('clientId') });
				resolve();
			}).catch((error) => {
				console.error('Reconnection failed:', error);
				setTimeout(attemptReconnect, retryInterval);
			});
		};
		attemptReconnect();
	});
}

function send(message) {
	console.log('Sending: ', message);
	if (webSocket && webSocket.readyState === WebSocket.OPEN) {
		webSocket.send(JSON.stringify(message));
	} else {
		console.warn("WebSocket is not open. Message not sent:", message);
		handleReconnection().then(() => {
			webSocket.send(JSON.stringify(message));
		});
	}
}

function addMessageListener(listener) {
	listeners.push(listener);
}

function notifyListeners(message) {
	listeners.forEach(listener => listener(message));
}

function clearMessageListeners() {
	listeners = [];
}

export { connect, send, addMessageListener, clearMessageListeners };
