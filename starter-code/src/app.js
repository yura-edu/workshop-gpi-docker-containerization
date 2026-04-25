const http = require('http')

const PORT = process.env.PORT || 3000
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/app'
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

const routes = {
  'GET /health': () => ({
    status: 200,
    body: { ok: true, version: '1.0.0' },
  }),
  'GET /config': () => ({
    status: 200,
    body: {
      databaseUrl: DATABASE_URL.replace(/:[^:@]*@/, ':***@'),
      redisUrl: REDIS_URL,
      port: Number(PORT),
    },
  }),
}

const server = http.createServer((req, res) => {
  const key = `${req.method} ${req.url.split('?')[0]}`
  const handler = routes[key]

  if (!handler) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
    return
  }

  const { status, body } = handler()
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
})

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Database: ${DATABASE_URL.replace(/:[^:@]*@/, ':***@')}`)
  console.log(`Redis: ${REDIS_URL}`)
})

module.exports = server
