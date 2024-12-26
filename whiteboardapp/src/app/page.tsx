/**
 * @file page.tsx
 * @brief Home page with room creation and joining functionality
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
    const router = useRouter();
    const [roomId, setRoomId] = useState('');
    const [error, setError] = useState('');

    const generateRoomId = () => {
        // Generate a random 6-character room ID
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const createRoom = () => {
        const newRoomId = generateRoomId();
        router.push(`/room/${newRoomId}`);
    };

    const joinRoom = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!roomId.trim()) {
            setError('Please enter a room ID');
            return;
        }

        router.push(`/room/${roomId.toUpperCase()}`);
    };

    return (
        <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-2">Collaborative Whiteboard</h1>
                    <p className="text-gray-400">Create or join a room to start collaborating</p>
                </div>

                <div className="space-y-4">
                    {/* Create Room */}
                    <div>
                        <button
                            onClick={createRoom}
                            className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                            Create New Room
                        </button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-[#121212] text-gray-400">Or</span>
                        </div>
                    </div>

                    {/* Join Room */}
                    <form onSubmit={joinRoom} className="space-y-4">
                        <div>
                            <label htmlFor="roomId" className="block text-sm font-medium mb-2">
                                Join Existing Room
                            </label>
                            <input
                                type="text"
                                id="roomId"
                                value={roomId}
                                onChange={(e) => {
                                    setError('');
                                    setRoomId(e.target.value.toUpperCase());
                                }}
                                placeholder="Enter Room ID"
                                className="w-full bg-[#2d2d2d] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                maxLength={6}
                            />
                            {error && (
                                <p className="mt-2 text-sm text-red-500">{error}</p>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-[#2d2d2d] text-white px-4 py-3 rounded-lg hover:bg-[#3d3d3d] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                            Join Room
                        </button>
                    </form>
                </div>

                <div className="text-center text-sm text-gray-400">
                    <p>Room IDs are 6 characters long and case-insensitive</p>
                    <p>Example: ABC123</p>
                </div>
            </div>
        </div>
    );
}
