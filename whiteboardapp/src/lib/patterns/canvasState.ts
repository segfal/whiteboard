/**
 * @file canvasState.ts
 * @brief Canvas State Manager using Observer pattern
 */

import { SocketClient } from '../socket/client';

export interface CanvasObserver {
    update(state: string): void;
}

export class CanvasStateManager {
    private static instance: CanvasStateManager;
    private observers: Set<CanvasObserver> = new Set();
    private currentState: string = '';

    private constructor() {}

    static getInstance(): CanvasStateManager {
        if (!CanvasStateManager.instance) {
            CanvasStateManager.instance = new CanvasStateManager();
        }
        return CanvasStateManager.instance;
    }

    addObserver(observer: CanvasObserver): void {
        this.observers.add(observer);
    }

    removeObserver(observer: CanvasObserver): void {
        this.observers.delete(observer);
    }

    notifyObservers(): void {
        this.observers.forEach(observer => observer.update(this.currentState));
    }

    saveState(canvas: HTMLCanvasElement): void {
        this.currentState = canvas.toDataURL('image/png');
        this.notifyObservers();
    }

    loadState(context: CanvasRenderingContext2D, imageData: string): void {
        this.currentState = imageData;
        const img = new Image();
        img.onload = () => {
            if (!context || !context.canvas) return;

            // Clear the canvas first
            context.fillStyle = '#1e1e1e';
            context.fillRect(0, 0, context.canvas.width, context.canvas.height);

            // Calculate scaling to maintain aspect ratio
            const dpr = window.devicePixelRatio || 1;
            const scale = Math.min(
                context.canvas.width / (img.width * dpr),
                context.canvas.height / (img.height * dpr)
            );

            const x = (context.canvas.width / dpr - img.width * scale) / 2;
            const y = (context.canvas.height / dpr - img.height * scale) / 2;

            context.drawImage(img, x, y, img.width * scale, img.height * scale);
        };
        img.src = imageData;
    }

    getCurrentState(): string {
        return this.currentState;
    }
}

export class SocketCanvasObserver implements CanvasObserver {
    constructor(private socketClient: SocketClient) {}

    update(state: string): void {
        this.socketClient.updateCanvasState(state);
    }
}

export class CanvasStateSync {
    private stateManager: CanvasStateManager;
    private socketObserver: SocketCanvasObserver;

    constructor(socketClient: SocketClient) {
        this.stateManager = CanvasStateManager.getInstance();
        this.socketObserver = new SocketCanvasObserver(socketClient);
        this.stateManager.addObserver(this.socketObserver);

        // Set up socket event listeners
        socketClient.onCanvasStateUpdate(data => {
            const context = this.getCanvasContext();
            if (context) {
                this.stateManager.loadState(context, data.imageData);
            }
        });
    }

    private getCanvasContext(): CanvasRenderingContext2D | null {
        const canvas = document.querySelector('canvas');
        return canvas?.getContext('2d') || null;
    }

    saveState(canvas: HTMLCanvasElement): void {
        this.stateManager.saveState(canvas);
    }

    cleanup(): void {
        this.stateManager.removeObserver(this.socketObserver);
    }
} 