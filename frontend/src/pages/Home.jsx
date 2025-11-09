import React, { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import ChatMobileBar from "../components/chat/ChatMobileBar.jsx";
import ChatSidebar from "../components/chat/ChatSidebar.jsx";
import ChatMessages from "../components/chat/ChatMessages.jsx";
import ChatComposer from "../components/chat/ChatComposer.jsx";
import "../components/chat/ChatLayout.css";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  startNewChat,
  selectChat,
  setInput,
  sendingStarted,
  sendingFinished,
  addUserMessage,
  addAIMessage,
  setChats,
} from "../store/chatSlice.js";

const Home = () => {
  // Redux se data le rahe hain
  const dispatch = useDispatch();
  const chats = useSelector((state) => state.chat.chats);
  const activeChatId = useSelector((state) => state.chat.activeChatId);
  const input = useSelector((state) => state.chat.input);
  const isSending = useSelector((state) => state.chat.isSending);

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [socket, setSocket] = useState(null);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  const [messages, setMessages] = useState([
    // Messages store in this structure ...
    // {
    //   role: "user",
    //   content: "hey ai, how are you ?"
    // }
  ]);

  // Naya chat banane ka handler
  const handleNewChat = async () => {
    // Prompt user for title of new chat, fallback to 'New Chat'
    let title = window.prompt("Enter a title for the new chat:", "");
    if (title) title = title.trim();
    if (!title) return;

    // Backend ko request bheji hai to create new chat
    const response = await axios.post(
      "http://localhost:3000/api/chat",
      {
        title,
      },
      {
        withCredentials: true,
      }
    );
    // new chat add karna
    getMessages(response.data.chat._id);
    dispatch(startNewChat(response.data.chat));
    setSidebarOpen(false);
  };

  useEffect(() => {
    // sab chats get kar lo
    axios
      .get("http://localhost:3000/api/chat", { withCredentials: true })
      .then((response) => {
        dispatch(setChats(response.data.chats.reverse()));
      });

    // socket.io connection setup
    const tempSocket = io("http://localhost:3000", {
      withCredentials: true,
    });

    // jab AI message bheje (backend se frontend par ai message araha hai...)
    tempSocket.on("ai-response", (messagePayload) => {
      console.log("Received Ai response:", messagePayload);

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          type: "ai",
          content: messagePayload.content,
        },
      ]);

      dispatch(sendingFinished());
    });

    setSocket(tempSocket);
  }, []);

  // User message jab jae ga backend ko..
  const sendMessage = async () => {
    const trimmed = input.trim();
    console.log("Sending message:", trimmed);
    if (!trimmed || !activeChatId || isSending) return;
    dispatch(sendingStarted());

    const newMessages = [
      ...messages,
      {
        type: "user",
        content: trimmed,
      },
    ];

    console.log("New messages:", newMessages);

    setMessages(newMessages);
    dispatch(setInput(""));

    socket.emit("ai-message", {
      chat: activeChatId,
      content: trimmed,
    });
  };

  // Chat ke messages laana
  const getMessages = async (chatId) => {
    const response = await axios.get(
      `http://localhost:3000/api/chat/messages/${chatId}`,
      { withCredentials: true }
    );

    console.log("Fetched messages:", response.data.messages);

    setMessages(
      response.data.messages.map((m) => ({
        type: m.role === "user" ? "user" : "ai",
        content: m.content,
      }))
    );
  };

  return (
    <div className="chat-layout minimal">
      <ChatMobileBar
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
        onNewChat={handleNewChat}
      />
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={(id) => {
          dispatch(selectChat(id));
          setSidebarOpen(false);
          getMessages(id);
        }}
        onNewChat={handleNewChat}
        open={sidebarOpen}
      />
      <main style={{padding:"10px"}} className="chat-main" role="main">
        {messages.length === 0 && (
          <div className="chat-welcome" aria-hidden="true">
            <div className="chip">Flux AI</div>
            <h1>Welcome to Flux</h1>
            <p>
              Your intelligent companion for every thought, question, and idea.
              Start a conversation, explore possibilities, and let Flux assist
              you in turning curiosity into clarity — one chat at a time.
            </p>
          </div>
        )}
        <ChatMessages messages={messages} isSending={isSending} />
        {activeChatId && (
          <ChatComposer
            input={input}
            setInput={(v) => dispatch(setInput(v))}
            onSend={sendMessage}
            isSending={isSending}
          />
        )}
      </main>
      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Home;
