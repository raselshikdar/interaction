import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Store connected users: Map<userId, socketId>
const connectedUsers = new Map<string, string>()
// Store socket to user mapping: Map<socketId, userId>
const socketToUser = new Map<string, string>()

console.log('🚀 Real-time service starting...')

io.on('connection', (socket) => {
  console.log(`📡 Client connected: ${socket.id}`)

  // User authenticates with their userId
  socket.on('authenticate', (data: { userId: string }) => {
    const { userId } = data
    if (!userId) {
      socket.emit('error', { message: 'UserId required' })
      return
    }

    // Store user connection
    connectedUsers.set(userId, socket.id)
    socketToUser.set(socket.id, userId)
    
    console.log(`✅ User ${userId} authenticated on socket ${socket.id}`)
    console.log(`📊 Total connected users: ${connectedUsers.size}`)
    
    // Send confirmation
    socket.emit('authenticated', { 
      userId, 
      message: 'Successfully connected to real-time service' 
    })
  })

  // Send a message to another user
  socket.on('send_message', (data: {
    messageId: string
    senderId: string
    receiverId: string
    content: string
    imageUrl?: string
    createdAt: string
  }) => {
    const { messageId, senderId, receiverId, content, imageUrl, createdAt } = data
    
    // Get the receiver's socket
    const receiverSocketId = connectedUsers.get(receiverId)
    
    if (receiverSocketId) {
      // Send message to receiver
      io.to(receiverSocketId).emit('new_message', {
        id: messageId,
        senderId,
        receiverId,
        content,
        imageUrl,
        createdAt,
        read: false
      })
      
      console.log(`📨 Message ${messageId} delivered from ${senderId} to ${receiverId}`)
    } else {
      console.log(`📭 User ${receiverId} is offline, message will be fetched later`)
    }
  })

  // Mark messages as read
  socket.on('mark_messages_read', (data: {
    userId: string
    partnerId: string
  }) => {
    const { userId, partnerId } = data
    
    // Notify the partner that messages were read
    const partnerSocketId = connectedUsers.get(partnerId)
    
    if (partnerSocketId) {
      io.to(partnerSocketId).emit('messages_read', {
        byUserId: userId,
        readAt: new Date().toISOString()
      })
      console.log(`✉️ Messages from ${partnerId} marked as read by ${userId}`)
    }
  })

  // Send notification to a user
  socket.on('send_notification', (data: {
    notificationId: string
    userId: string
    type: string
    actorId: string
    postId?: string
    createdAt: string
  }) => {
    const { notificationId, userId, type, actorId, postId, createdAt } = data
    
    // Get the user's socket
    const userSocketId = connectedUsers.get(userId)
    
    if (userSocketId) {
      io.to(userSocketId).emit('new_notification', {
        id: notificationId,
        type,
        actorId,
        postId,
        createdAt,
        read: false
      })
      console.log(`🔔 Notification ${notificationId} sent to ${userId}`)
    }
  })

  // Typing indicator
  socket.on('typing_start', (data: { senderId: string; receiverId: string }) => {
    const { senderId, receiverId } = data
    const receiverSocketId = connectedUsers.get(receiverId)
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', { userId: senderId, isTyping: true })
    }
  })

  socket.on('typing_stop', (data: { senderId: string; receiverId: string }) => {
    const { senderId, receiverId } = data
    const receiverSocketId = connectedUsers.get(receiverId)
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', { userId: senderId, isTyping: false })
    }
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    const userId = socketToUser.get(socket.id)
    
    if (userId) {
      connectedUsers.delete(userId)
      socketToUser.delete(socket.id)
      console.log(`👋 User ${userId} disconnected`)
      console.log(`📊 Total connected users: ${connectedUsers.size}`)
    } else {
      console.log(`❌ Unknown client disconnected: ${socket.id}`)
    }
  })

  socket.on('error', (error) => {
    console.error(`Socket error (${socket.id}):`, error)
  })
})

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`🌐 Real-time WebSocket server running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal, shutting down server...')
  httpServer.close(() => {
    console.log('Real-time server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('Received SIGINT signal, shutting down server...')
  httpServer.close(() => {
    console.log('Real-time server closed')
    process.exit(0)
  })
})
