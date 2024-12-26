# Socket.IO Implementation Documentation

This document details the Socket.IO implementation in the Collaborative Whiteboard application, explaining the real-time communication system and event handling.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Event System](#event-system)
3. [Server Implementation](#server-implementation)
4. [Client Implementation](#client-implementation)
5. [State Synchronization](#state-synchronization)

## Architecture Overview

The Socket.IO implementation follows a client-server architecture with room-based collaboration:

```
                    ┌─────────────┐
                    │  Socket.IO  │
                    │   Server    │
                    └─────────────┘
                          ▲
                          │
                          ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client 1  │◄──►│    Room     │◄──►│   Client 2  │
└─────────���───┘    └─────────────┘    └─────────────┘
```

## Event System

### Drawing Events
```typescript
export enum DrawEvent {
    START = 'draw:start',
    MOVE = 'draw:move',
    END = 'draw:end',
    CLEAR = 'draw:clear',
    REQUEST_STATE = 'draw:request_state',
    CANVAS_STATE_UPDATE = 'draw:state_update'
}
```

### Room Events
```typescript
export enum RoomEvent {
    JOIN_ROOM = 'room:join',
    LEAVE_ROOM = 'room:leave',
    USER_JOINED = 'room:user_joined',
    USER_LEFT = 'room:user_left',
    USER_LIST = 'room:user_list'
}
```

### Chat Events
```typescript
export enum ChatEvent {
    MESSAGE = 'chat:message'
}
```

## Server Implementation

### Server Class
```typescript
export class SocketServer {
    private io: SocketIOServer;
    private rooms: Map<string, Set<string>>;
    private canvasStates: Map<string, string>;

    constructor(server: HTTPServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: "http://localhost:3000",
                methods: ["GET", "POST"]
            }
        });
        this.setupEventHandlers();
    }
}
```

### Event Handling
```typescript
private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
        // Room events
        socket.on(RoomEvent.JOIN_ROOM, (roomId) => {
            this.handleJoinRoom(socket, roomId);
        });

        // Drawing events
        socket.on(DrawEvent.START, (data) => {
            socket.to(data.roomId).emit(DrawEvent.START, data);
        });

        // Chat events
        socket.on(ChatEvent.MESSAGE, (data) => {
            this.io.to(data.roomId).emit(ChatEvent.MESSAGE, {
                userId: socket.id,
                message: data.message,
                timestamp: new Date()
            });
        });
    });
}
```

### Room Management
```typescript
private handleJoinRoom(socket: Socket, roomId: string) {
    socket.join(roomId);
    this.rooms.get(roomId)?.add(socket.id);
    
    // Notify room members
    this.io.to(roomId).emit(RoomEvent.USER_JOINED, {
        userId: socket.id,
        timestamp: new Date()
    });
}
```

## Client Implementation

### Client Class
```typescript
export class SocketClient {
    private socket: Socket;
    private roomId: string | null = null;

    constructor() {
        this.socket = io('http://localhost:3000', {
            autoConnect: false
        });
        this.setupEventHandlers();
    }
}
```

### Event Emission
```typescript
startDrawing(data: Omit<DrawEventData, 'roomId'>) {
    if (!this.roomId) return;
    this.socket.emit(DrawEvent.START, {
        ...data,
        roomId: this.roomId
    });
}
```

### Event Listening
```typescript
onDrawStart(callback: (data: DrawEventData) => void) {
    this.socket.on(DrawEvent.START, callback);
}
```

## State Synchronization

### Canvas State
```typescript
export interface CanvasStateData {
    roomId: string;
    imageData: string; // base64 encoded
}
```

### State Management
```typescript
export class CanvasStateSync {
    constructor(socketClient: SocketClient) {
        socketClient.onCanvasStateUpdate(data => {
            const context = this.getCanvasContext();
            if (context) {
                this.loadState(context, data.imageData);
            }
        });
    }
}
```

## Best Practices

1. **Connection Management**
   ```typescript
   // Automatic reconnection
   const socket = io({
       reconnection: true,
       reconnectionAttempts: 5,
       reconnectionDelay: 1000
   });
   ```

2. **Error Handling**
   ```typescript
   socket.on('connect_error', (error) => {
       console.error('Connection error:', error);
       // Implement retry logic
   });
   ```

3. **Room Management**
   ```typescript
   // Clean up when room is empty
   if (room.size === 0) {
       this.rooms.delete(roomId);
       this.canvasStates.delete(roomId);
   }
   ```

## Performance Optimization

1. **Event Throttling**
   ```typescript
   import { throttle } from 'lodash';

   const throttledEmit = throttle((event, data) => {
       socket.emit(event, data);
   }, 16); // ~60fps
   ```

2. **Binary Data Transfer**
   ```typescript
   // Use binary for large data
   socket.binary(true).emit('binary_event', binaryData);
   ```

3. **Compression**
   ```typescript
   const compressed = await compressImage(imageData);
   socket.emit('compressed_data', compressed);
   ```

## Security Considerations

1. **Input Validation**
   ```typescript
   validateDrawData(data: DrawEventData): boolean {
       return (
           typeof data.x === 'number' &&
           typeof data.y === 'number' &&
           typeof data.color === 'string'
       );
   }
   ```

2. **Room Access Control**
   ```typescript
   verifyRoomAccess(socket: Socket, roomId: string): boolean {
       return this.rooms.get(roomId)?.has(socket.id) || false;
   }
   ```

3. **Rate Limiting**
   ```typescript
   const rateLimiter = new RateLimit({
       windowMs: 1000,
       max: 100
   });
   ```

## Testing

1. **Unit Tests**
   ```typescript
   describe('SocketClient', () => {
       it('should emit draw events', () => {
           const client = new SocketClient();
           // Test event emission
       });
   });
   ```

2. **Integration Tests**
   ```typescript
   describe('Room Management', () => {
       it('should handle room joining', async () => {
           // Test room joining flow
       });
   });
   ```

3. **Load Tests**
   ```typescript
   describe('Performance', () => {
       it('should handle multiple connections', async () => {
           // Test with multiple clients
       });
   });
   ``` 