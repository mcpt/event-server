# Event Server

This is a partial implementation of the WebSockets [event server](https://github.com/DMOJ/online-judge/blob/master/websocket/daemon.js) created by DMOJ. Unlike the original, it does not support slow polling and only accepts WebSockets connections.

## Install

To install, clone the repository and run `npm i`.

```
git clone https://github.com/mcpt/event-server.git
cd event-server
npm i
```

## Configure

Follow the [DMOJ docs](https://docs.dmoj.ca/#/site/installation?id=configuration-of-event-server), but instead of using the one provided in the `websockets` directory, use this instead.

The configuration (`config.js`) should look something like:

```js
module.exports = {
	subscriber: {
		host: '127.0.0.1',
		port: 15100
	},
	publisher: {
		host: '127.0.0.1',
		port: 15101
	}
}
```

The subscriber should match the nginx settings, while the publisher should match `EVENT_DAEMON_POST` in `local_settings.py`
