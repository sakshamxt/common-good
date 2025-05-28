// routes/messageRoutes.js
import express from 'express';
import {
  startConversation,
  getConversationsForUser,    // NEW
  getMessagesForConversation, // NEW
  sendMessageInConversation,  // NEW
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All routes protected

// POST /api/v1/conversations - Start a new conversation
router.post('/', startConversation);

// GET /api/v1/conversations - Get all conversations for the logged-in user
router.get('/', getConversationsForUser);

// GET /api/v1/conversations/:conversationId/messages - Get messages for a specific conversation
router.get('/:conversationId/messages', getMessagesForConversation);

// POST /api/v1/conversations/:conversationId/messages - Send a message in an existing conversation
router.post('/:conversationId/messages', sendMessageInConversation);

export default router;