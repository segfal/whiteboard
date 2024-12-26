import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { DrawEvent, RoomEvent, ChatEvent, CanvasStateData } from './events';

export class SocketServer {
    private io: SocketIOServer;
    private rooms: Map<string, Set<string>> = new Map(); // roomId -> Set of userIds
    private canvasStates: Map<string, string> = new Map(); // roomId -> canvas state (base64)

    constructor(server: HTTPServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: "http://localhost:3000",
                methods: ["GET", "POST"]
            }
        });

        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        this.io.on('connection', (socket: Socket) => {
            console.log('Client connected:', socket.id);

            // Room events
            socket.on(RoomEvent.JOIN_ROOM, (roomId: string) => {
                this.handleJoinRoom(socket, roomId);
            });

            socket.on(RoomEvent.LEAVE_ROOM, (roomId: string) => {
                this.handleLeaveRoom(socket, roomId);
            });

            // Drawing events
            socket.on(DrawEvent.START, (data) => {
                socket.to(data.roomId).emit(DrawEvent.START, data);
            });

            socket.on(DrawEvent.MOVE, (data) => {
                socket.to(data.roomId).emit(DrawEvent.MOVE, data);
            });

            socket.on(DrawEvent.END, (data) => {
                socket.to(data.roomId).emit(DrawEvent.END, data);
            });

            socket.on(DrawEvent.CLEAR, (roomId: string) => {
                socket.to(roomId).emit(DrawEvent.CLEAR);
                this.canvasStates.set(roomId, ''); // Clear saved state
            });

            socket.on(DrawEvent.REQUEST_CANVAS_STATE, (roomId: string) => {
                const state = this.canvasStates.get(roomId);
                if (state) {
                    socket.emit(DrawEvent.CANVAS_STATE_UPDATE, {
                        roomId,
                        imageData: state
                    });
                }
            });

            socket.on(DrawEvent.CANVAS_STATE_UPDATE, (data: CanvasStateData) => {
                this.canvasStates.set(data.roomId, data.imageData);
            });

            // Chat events
            socket.on(ChatEvent.MESSAGE, (data) => {
                this.io.to(data.roomId).emit(ChatEvent.MESSAGE, {
                    userId: socket.id,
                    message: data.message,
                    timestamp: new Date()
                });
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
                this.handleDisconnect(socket);
            });
        });
    }

    private handleJoinRoom(socket: Socket, roomId: string) {
        socket.join(roomId);
        
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }
        this.rooms.get(roomId)!.add(socket.id);

        // Notify room members
        this.io.to(roomId).emit(RoomEvent.USER_JOINED, {
            userId: socket.id,
            timestamp: new Date()
        });

        // Send current user list to the new user
        socket.emit(RoomEvent.USER_LIST, {
            users: Array.from(this.rooms.get(roomId)!),
            roomId
        });

        // Request canvas state from an existing user
        const roomUsers = this.rooms.get(roomId);
        if (roomUsers && roomUsers.size > 1) {
            // Get the first user that's not the current user
            const existingUser = Array.from(roomUsers).find(id => id !== socket.id);
            if (existingUser) {
                this.io.to(existingUser).emit(DrawEvent.REQUEST_CANVAS_STATE, roomId);
            }
        }
    }

    private handleLeaveRoom(socket: Socket, roomId: string) {
        socket.leave(roomId);
        
        const room = this.rooms.get(roomId);
        if (room) {
            room.delete(socket.id);
            if (room.size === 0) {
                this.rooms.delete(roomId);
                this.canvasStates.delete(roomId); // Clean up canvas state when room is empty
            }
        }

        this.io.to(roomId).emit(RoomEvent.USER_LEFT, {
            userId: socket.id,
            timestamp: new Date()
        });
    }

    private handleDisconnect(socket: Socket) {
        // Remove user from all rooms they were in
        this.rooms.forEach((users, roomId) => {
            if (users.has(socket.id)) {
                this.handleLeaveRoom(socket, roomId);
            }
        });
    }
} 