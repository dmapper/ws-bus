const WebSocket = require('ws')
const debug = require('debug')('ws-bus')

const defaultOptions = {
  debug: false,
  automaticOpen: true,
  reconnectOnError: true,
  reconnectInterval: 1000,
  maxReconnectInterval: 30000,
  reconnectDecay: 1.5,
  timeoutInterval: 2000,
  maxReconnectAttempts: null,
  randomRatio: 3,
  reconnectOnCleanClose: false
}

class ReconnectableWebSocket {
  constructor (url, protocols = [], options = {}) {
    this.CONNECTING = 0
    this.OPEN = 1
    this.CLOSING = 2
    this.CLOSED = 3

    this._url = url
    this._protocols = protocols
    this._options = Object.assign({}, defaultOptions, options)
    this._messageQueue = []
    this._reconnectAttempts = 0
    this.readyState = this.CONNECTING

    if (typeof this._options.debug === 'function') {
      this._debug = this._options.debug
    } else if (this._options.debug) {
      this._debug = console.log.bind(console)
    } else {
      this._debug = function () {}
    }

    if (this._options.automaticOpen) this.open()
  }

  open () {
    debug('open')
    let socket = this._socket = new WebSocket(this._url, this._protocols)

    if (this._options.binaryType) {
      socket.binaryType = this._options.binaryType
    }

    if (this._options.maxReconnectAttempts && this._options.maxReconnectAttempts < this._reconnectAttempts) {
      return
    }

    this._syncState()

    socket.onmessage = this._onmessage.bind(this)
    socket.onopen = this._onopen.bind(this)
    socket.onclose = this._onclose.bind(this)
    socket.onerror = this._onerror.bind(this)
  };

  send (data) {
    debug('send')
    if (this._socket && this._socket.readyState === WebSocket.OPEN && this._messageQueue.length === 0) {
      this._socket.send(data)
    } else {
      this._messageQueue.push(data)
    }
  };

  close (code, reason) {
    debug('close')
    if (typeof code === 'undefined') code = 1000

    if (this._socket) this._socket.close(code, reason)
  };

  _onmessage (message) {
    debug('onmessage')
    this.onmessage && this.onmessage(message)
  };

  _onopen (event) {
    debug('onopen')
    this._syncState()
    this._flushQueue()
    if (this._reconnectAttempts !== 0) {
      this.onreconnect && this.onreconnect()
    }
    this._reconnectAttempts = 0

    this.onopen && this.onopen(event)
  };

  _onclose (event) {
    debug('onclose')
    this._syncState()
    this._debug('WebSocket: connection is broken', event)

    this.onclose && this.onclose(event)

    this._tryReconnect(event)
  };

  _onerror (event) {
    debug('onerror', event)
    // To avoid undetermined state, we close socket on error
    this._socket.close()
    this._syncState()

    this._debug('WebSocket: error', event)

    this.onerror && this.onerror(event)

    if (this._options.reconnectOnError) this._tryReconnect(event)
  };

  _tryReconnect (event) {
    if (event.wasClean && !this._options.reconnectOnCleanClose) {
      return
    }
    setTimeout(() => {
      if (this.readyState === this.CLOSING || this.readyState === this.CLOSED) {
        this._reconnectAttempts++
        this.open()
      }
    }, this._getTimeout())
  };

  _flushQueue () {
    while (this._messageQueue.length !== 0) {
      let data = this._messageQueue.shift()
      this._socket.send(data)
    }
  };

  _getTimeout () {
    let timeout = this._options.reconnectInterval * Math.pow(this._options.reconnectDecay, this._reconnectAttempts)
    timeout = timeout > this._options.maxReconnectInterval ? this._options.maxReconnectInterval : timeout
    return this._options.randomRatio ? getRandom(timeout / this._options.randomRatio, timeout) : timeout
  };

  _syncState () {
    this.readyState = this._socket.readyState
  };
}

function getRandom (min, max) {
  return Math.random() * (max - min) + min
}

module.exports = ReconnectableWebSocket
