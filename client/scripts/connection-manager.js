let webSocket = null;
const listeners = [];

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
			resolve(webSocket);
		};

		webSocket.onerror = (error) => {
			console.error('WebSocket error:', error);
			reject(error);
		};

		webSocket.onmessage = (event) => {
			const message = JSON.parse(event.data);
			notifyListeners(message);
		};

		webSocket.onclose = () => {
			console.log('WebSocket connection closed');
			webSocket = null;
		};
	});
}

function send(message) {
	if (webSocket && webSocket.readyState === WebSocket.OPEN) {
		webSocket.send(JSON.stringify(message));
	} else {
		console.warn("WebSocket is not open. Message not sent:", message);
	}
}

function addMessageListener(listener) {
	listeners.push(listener);
}

function notifyListeners(message) {
	listeners.forEach(listener => listener(message));
}

export { connect, send, addMessageListener };
