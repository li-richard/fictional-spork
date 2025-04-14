import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 8080 });


const userMapping = new Map<WebSocket, string>()
const activeUsers = new Set<string>()
const messageHistory: string[] = []

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data) {
    // join
    if (!userMapping.has(ws)) {
      const username = data.toString()
      // validate inputted username
      if (!activeUsers.has(username)) {
        userMapping.set(ws, data.toString())
        activeUsers.add(userMapping.get(ws))
        console.log(`user joined chat with username: ${username}`)

        for (const message of messageHistory.reverse().slice(0, 10)) {
          ws.send(message)
        }

        wss.clients.forEach(function each(client) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            const message = `User ${username} has joined the chat`
            messageHistory.push(message)
            client.send(message)
          }
        })

      } else {
        ws.send('Username already in use, please try a different username')
        console.log(`user tried to join with existing username ${username}`)
      }
    } 
    // already joined, sending messages to group chat
    else {
      const message = data.toString()
      // enter commands
      if (message.startsWith('!')) {
        if (message.trim() === '!list') {
          for (const user of activeUsers) {
            ws.send(user)
          }
        }
      }
      wss.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          const message = `${userMapping.get(ws).trim()}: ${data.toString()}`
          messageHistory.push(message)
          client.send(message)
        }
      })
    }
  })

  ws.on('close', function disconnect() {
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        const message = `User ${userMapping.get(ws)} has left the chat`
        messageHistory.push(message)
        client.send(message)
      }
    })
    userMapping.delete(ws)
    activeUsers.delete(userMapping.get(ws))
  })

  ws.send('Enter your username:');
})