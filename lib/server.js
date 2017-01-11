const WebSocketServer = require('ws').Server
const debug = require('debug')('ws-bus')
const util = require('./util')

class Server {
  constructor (options = {}) {
    this.port = options.port || process.env.PORT || 3000
    console.log('listening on port:', this.port)
    this.wss = new WebSocketServer({ port: this.port })
    this.listen()
  }

  listen () {
    this.wss.on('connection', (client) => {
      client.subscriptions = client.subscriptions || {}
      console.log('connected client')
      client.on('message', (data) => {
        const message = util.parseMessage(data)
        this.handleIncomingMessage(client, message)
      })
    })
  }

  handleIncomingMessage (client, message) {
    const isOk = this.validateMessage(message)

    if (!isOk) return

    switch (message.type) {
      case 'subscribe': return this.handleSubscribe(client, message)
      case 'unsubscribe': return this.handleUnsubscribe(client, message)
      case 'message': return this.handleMessage(client, message)
      default: debug('wrong message: %j', message)
    }
  }
  handleSubscribe (client, message) {
    client.subscriptions = client.subscriptions || {}
    let subs = message.subscriptions

    for (let subscription of subs) {
      client.subscriptions[subscription] = true
    }
  }

  handleUnsubscribe (client, message) {
    client.subscriptions = client.subscriptions || {}
    let subs = message.subscriptions

    for (let subscription of subs) {
      delete client.subscriptions[subscription]
    }
  }

  handleMessage (client, message) {
    this.sendMessage(client, message)
  }

  sendMessage (myClient, message) {
    const data = JSON.stringify(message)
    this.wss.clients.forEach(function each (client) {
      const isSubscribed = client.subscriptions[message.channel]
      if (client !== myClient && isSubscribed) client.send(data)
    })
  }

  validateMessage (message) {
    // TODO add validation
    // type, subscription, data
    // type [subscribe, unsubscribe, message]
    // subscription - array of
    return true
  }
}

module.exports = Server

