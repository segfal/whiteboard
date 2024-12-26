export enum DrawEvent {
    START = 'draw:start',
    MOVE = 'draw:move',
    END = 'draw:end',
    CLEAR = 'draw:clear',
    SHAPE_ADDED = 'draw:shape_added',
    REQUEST_CANVAS_STATE = 'draw:request_state',
    CANVAS_STATE_UPDATE = 'draw:state_update'
}

export enum RoomEvent {
    JOIN_ROOM = 'room:join',
    LEAVE_ROOM = 'room:leave',
    USER_JOINED = 'room:user_joined',
    USER_LEFT = 'room:user_left',
    USER_LIST = 'room:user_list'
}

export enum ChatEvent {
    MESSAGE = 'chat:message'
}

export interface DrawEventData {
    roomId: string;
    userId: string;
    x: number;
    y: number;
    color: string;
    thickness: number;
    tool: string;
    shape?: string;
}

export interface CanvasStateData {
    roomId: string;
    imageData: string; // base64 encoded canvas state
}

export interface ChatEventData {
    roomId: string;
    userId: string;
    message: string;
    timestamp: Date;
}

export interface RoomEventData {
    roomId: string;
    userId: string;
    timestamp: Date;
}

export interface UserListData {
    roomId: string;
    users: string[];
} 