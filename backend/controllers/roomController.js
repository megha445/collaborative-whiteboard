import Room from '../models/Room.js';
import bcrypt from 'bcryptjs';

export const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('createdBy', 'name email')
      .select('-canvasData')
      .sort({ createdAt: -1 });

    const roomsWithUserCount = rooms.map(room => ({
      ...room.toObject(),
      activeUserCount: room.activeUsers.length
    }));

    res.json(roomsWithUserCount);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createRoom = async (req, res) => {
  try {
    const { name, type, password } = req.body;

    let hashedPassword = null;
    if (type === 'private' && password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const room = await Room.create({
      name,
      type,
      password: hashedPassword,
      createdBy: req.user._id
    });

    const populatedRoom = await Room.findById(room._id).populate('createdBy', 'name email');

    // Emit to all clients about new room
    req.io.emit('room-created', populatedRoom);

    res.status(201).json(populatedRoom);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const joinRoom = async (req, res) => {
  try {
    const { roomId, password } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.type === 'private') {
      if (!password) {
        return res.status(400).json({ message: 'Password required' });
      }
      const isMatch = await bcrypt.compare(password, room.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect password' });
      }
    }

    res.json({ message: 'Access granted', roomId: room._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is the creator
    if (room.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only room creator can delete this room' });
    }

    await Room.findByIdAndDelete(roomId);

    // Notify all clients that room was deleted
    req.io.emit('room-deleted', roomId);

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};