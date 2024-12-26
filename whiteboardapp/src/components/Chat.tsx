/**
 * @file Chat.tsx
 * @brief Chat component for real-time communication
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { ChatEventData, RoomEventData, UserListData } from '../lib/socket/events';
import { SocketClient } from '../lib/socket/client';

interface ChatProps {
    socketClient: SocketClient;
    roomId: string;
}

interface ChatMessage extends ChatEventData {
    type: 'message' | 'system';
}

export default function Chat({ socketClient, roomId }: ChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [users, setUsers] = useState<string[]>([]);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Set up chat event listeners
        socketClient.onChatMessage((data: ChatEventData) => {
            addMessage({
                ...data,
                type: 'message'
            });
        });

        socketClient.onUserJoined((data: RoomEventData) => {
            addMessage({
                ...data,
                message: `${data.userId} joined`,
                type: 'system'
            });
        });

        socketClient.onUserLeft((data: RoomEventData) => {
            addMessage({
                ...data,
                message: `${data.userId} left`,
                type: 'system'
            });
        });

        socketClient.onUserList((data: UserListData) => {
            setUsers(data.users);
        });

        return () => {
            socketClient.removeAllListeners();
        };
    }, [socketClient]);

    const addMessage = (message: ChatMessage) => {
        setMessages(prev => [...prev, message]);
        // Scroll to bottom with a slight delay to ensure new content is rendered
        setTimeout(() => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
        }, 100);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        socketClient.sendMessage(inputMessage);
        setInputMessage('');
    };

    return (
        <div className="w-80 h-screen bg-[#18181b] flex flex-col border-l border-[#2d2d2d]">
            {/* Header */}
            <div className="p-4 border-b border-[#2d2d2d]">
                <h2 className="text-[#efeff1] font-semibold flex items-center gap-2">
                    <span>Room Chat</span>
                    <span className="text-sm text-[#adadb8]">({users.length})</span>
                </h2>
            </div>

            {/* Messages */}
            <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2d2d2d] hover:scrollbar-thumb-[#3d3d3d]"
            >
                <div className="p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`${
                                msg.type === 'system'
                                    ? 'text-[#adadb8] text-sm text-center'
                                    : 'text-[#efeff1]'
                            }`}
                        >
                            {msg.type === 'message' && (
                                <div className="leading-relaxed">
                                    <span className="font-semibold text-[#9147ff] hover:underline cursor-pointer">
                                        {msg.userId}
                                    </span>
                                    <span className="text-[#efeff1]">: {msg.message}</span>
                                </div>
                            )}
                            {msg.type === 'system' && (
                                <div>{msg.message}</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-[#2d2d2d]">
                <div className="relative">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Send a message"
                        className="w-full bg-[#0e0e10] text-[#efeff1] rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9147ff]"
                    />
                    <button
                        type="submit"
                        disabled={!inputMessage.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#efeff1] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Chat
                    </button>
                </div>
            </form>
        </div>
    );
} 