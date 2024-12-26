/**
 * @file commands.ts
 * @brief Command pattern implementation for drawing operations
 */

import { Tool, DrawOptions } from './tools';

export interface Command {
    execute(): void;
    undo(): void;
}

export class DrawCommand implements Command {
    constructor(
        private context: CanvasRenderingContext2D,
        private tool: Tool,
        private x: number,
        private y: number,
        private options: DrawOptions,
        private imageData?: ImageData
    ) {
        // Save the current canvas state if not provided
        if (!this.imageData && context) {
            this.imageData = context.getImageData(
                0,
                0,
                context.canvas.width,
                context.canvas.height
            );
        }
    }

    execute(): void {
        this.tool.execute(this.context, this.x, this.y, this.options);
    }

    undo(): void {
        if (this.imageData) {
            this.context.putImageData(this.imageData, 0, 0);
        }
    }
}

export class ClearCommand implements Command {
    private previousState: ImageData;

    constructor(private context: CanvasRenderingContext2D) {
        this.previousState = context.getImageData(
            0,
            0,
            context.canvas.width,
            context.canvas.height
        );
    }

    execute(): void {
        const canvas = this.context.canvas;
        this.context.fillStyle = '#1e1e1e';
        this.context.fillRect(0, 0, canvas.width, canvas.height);
    }

    undo(): void {
        this.context.putImageData(this.previousState, 0, 0);
    }
}

export class CommandInvoker {
    private undoStack: Command[] = [];
    private redoStack: Command[] = [];

    execute(command: Command): void {
        command.execute();
        this.undoStack.push(command);
        this.redoStack = []; // Clear redo stack when new command is executed
    }

    undo(): void {
        const command = this.undoStack.pop();
        if (command) {
            command.undo();
            this.redoStack.push(command);
        }
    }

    redo(): void {
        const command = this.redoStack.pop();
        if (command) {
            command.execute();
            this.undoStack.push(command);
        }
    }

    clear(): void {
        this.undoStack = [];
        this.redoStack = [];
    }
} 