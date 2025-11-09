const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const chatController = require('../controllers/chat.controller')

const router = express.Router();

// POST /api/chat  [Protected]
router.post('/',  authMiddleware.authUser,chatController.createChat)

// GET /api/chat  [Protected]
router.get('/',  authMiddleware.authUser,chatController.getChats)

// GET /api/chat/:id 
router.get('/messages/:id', authMiddleware.authUser, chatController.getMessages)

module.exports = router;