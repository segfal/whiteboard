import { io, Socket } from 'socket.io-client';
import { DrawEvent, RoomEvent, ChatEvent, DrawEventData, ChatEventData, RoomEventData, UserListData, CanvasStateData } from './events';

export class SocketClient {
    private socket: Socket;
    private roomId: string | null = null;

    constructor() {
        this.socket = io('http://localhost:3000', {
            autoConnect: false
        });

        this.setupEventHandlers();
    }

    get id(): string {
        return this.socket.id || 'unknown';
    }

    private setupEventHandlers() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
        });
    }

    connect() {
        this.socket.connect();
    }

    disconnect() {
        this.socket.disconnect();
    }

    // Room methods
    joinRoom(roomId: string) {
        this.roomId = roomId;
        this.socket.emit(RoomEvent.JOIN_ROOM, roomId);
    }

    leaveRoom() {
        if (this.roomId) {
            this.socket.emit(RoomEvent.LEAVE_ROOM, this.roomId);
            this.roomId = null;
        }
    }

    // Drawing methods
    startDrawing(data: Omit<DrawEventData, 'roomId'>) {
        if (!this.roomId) return;
        this.socket.emit(DrawEvent.START, { ...data, roomId: this.roomId });
    }

    continueDrawing(data: Omit<DrawEventData, 'roomId'>) {
        if (!this.roomId) return;
        this.socket.emit(DrawEvent.MOVE, { ...data, roomId: this.roomId });
    }

    endDrawing(data: Omit<DrawEventData, 'roomId'>) {
        if (!this.roomId) return;
        this.socket.emit(DrawEvent.END, { ...data, roomId: this.roomId });
    }

    clearCanvas() {
        if (!this.roomId) return;
        this.socket.emit(DrawEvent.CLEAR, this.roomId);
    }

    // Canvas state sync methods
    requestCanvasState() {
        if (!this.roomId) return;
        this.socket.emit(DrawEvent.REQUEST_CANVAS_STATE, this.roomId);
    }

    updateCanvasState(imageData: string) {
        if (!this.roomId) return;
        this.socket.emit(DrawEvent.CANVAS_STATE_UPDATE, {
            roomId: this.roomId,
            imageData
        });
    }

    // Chat methods
    sendMessage(message: string) {
        if (!this.roomId) return;
        this.socket.emit(ChatEvent.MESSAGE, {
            roomId: this.roomId,
            message
        });
    }

    // Event listeners
    onDrawStart(callback: (data: DrawEventData) => void) {
        this.socket.on(DrawEvent.START, callback);
    }

    onDrawMove(callback: (data: DrawEventData) => void) {
        this.socket.on(DrawEvent.MOVE, callback);
    }

    onDrawEnd(callback: (data: DrawEventData) => void) {
        this.socket.on(DrawEvent.END, callback);
    }

    onClear(callback: () => void) {
        this.socket.on(DrawEvent.CLEAR, callback);
    }

    onRequestCanvasState(callback: (roomId: string) => void) {
        this.socket.on(DrawEvent.REQUEST_CANVAS_STATE, callback);
    }

    onCanvasStateUpdate(callback: (data: CanvasStateData) => void) {
        this.socket.on(DrawEvent.CANVAS_STATE_UPDATE, callback);
    }

    onUserJoined(callback: (data: RoomEventData) => void) {
        this.socket.on(RoomEvent.USER_JOINED, callback);
    }

    onUserLeft(callback: (data: RoomEventData) => void) {
        this.socket.on(RoomEvent.USER_LEFT, callback);
    }

    onUserList(callback: (data: UserListData) => void) {
        this.socket.on(RoomEvent.USER_LIST, callback);
    }

    onChatMessage(callback: (data: ChatEventData) => void) {
        this.socket.on(ChatEvent.MESSAGE, callback);
    }

    // Cleanup
    removeAllListeners() {
        this.socket.removeAllListeners();
        this.setupEventHandlers(); // Restore basic handlers
    }
} 