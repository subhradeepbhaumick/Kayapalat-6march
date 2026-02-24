"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { Send, Image as ImageIcon } from "lucide-react";

interface Message {
  sender: "supervisor" | "admin";
  text?: string;
  image?: string;
  time: string;
}

const ChatPage = () => {
  const params = useParams();
  const projectId = params.projectId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Fake initial chat
  useEffect(() => {
    setMessages([
      {
        sender: "admin",
        text: "Please send today site photos",
        time: "09:30 AM",
      },
    ]);
  }, []);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSend = () => {
    if (!text && !imageFile) return;

    const newMessage: Message = {
      sender: "supervisor",

      text,

      image: imageFile ? URL.createObjectURL(imageFile) : undefined,

      time: new Date().toLocaleTimeString(),
    };

    setMessages([...messages, newMessage]);

    setText("");
    setImageFile(null);
  };

  // Image select
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col h-[90vh] p-4">
      {/* Header */}

      <h1 className="text-2xl font-bold text-[#295A47] mb-4">
        Project Chat — {projectId}
      </h1>

      {/* Chat Box */}

      <div className="flex-1 bg-white rounded shadow p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 flex ${
              msg.sender === "supervisor" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`p-3 rounded-lg max-w-xs ${
                msg.sender === "supervisor"
                  ? "bg-[#295A47] text-white"
                  : "bg-gray-200"
              }`}
            >
              {msg.text && <p>{msg.text}</p>}

              {msg.image && <img src={msg.image} className="mt-2 rounded" />}

              <span className="text-xs block mt-1 opacity-70">{msg.time}</span>
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}

      <div className="flex gap-2 mt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message..."
          className="flex-1 border rounded p-2"
        />

        {/* Image */}

        <label className="cursor-pointer bg-gray-200 p-2 rounded">
          <ImageIcon />

          <input type="file" hidden onChange={handleImage} />
        </label>

        {/* Send */}

        <button
          onClick={handleSend}
          className="bg-[#295A47] text-white p-2 rounded"
        >
          <Send />
        </button>
      </div>

      {/* Preview */}

      {imageFile && <p className="text-sm mt-1">{imageFile.name}</p>}
    </div>
  );
};

export default ChatPage;
