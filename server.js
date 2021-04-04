const uWS = require('uWebSockets.js');
const config = require('./config');

let connID = 0;
let messageID = 0;

let connTracker = new Map();
let subscribers = new Map();

async function publish(message) {
	if (!subscribers.has(message.channel)) return;
	let msg = JSON.stringify(message);

	for (let subscriber of subscribers.get(message.channel)) {
		connTracker.get(subscriber).send(msg);
	}
}

const subscriber = uWS.App({}).ws('/*', {
	open: ws => {
		connID++;
		ws.id = connID;
		ws.sub = new Set();
		connTracker.set(ws.id, ws);
	},
	message: (ws, message, isBinary) => {
		if (isBinary) {
			ws.close();
			return;
		}

		let request;

		try {
			request = JSON.parse(Buffer.from(message).toString());
		} catch(e) {
			ws.send(JSON.stringify({
				status: 'error',
				code: 'syntax-error',
				message: 'Invalid JSON'
			}));
			return;
		}

		if (request.command === 'set-filter') {
			for (let filter of request.filter) {
				if (typeof filter !== 'string') {
					ws.send(JSON.stringify({
						status: 'error',
						code: 'syntax-error',
						message: 'Invalid Filter'
					}));
					break;
				}

				if (!subscribers.has(filter)) {
					subscribers.set(filter, new Set());
				}

				subscribers.get(filter).add(ws.id);
				ws.sub.add(filter);
			}
		}
	},
	close: ws => {
		for (let filter of ws.sub) {
			subscribers.get(filter).delete(ws.id);
			if (subscribers.get(filter).size === 0) {
				subscribers.delete(filter);
			}
		}
		connTracker.delete(ws.id);
	}
}).listen(config.subscriber.host, config.subscriber.port, () => {
	console.log(`Started subscriber listener on ${config.subscriber.host}:${config.subscriber.port}`);
});

const emitter = uWS.App().ws('/*', {
	message: (ws, message, isBinary) => {
		if (isBinary) {
			ws.close();
			return;
		}

		let request;

		try {
			request = JSON.parse(Buffer.from(message).toString());
		} catch(e) {
			ws.send(JSON.stringify({
				status: 'error',
				code: 'syntax-error',
				message: 'Invalid JSON'
			}));
			return;
		}

		if (request.command === 'last-msg') {
			ws.send(JSON.stringify({
				status: 'success',
				id: messageID
			}));
		} else if (request.command === 'post') {
			let msg = {
				id: ++messageID,
				channel: request.channel,
				message: request.message
			};

			publish(msg);

			ws.send(JSON.stringify({
				status: 'success',
				id: msg.id
			}))
		}
	}
}).listen(config.publisher.host, config.publisher.port, () => {
	console.log(`Started publisher listener on ${config.publisher.host}:${config.publisher.port}`);
});