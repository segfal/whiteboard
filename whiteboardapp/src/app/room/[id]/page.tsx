/**
 * @file page.tsx
 * @brief Room page component with whiteboard and chat
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Whiteboard from '@/components/Whiteboard';
import Chat from '@/components/Chat';
import { SocketClient } from '@/lib/socket/client';

export default function RoomPage() {
    const params = useParams();
    const roomId = params.id as string;
    const [socketClient] = useState(() => new SocketClient());
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Connect and join room
        socketClient.connect();
        socketClient.joinRoom(roomId);
        setIsConnected(true);

        return () => {
            socketClient.leaveRoom();
            socketClient.disconnect();
        };
    }, [roomId, socketClient]);

    if (!isConnected) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#0e0e10] text-[#efeff1]">
                <div className="text-xl">Connecting to room...</div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex bg-[#0e0e10] overflow-hidden">
            {/* Main Content Area */}
            <main className="flex-1 relative">
                <Whiteboard socketClient={socketClient} roomId={roomId} />
            </main>

            {/* Chat Sidebar */}
            <Chat socketClient={socketClient} roomId={roomId} />
        </div>
    );
} 