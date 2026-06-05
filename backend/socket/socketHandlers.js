import Room from '../models/Room.js';
import User from '../models/User.js';
import { verifyToken } from '../utils/jwt.js';

// Track active connections globally to prevent duplicates
const activeConnections = new Map(); // userId+roomId -> socketId
const pendingCanvasData = new Map(); // roomId -> line segments waiting to be saved
const FLUSH_INTERVAL_MS = 1000;

const queueCanvasSegment = (roomId, segment) => {
  const roomKey = roomId.toString();
  const pendingSegments = pendingCanvasData.get(roomKey) || [];
  pendingSegments.push(segment);
  pendingCanvasData.set(roomKey, pendingSegments);
};

const flushCanvasData = async (roomId = null) => {
  const entries = roomId
    ? [[roomId.toString(), pendingCanvasData.get(roomId.toString()) || []]]
    : Array.from(pendingCanvasData.entries());

  for (const [roomKey, segments] of entries) {
    if (!segments.length) continue;

    pendingCanvasData.delete(roomKey);

    try {
      await Room.updateOne(
        { _id: roomKey },
        { $push: { canvasData: { $each: segments } } }
      );
    } catch (error) {
      const existingSegments = pendingCanvasData.get(roomKey) || [];
      pendingCanvasData.set(roomKey, [...segments, ...existingSegments]);
      console.error('❌ Canvas flush error:', error);
    }
  }
};

setInterval(() => {
  flushCanvasData();
}, FLUSH_INTERVAL_MS);

