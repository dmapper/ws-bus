const debug = require('debug')('ws-bus')

exports.parseMessage = (data) => {
  let message = {}

  try {
    message = JSON.parse(data)
  } catch (e) {
    debug('error parsing message:', data)
  }
  return message
}
