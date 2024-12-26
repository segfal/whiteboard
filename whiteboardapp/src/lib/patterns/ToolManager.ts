/**
 * @file ToolManager.ts
 * @brief Tool management system using the Strategy pattern
 */

import { Tool, ShapeType } from '../whiteboard';

export interface ToolStrategy {
    handleMouseDown(x: number, y: number): void;
    handleMouseMove(x: number, y: number): void;
    handleMouseUp(x: number, y: number): void;
    activate(): void;
    deactivate(): void;
}

class DrawTool implements ToolStrategy {
    constructor(
        private whiteboard: any,
        private shape: ShapeType,
        private onStateChange: () => void
    ) {}

    handleMouseDown(x: number, y: number): void {
        this.whiteboard.startDrawing(x, y);
    }

    handleMouseMove(x: number, y: number): void {
        this.whiteboard.continueDrawing(x, y);
    }

    handleMouseUp(x: number, y: number): void {
        this.whiteboard.endDrawing(x, y);
        this.onStateChange();
    }

    activate(): void {
        this.whiteboard.setShape(this.shape);
    }

    deactivate(): void {
        // Clean up any drawing state
    }
}

class SelectTool implements ToolStrategy {
    constructor(
        private whiteboard: any,
        private onStateChange: () => void
    ) {}

    handleMouseDown(x: number, y: number): void {
        this.whiteboard.startSelection(x, y);
    }

    handleMouseMove(x: number, y: number): void {
        this.whiteboard.updateSelection(x, y);
    }

    handleMouseUp(x: number, y: number): void {
        this.whiteboard.endSelection(x, y);
        this.onStateChange();
    }

    activate(): void {
        // Activate selection mode
    }

    deactivate(): void {
        this.whiteboard.clearSelection();
    }
}

class EraseTool implements ToolStrategy {
    constructor(
        private whiteboard: any,
        private onStateChange: () => void
    ) {}

    handleMouseDown(x: number, y: number): void {
        this.whiteboard.startErasing(x, y);
    }

    handleMouseMove(x: number, y: number): void {
        this.whiteboard.continueErasing(x, y);
    }

    handleMouseUp(x: number, y: number): void {
        this.whiteboard.endErasing(x, y);
        this.onStateChange();
    }

    activate(): void {
        // Activate eraser mode
    }

    deactivate(): void {
        // Clean up eraser state
    }
}

export class ToolManager {
    private currentTool: ToolStrategy;
    private tools: Map<Tool, ToolStrategy>;

    constructor(whiteboard: any, onStateChange: () => void) {
        this.tools = new Map([
            [Tool.DRAW, new DrawTool(whiteboard, ShapeType.FREEHAND, onStateChange)],
            [Tool.SELECT, new SelectTool(whiteboard, onStateChange)],
            [Tool.ERASE, new EraseTool(whiteboard, onStateChange)]
        ]);
        this.currentTool = this.tools.get(Tool.DRAW)!;
    }

    setTool(tool: Tool): void {
        this.currentTool.deactivate();
        this.currentTool = this.tools.get(tool)!;
        this.currentTool.activate();
    }

    setShape(shape: ShapeType): void {
        if (this.currentTool instanceof DrawTool) {
            this.tools.set(Tool.DRAW, new DrawTool(this.whiteboard, shape, this.onStateChange));
            this.currentTool = this.tools.get(Tool.DRAW)!;
            this.currentTool.activate();
        }
    }

    handleMouseDown(x: number, y: number): void {
        this.currentTool.handleMouseDown(x, y);
    }

    handleMouseMove(x: number, y: number): void {
        this.currentTool.handleMouseMove(x, y);
    }

    handleMouseUp(x: number, y: number): void {
        this.currentTool.handleMouseUp(x, y);
    }
} 