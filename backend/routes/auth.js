import express from 'express';
import { signup, sendOTP, verifyOTP } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

export default router;