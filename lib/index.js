const Client = require('./client')
const Server = require('./server')

module.exports = {
  createClient: (options) => new Client(options),
  createServer: (options) => new Server(options)
}
