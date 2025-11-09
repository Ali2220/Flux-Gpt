/* Explanation:

Redux store ek central memory hoti hai jisme sab data stored hota hai (like chats, messages, user input).

configureStore() ek Redux Toolkit ka function hai jo store banata hai.

chatReducer imported from chatSlice.js — ye hamare chat-related logic ko handle karta hai (chat banana, message add karna, etc).

Store export kar rahe hain takay poora app usko access kar sake. */
 

import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './chatSlice.js';

export const store = configureStore({
    reducer: {
        chat: chatReducer,
    },

});

export default store;
