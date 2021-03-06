'use strict'

const fp = require('fastify-plugin')
const WebSocketServer = require('ws').Server
const url = require('url')

function fastifyWebSocketMap (fastify, options, next) {
  const opts = Object.assign(options, { server: fastify.server })
  const wss = new WebSocketServer(opts)
  const websockets = new Map()

  wss.on('connection', (ws, req) => {
    const path = req.url || ''

    const { query: { token } } = url.parse(path, true)

    if (token == null) {
      return ws.terminate()
    }
    websockets.set(token, ws)
    ws.on('close', () => websockets.delete(token))
  })

  fastify.decorate('websockets', websockets)

  fastify.addHook('onClose', (fastify, done) => wss.close(done))

  next()
}

module.exports = fp(fastifyWebSocketMap, {
  fastify: '>=1.13.0',
  name: 'fastify-ws-map'
})
