const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const aiService = require("../services/ai.service");
const messageModel = require("../models/message.model");
const { createMemory, queryMemory } = require("../services/vector.service");

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },
  });

  // 🧩 Middleware: connection establish hone se pehle user ko verify karna
  io.use(async (socket, next) => {
    // Handshake se cookies nikal rahe hain (browser se bheji gayi)
    const cookies = cookie.parse(socket.handshake.headers?.cookie || "");

    // Check karte hain ke token hai ya nahi
    if (!cookies.token) {
      next(new Error("Authentication error: No token provided"));
    }

    // Ab token verify karte hain (JWT ke zariye)
    try {
      const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);

      // Token se user ka ID mil gaya, ab DB se user nikal lo
      const user = await userModel.findById(decoded.id);

      // Socket ke andar user attach kar rahe hain (taake har event me use ho sake)
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // 👇 Jab connection successfully establish ho jaye
  io.on("connection", (socket) => {
    
    // Jab user AI ko koi message bheje
    socket.on("ai-message", async (messagePayload) => {
      /*
        messagePayload ke andar 2 cheezein hoti hain:
        1. chat -> jahan ye message belong karta hai
        2. content -> user ka actual message (prompt)
      */

      // Pinecone ek vector database hai — lekin abhi user ka message plain text me aata hai
      // Isliye hum usko vector (numbers form) me convert karte hain
      // generateVector() function se — jo ai.service.js me likha hua hai

      const [message, vectors] = await Promise.all([
        // Pehle message ko database (MongoDB) me store karte hain
        messageModel.create({
          chat: messagePayload.chat,
          user: socket.user._id,
          content: messagePayload.content,
          role: "user",
        }),

        // Dusra: same message ko vector me convert karte hain
        aiService.generateVector(messagePayload.content),
      ]);

      // Ab Pinecone me save karte hain (vector + metadata)
      await createMemory({
        vectors,
        messageId: message._id,
        metadata: {
          chat: messagePayload.chat,
          user: socket.user._id,
          text: messagePayload.content,
        },
      });

      // Ab hum purani (similar) memories Pinecone se nikalte hain
      // taake AI ko context mil sake

      const [memory, chatHistory] = await Promise.all([
        queryMemory({
          queryVector: vectors,
          limit: 3, // sirf 3 similar memories la rahe hain
          metadata: {
            user: socket.user._id.toString(),
          },
        }),

        // Abhi ke chat ki last 20 messages MongoDB se nikalte hain
        messageModel
          .find({
            chat: messagePayload.chat,
          })
          .sort({ createdAt: -1 }) // latest pehle aata hai
          .limit(20)
          .lean()
          .then((res) => res.reverse()), // hum unhe reverse kar rahe hain taake purani pehle aayein
      ]);

      // 💭 Short-term memory (recent chat messages)
      const shortTermMemory = chatHistory.map((item) => {
        return {
          role: item.role,
          parts: [{ text: item.content }],
        };
      });

      // 🧠 Long-term memory (Pinecone se context)
      const longTermMemory = [
        {
          role: "user",
          parts: [
            {
              text: `These are previous messages from the chat, use them to generate a response ${memory
                .map((item) => item.metadata.text)
                .join("\n")}`,
            },
          ],
        },
      ];

      // Ab dono memories (short-term + long-term) ko combine karke
      // AI ko bhejte hain taake woh context-based response generate kare
      const response = await aiService.generateResponse([
        ...longTermMemory,
        ...shortTermMemory,
      ]);

      // Ab AI ka response wapas frontend ko bhej dete hain (real-time)
      socket.emit("ai-response", {
        content: response,
        chat: messagePayload.chat,
      });

      // AI ke response ko bhi database me save karte hain (jese user ke message ko kiya tha)
      const [responseMessage, responseVectors] = await Promise.all([
        messageModel.create({
          chat: messagePayload.chat,
          user: socket.user._id,
          content: response,
          role: "model", // yaha "model" ka matlab AI ka message
        }),
        aiService.generateVector(response), // aur AI ke message ko bhi vector me convert karte hain
      ]);

      // Ab AI ke response ka vector bhi Pinecone me save karte hain
      await createMemory({
        vectors: responseVectors,
        messageId: responseMessage._id,
        metadata: {
          chat: messagePayload.chat,
          user: socket.user._id,
          text: response,
        },
      });
    });
  });
}

module.exports = initSocketServer;
