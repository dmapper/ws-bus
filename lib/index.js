const Client = require('./client')
const Server = require('./server')

module.exports = {
  createClient: (url, protocols, options) => new Client(url, protocols, options),
  createServer: (options) => new Server(options)
}
