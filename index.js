const Client = require('./lib/client')
const Server = require('./lib/server')

module.exports = {
  createClient: (url, protocols, options) => new Client(url, protocols, options),
  createServer: (options) => new Server(options)
}
