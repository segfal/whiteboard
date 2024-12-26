/**
 * @file tools.ts
 * @brief Tool Factory and related interfaces for drawing tools
 */

export interface Tool {
    name: string;
    cursor: string;
    execute(context: CanvasRenderingContext2D, x: number, y: number, options: DrawOptions): void;
    begin(context: CanvasRenderingContext2D, x: number, y: number, options: DrawOptions): void;
    move(context: CanvasRenderingContext2D, x: number, y: number, options: DrawOptions): void;
    end(context: CanvasRenderingContext2D): void;
}

export interface DrawOptions {
    color: string;
    thickness: number;
}

class PenTool implements Tool {
    name = 'pen';
    cursor = 'crosshair';

    execute(context: CanvasRenderingContext2D, x: number, y: number, options: DrawOptions): void {
        context.lineTo(x, y);
        context.stroke();
    }

    begin(context: CanvasRenderingContext2D, x: number, y: number, options: DrawOptions): void {
        context.beginPath();
        context.moveTo(x, y);
        context.strokeStyle = options.color;
        context.lineWidth = options.thickness;
        context.lineCap = 'round';
        context.lineJoin = 'round';
    }

    move(context: CanvasRenderingContext2D, x: number, y: number, options: DrawOptions): void {
        this.execute(context, x, y, options);
    }

    end(context: CanvasRenderingContext2D): void {
        context.closePath();
    }
}

class EraserTool implements Tool {
    name = 'eraser';
    cursor = 'crosshair';

    execute(context: CanvasRenderingContext2D, x: number, y: number, options: DrawOptions): void {
        context.lineTo(x, y);
        context.stroke();
    }

    begin(context: CanvasRenderingContext2D, x: number, y: number, options: DrawOptions): void {
        context.beginPath();
        context.moveTo(x, y);
        context.strokeStyle = '#1e1e1e'; // Background color
        context.lineWidth = options.thickness * 2;
        context.lineCap = 'round';
        context.lineJoin = 'round';
    }

    move(context: CanvasRenderingContext2D, x: number, y: number, options: DrawOptions): void {
        this.execute(context, x, y, options);
    }

    end(context: CanvasRenderingContext2D): void {
        context.closePath();
    }
}

export class ToolFactory {
    private static tools: Map<string, Tool> = new Map([
        ['pen', new PenTool()],
        ['eraser', new EraserTool()]
    ]);

    static getTool(name: string): Tool {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Tool ${name} not found`);
        }
        return tool;
    }

    static getAvailableTools(): string[] {
        return Array.from(this.tools.keys());
    }
} 