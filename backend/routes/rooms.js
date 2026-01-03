import express from 'express';
import { getAllRooms, createRoom, joinRoom, deleteRoom } from '../controllers/roomController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getAllRooms);
router.post('/create', protect, createRoom);
router.post('/join', protect, joinRoom);
router.delete('/:roomId', protect, deleteRoom);

export default router;