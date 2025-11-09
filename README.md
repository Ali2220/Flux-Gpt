# ⚡ Flux — AI Chat Assistant with Memory

Flux is a **real-time AI chat application** that remembers your conversations.  
It combines **short-term chat history (MongoDB)** with **long-term memory (Pinecone vector database)** and uses **Google Gemini** to generate context-aware AI responses in real time via **Socket.IO**.

---

## 🚀 Features

- 💬 Real-time chat using **Socket.IO**  
- 🔐 Authentication with **JWT + cookies**  
- 🧠 AI memory system:
  - Short-term: recent messages stored in MongoDB  
  - Long-term: embeddings stored and retrieved from Pinecone  
- 🤖 Powered by **Google Gemini** for responses and embeddings  
- 💾 Chats & messages saved in MongoDB  
- 🧩 Frontend built with **React + Vite + Redux Toolkit**  
- ⚙️ Backend with **Node.js + Express + Mongoose**  
- 🎨 Minimal chat UI with auto-scroll, AI typing indicator, and shortcuts  
  - `Enter` → send message  
  - `Shift + Enter` → new line  

---

## 🏗️ Tech Stack

### Backend
- Node.js + Express  
- MongoDB + Mongoose  
- Socket.IO  
- JWT + cookie-based auth  
- Pinecone (Vector DB for long-term memory)  
- Google GenAI SDK (Gemini models)  
- bcryptjs, dotenv, cors  

### Frontend
- React (Vite)  
- Redux Toolkit + React Redux  
- React Router DOM  
- Socket.IO Client  
- Axios  
- Tailwind CSS  

---

## 🧠 How It Works

1. **User sends a message** → emitted via Socket.IO to the backend.  
2. **Server saves** the message in MongoDB.  
3. **Embedding created** using Gemini (embedding model).  
4. **Pinecone** stores or updates the vector for long-term memory.  
5. **Similar messages** are fetched from Pinecone (context recall).  
6. **Prompt composed** using both short-term + long-term memory.  
7. **Gemini generates** a smart, context-aware response.  
8. **Response is sent** back to the client in real-time.  
9. **AI message stored** again in both MongoDB and Pinecone.  

---

## 🔑 Environment Variables

Create a `.env` file in your backend folder and include:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=your_pinecone_index_name
GOOGLE_API_KEY=your_google_genai_key
CORS_ORIGIN=http://localhost:5173
```

## 🖥️ Run Locally

**Backend**
- cd backend
- npm install
- npm run dev

**Frontend**
- cd frontend
- npm install
- npm run dev
