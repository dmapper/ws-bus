const debug = require('debug')('ws-bus')
const Socket = require('./socket')
const EventEmitter = require('events').EventEmitter
const util = require('./util')

class Client {
  constructor (url, protocols, options = {}) {
    this.url = url || 'ws://localhost:3000'
    this.socket = new Socket(this.url, protocols, options)
    this.subscriptions = {}

    this.emitter = new EventEmitter()

    this.socket.onmessage = this._onMessage.bind(this)
    this.socket.onreconnect = this._onReconnect.bind(this)
  }

  publish (channel, message) {
    const data = {
      type: 'message',
      channel: channel,
      data: message
    }

    this._send(data)
  }

  subscribe (channel, cb) {
    const data = {
      type: 'subscribe',
      subscriptions: [channel]
    }
    this._send(data)
    this._subscribe(channel, cb)
  }

  unsubscribe (channel, cb) {
    const data = {
      type: 'subscribe',
      subscriptions: [channel]
    }
    this._send(data)
    this._unsubscribe(channel)

    cb && cb()
  }

  unsubscribeAll () {
    for (let channel in this.subscriptions) {
      const counter = this.subscriptions[channel]

      for (let i = 0; i < counter; i++) this.unsubscribe(channel)
    }
  }

  close (code, reason) {
    this.socket.close(code, reason)
  }

  _send (message) {
    const data = JSON.stringify(message)
    this.socket.send(data)
  }

  _subscribe (channel, cb) {
    this.subscriptions[channel] = this.subscriptions[channel] || 0
    this.subscriptions[channel] += 1
    this.emitter.on(channel, cb)
  }

  _unsubscribe (channel) {
    this.subscriptions[channel] = this.subscriptions[channel] || 0
    this.subscriptions[channel] -= 1

    if (this.subscriptions[channel] > 0) return

    this.emitter.removeAllListeners(channel)
  }

  _onMessage (data) {
    const message = util.parseMessage(data.data)
    debug('message %O', message)
    this.emitter.emit(message.channel, message.data)
  }

  _onReconnect () {
    debug('reconnect')
    const subs = []

    for (let channel in this.subscriptions) {
      if (this.subscriptions[channel] <= 0) continue
      subs.push(channel)
    }

    const data = {
      type: 'subscribe',
      subscriptions: subs
    }

    this._send(data)
  }
}

module.exports = Client
