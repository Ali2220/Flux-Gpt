// Ye file handle karti hai:

// Chat banana

// Chat select karna

// Messages add karna (user + AI dono)

// Input aur loading state handle karna

import { createSlice, nanoid } from "@reduxjs/toolkit";

// helpers
const createEmptyChat = (title) => ({
  id: nanoid(),
  title: title || "New Chat",
  messages: [],
});

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    chats: [], // sab chats ka array
    activeChatId: null, // abhi konsi chat open hai
    isSending: false, // message bhej rahe ho ya nahi (loading indicator)
    input: "", // user ka current text input
  },
  reducers: {
    // Nayi chat manually start karna
    startNewChat: {
      reducer(state, action) {
        const { _id, title } = action.payload;
        // new chat ko list ke top pe add karo
        state.chats.unshift({ _id, title: title || "New Chat", messages: [] });
        state.activeChatId = _id;
      },
    },

    // Kisi existing chat pe click kiya — usko select kar do
    selectChat(state, action) {
      state.activeChatId = action.payload;
    },

    // User input box ke value ko update karna
    setInput(state, action) {
      state.input = action.payload;
    },

    // Jab message bhejna start ho
    sendingStarted(state) {
      state.isSending = true;
    },

    // Jab message bhejna khatam ho
    sendingFinished(state) {
      state.isSending = false;
    },

    // Backend se saari chats set kar do
    setChats(state, action) {
      state.chats = action.payload;
    },

    // User ka message add karna
    addUserMessage: {
      reducer(state, action) {
        const { chatId, message } = action.payload;
        const chat = state.chats.find((c) => c.id === chatId);
        if (!chat) return;

        // Agar ye pehla message hai to usse chat title set kar do
        if (chat.messages.length === 0) {
          chat.title =
            message.content.slice(0, 40) +
            (message.content.length > 40 ? "…" : "");
        }
        chat.messages.push(message);
      },

      // prepare ek helper hai jo payload automatically banata hai
      prepare(chatId, content) {
        return {
          payload: {
            chatId,
            message: { id: nanoid(), role: "user", content, ts: Date.now() },
          },
        };
      },
    },

    // AI ka message add karna
    addAIMessage: {
      reducer(state, action) {
        const { chatId, message } = action.payload;
        const chat = state.chats.find((c) => c.id === chatId);
        if (!chat) return;
        chat.messages.push(message);
      },
      prepare(chatId, content, error = false) {
        return {
          payload: {
            chatId,
            message: {
              id: nanoid(),
              role: "ai",
              content,
              ts: Date.now(),
              ...(error ? { error: true } : {}),
            },
          },
        };
      },
    },
  },
});

export const {
  startNewChat,
  selectChat,
  setInput,
  sendingStarted,
  sendingFinished,
  addUserMessage,
  addAIMessage,
  setChats,
} = chatSlice.actions;

export default chatSlice.reducer;