export const handleSocketConnection = (io) => {
  io.on('connection', (socket) => {
    console.log('🔵 User connected:', socket.id);

    socket.on('join-room', async ({ roomId, token }) => {
      try {
        console.log('📥 Join room request:', { socketId: socket.id, roomId });

        // Verify token
        const decoded = verifyToken(token);
        if (!decoded) {
          console.log('❌ Invalid token');
          socket.emit('error', { message: 'Invalid token' });
          return;
        }

        // Check if user exists
        const user = await User.findById(decoded.id);
        if (!user) {
          console.log('❌ User not found:', decoded.id);
          socket.emit('error', { message: 'User not found' });
          return;
        }

        // Check if room exists
        const room = await Room.findById(roomId);
        if (!room) {
          console.log('❌ Room not found:', roomId);
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Create unique connection key
        const connectionKey = `${decoded.id}_${roomId}`;
        
        // Check if user already has an active connection to this room
        const existingSocketId = activeConnections.get(connectionKey);
        if (existingSocketId && existingSocketId !== socket.id) {
          console.log(`⚠️ User ${user.name} already connected to room ${roomId} via socket ${existingSocketId}`);
          // Disconnect the old socket
          const oldSocket = io.sockets.sockets.get(existingSocketId);
          if (oldSocket) {
            oldSocket.disconnect(true);
          }
          activeConnections.delete(connectionKey);
        }

        // If this socket is already in another room, leave it first
        if (socket.roomId && socket.roomId !== roomId) {
          console.log(`🔄 Socket ${socket.id} leaving previous room ${socket.roomId}`);
          await handleLeaveRoom(socket, io);
        }

        // Join the room
        socket.join(roomId);
        socket.roomId = roomId;
        socket.userId = decoded.id;
        socket.userName = user.name;

        // Track this connection
        activeConnections.set(connectionKey, socket.id);

        // Update room's active users - IMPORTANT: Remove first, then add
        const userIdString = decoded.id.toString();
        room.activeUsers = room.activeUsers.filter(
          id => id.toString() !== userIdString
        );
        room.activeUsers.push(decoded.id);
        await room.save();

        console.log(`✅ ${user.name} joined room ${roomId} | Active users in DB: ${room.activeUsers.length}`);

        await flushCanvasData(roomId);

        // Get and broadcast updated user list
        const updatedRoom = await Room.findById(roomId).populate('activeUsers', 'name email');
        const activeUsersList = updatedRoom.activeUsers || [];

        // Send canvas state to the joining user only
        socket.emit('canvas-state', updatedRoom.canvasData);
        
        console.log(`📤 Broadcasting ${activeUsersList.length} users to room ${roomId}`);
        io.to(roomId).emit('room-users', activeUsersList);

        // Update room count on home page
        io.emit('room-users-updated', {
          roomId,
          userCount: activeUsersList.length
        });

        // Notify others (not the joining user)
        socket.to(roomId).emit('user-joined', {
          userId: decoded.id,
          userName: user.name
        });

      } catch (error) {
        console.error('❌ Join room error:', error);
        socket.emit('error', { message: 'Error joining room' });
      }
    });

    // NEW: Cursor movement tracking
    socket.on('cursor-move', ({ roomId, x, y }) => {
      socket.to(roomId).emit('cursor-position', {
        userId: socket.userId,
        userName: socket.userName,
        x,
        y
      });
    });

    // NEW: Cursor hide event
    socket.on('cursor-hide', ({ roomId }) => {
      socket.to(roomId).emit('cursor-hidden', {
        userId: socket.userId
      });
    });

    socket.on('draw', (data) => {
      try {
        const { roomId, from, to, color, tool, size } = data;

        queueCanvasSegment(roomId, { from, to, color, tool, size });
        socket.to(roomId).emit('drawing', { from, to, color, tool, size });
      } catch (error) {
        console.error('❌ Draw error:', error);
      }
    });

    socket.on('clear-canvas', async ({ roomId }) => {
      try {
        pendingCanvasData.delete(roomId.toString());
        const room = await Room.findById(roomId);
        if (room) {
          room.canvasData = [];
          await room.save();
        }
        io.to(roomId).emit('canvas-cleared');
      } catch (error) {
        console.error('❌ Clear canvas error:', error);
      }
    });

    socket.on('leave-room', async ({ roomId }) => {
      console.log(`📤 Explicit leave-room from socket ${socket.id}`);
      await handleLeaveRoom(socket, io, roomId);
    });

    socket.on('disconnect', async () => {
      console.log('🔴 User disconnecting:', socket.id);
      await handleLeaveRoom(socket, io);
    });
  });
};

// Helper function to handle leaving rooms
async function handleLeaveRoom(socket, io, specificRoomId = null) {
  try {
    const roomId = specificRoomId || socket.roomId;
    const userId = socket.userId;
    const userName = socket.userName;

    if (!roomId || !userId) {
      console.log('⚠️ No room or user to leave');
      return;
    }

    console.log(`🚪 ${userName} leaving room ${roomId}`);

    const room = await Room.findById(roomId);
    if (!room) {
      console.log('⚠️ Room not found during leave');
      return;
    }

    // Remove user from activeUsers
    const beforeCount = room.activeUsers.length;
    room.activeUsers = room.activeUsers.filter(
      id => id.toString() !== userId.toString()
    );
    const afterCount = room.activeUsers.length;
    
    if (beforeCount !== afterCount) {
      await room.save();
      console.log(`✅ Removed ${userName} from room ${roomId} | Remaining: ${afterCount}`);
    } else {
      console.log(`ℹ️ ${userName} was not in activeUsers`);
    }

    // Remove from global tracking
    const connectionKey = `${userId}_${roomId}`;
    activeConnections.delete(connectionKey);

    // Leave socket room
    socket.leave(roomId);

    // Get updated user list
    const updatedRoom = await Room.findById(roomId).populate('activeUsers', 'name email');
    const activeUsersList = updatedRoom.activeUsers || [];

    // Broadcast updates
    io.to(roomId).emit('room-users', activeUsersList);
    io.emit('room-users-updated', {
      roomId,
      userCount: activeUsersList.length
    });

    // Notify others that cursor should be removed
    socket.to(roomId).emit('cursor-hidden', {
      userId
    });

    // Notify others
    socket.to(roomId).emit('user-left', {
      userId,
      userName
    });

    // Clear socket data
    socket.roomId = null;
    socket.userId = null;
    socket.userName = null;

  } catch (error) {
    console.error('❌ Leave room error:', error);
  }
}
