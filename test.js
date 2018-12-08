'use strict'

const test = require('tap').test
const plugin = require('./plugin')
const Fastify = require('fastify')
const WebSocket = require('ws')
const hyperid = require('hyperid')
const instance = hyperid({ urlSafe: true })

test('client should register with a token and receive message', (t) => {
  t.plan(3)

  const fastify = Fastify()
  const token = instance.uuid

  fastify.register(plugin)
  fastify.ready(err => t.error(err))

  fastify.listen(0, err => {
    t.error(err)

    const client = new WebSocket(`ws://localhost:${fastify.server.address().port}?token=${token}`)

    client.onmessage = msg => {
      t.equal(msg.data, 'hello client')
      client.close()
      fastify.close()
    }

    client.on('open', () => {
      fastify.websockets.get(token).send('hello client')
    })
  })
})

test('client should not be able to register without a token', (t) => {
  t.plan(4)

  const fastify = Fastify()
  const token = instance.uuid

  fastify.register(plugin)
  fastify.ready(err => t.error(err))

  fastify.listen(0, err => {
    t.error(err)

    const client = new WebSocket(`ws://localhost:${fastify.server.address().port}`)
    client.onclose = () => {
      t.ok('socket closed')
      fastify.close()
    }

    client.on('open', () => {
      t.equal(fastify.websockets.get(token), undefined)
    })
  })
})
