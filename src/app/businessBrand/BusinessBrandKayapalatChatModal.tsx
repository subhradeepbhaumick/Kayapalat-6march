"use client";
import React, { useEffect, useRef, useState } from "react";
import {
    X,
    ArrowRightCircle,
    MessageCircle,
    Loader2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
interface ChatMessage {
    id: number;
    sender_id: number | string;
    message?: string;
    image_url?: string;
    created_at: string;
}
interface BusinessBrandKayapalatChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: number;
}
const BusinessBrandKayapalatChatModal = ({
    isOpen,
    onClose,
    productId,
}: BusinessBrandKayapalatChatModalProps) => {
    const { data: session } = useSession();
    const [chatInput, setChatInput] = useState("");
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    // =========================
    // AUTO SCROLL
    // =========================
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [chatMessages]);
    // =========================
    // FETCH MESSAGES
    // =========================
    const fetchMessages = async () => {
        try {
            setLoading(true);
            const res = await fetch(
                `/api/businessBrand/products/chatbox?product_id=${productId}`,
                {
                    credentials: "include",
                }
            );
            const data = await res.json();
            if (res.ok) {
                setChatMessages(data.messages || []);
            } else {
                toast.error(data.error || "Failed to fetch chats");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch chats");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (isOpen && productId) {
            fetchMessages();
        }
    }, [isOpen, productId]);
    // =========================
    // SEND MESSAGE
    // =========================
    const sendChat = async () => {
        if (!chatInput.trim() && !selectedImage) return;
        try {
            setSending(true);
            const formData = new FormData();
            formData.append("product_id", productId.toString());
            formData.append("message", chatInput);
            if (selectedImage) {
                formData.append("image", selectedImage);
            }
            const res = await fetch(
                "/api/businessBrand/products/chatbox",
                {
                    method: "POST",
                    body: formData,
                    credentials: "include",
                }
            );
            const data = await res.json();
            if (res.ok) {
                setChatInput("");
                setSelectedImage(null);
                fetchMessages();
            } else {
                toast.error(data.error || "Failed to send message");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to send message");
        } finally {
            setSending(false);
        }
    };
    if (!isOpen) return null;
    return (
        <>
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[92vh] sm:h-[88vh] flex flex-col overflow-hidden">
                    {/* HEADER */}
                    <div className="bg-gradient-to-r from-[#295A47] to-[#1e3d32] px-4 sm:px-6 py-4 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-full">
                                <MessageCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-semibold">
                                    Chat with KAYAPALAT
                                </h2>
                                <p className="text-xs sm:text-sm text-white/80">
                                    Discuss stock, pricing, delivery & support
                                </p>
                                <p className="text-xs sm:text-sm text-white/80">
                                    Product ID : {productId}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="bg-white/20 hover:bg-white/30 transition p-2 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    {/* BODY */}
                    <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
                        {/* CHAT AREA */}
                        <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-4">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-[#295A47]" />
                                </div>
                            ) : chatMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                                    <MessageCircle className="w-14 h-14 mb-3 text-gray-300" />
                                    <p className="text-lg font-medium">
                                        No Messages Yet
                                    </p>
                                    <p className="text-sm">
                                        Start conversation with KAYAPALAT
                                    </p>
                                </div>
                            ) : (
                                chatMessages.map((msg) => {
                                    const isMe =
                                        String(msg.sender_id) === String(session?.user?.id);
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""
                                                }`}
                                        >
                                            {/* USER ICON / ID */}
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ${isMe
                                                        ? "bg-[#295A47]"
                                                        : "bg-blue-500"
                                                    }`}
                                            >
                                                {isMe ? "ME" : msg.sender_id}
                                            </div>
                                            {/* MESSAGE BOX */}
                                            <div
                                                className={`p-3 rounded-lg shadow-sm max-w-[90%] sm:max-w-[80%] ${isMe
                                                        ? "bg-[#D7E7D0] rounded-tr-none"
                                                        : "bg-white rounded-tl-none"
                                                    }`}
                                            >
                                                {/* MESSAGE */}
                                                {msg.message && (
                                                    <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                                                        {msg.message}
                                                    </p>
                                                )}
                                                {/* IMAGE */}
                                                {msg.image_url && (
                                                    <img
                                                        src={msg.image_url}
                                                        alt="chat-img"
                                                        className="mt-2 rounded-lg max-h-40 cursor-pointer hover:opacity-80 transition"
                                                        onClick={() =>
                                                            setPreviewImage(msg.image_url || null)
                                                        }
                                                    />
                                                )}
                                                {/* TIME */}
                                                <span className="text-xs text-gray-400 mt-1 block">
                                                    {(() => {
                                                        const date = new Date(
                                                            msg.created_at.replace(" ", "T")
                                                        );
                                                        return date.toLocaleString("en-IN", {
                                                            timeZone: "UTC",
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        });
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        {/* SELECTED IMAGE PREVIEW */}
                        {selectedImage && (
                            <div className="px-3 sm:px-5 pb-2">
                                <div className="bg-white border rounded-xl p-2 flex items-center gap-3 shadow-sm">
                                    <img
                                        src={URL.createObjectURL(selectedImage)}
                                        alt="preview"
                                        className="w-16 h-16 object-cover rounded-lg border"
                                    />
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm text-gray-700 truncate">
                                            {selectedImage.name}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedImage(null)}
                                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* INPUT AREA */}
                        <div className="bg-white border-t px-3 sm:px-5 py-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    id="kayapalatChatImage"
                                    hidden
                                    accept="image/*"
                                    onChange={(e) =>
                                        setSelectedImage(
                                            e.target.files?.[0] || null
                                        )
                                    }
                                />
                                <label
                                    htmlFor="kayapalatChatImage"
                                    className="cursor-pointer text-2xl text-gray-500 hover:text-[#295A47] transition"
                                >
                                    📎
                                </label>
                                <input
                                    type="text"
                                    placeholder="Type your message..."
                                    value={chatInput}
                                    onChange={(e) =>
                                        setChatInput(e.target.value)
                                    }
                                    onKeyDown={(e) =>
                                        e.key === "Enter" && sendChat()
                                    }
                                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#295A47]"
                                />
                                <button
                                    onClick={sendChat}
                                    disabled={sending}
                                    className="bg-[#295A47] hover:bg-[#1f4637] transition text-white p-3 rounded-xl disabled:opacity-50"
                                >
                                    {sending ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <ArrowRightCircle size={22} />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* IMAGE PREVIEW MODAL */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <img
                        src={previewImage}
                        alt="preview"
                        className="max-w-full max-h-full rounded-2xl"
                    />
                </div>
            )}
        </>
    );
};
export default BusinessBrandKayapalatChatModal;