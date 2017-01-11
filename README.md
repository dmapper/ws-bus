# ws-bus

Node PubSub Server based on WebSockets

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)


## Installation

```
npm install ws-bus
```

## Usage

Server
```js
const bus = require('ws-bus')

bus.createServer({port: 3000})
```

Client

```js
const bus = require('ws-bus')
const client = bus.createClient('ws://localhost:3000')

client.subscribe('channel1', (message) => {
  console.log('message:', message)
})

const message = {
  hello: 'world'
}

client.publish('channel1', message);

// client.unsubscribe('channel1')

```

## License

MIT