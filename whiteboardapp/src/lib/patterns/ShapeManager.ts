/**
 * @file ShapeManager.ts
 * @brief Shape management system using the Factory pattern
 */

import { ShapeType } from '../whiteboard';

export interface Shape {
    draw(context: CanvasRenderingContext2D): void;
    contains(x: number, y: number): boolean;
    move(dx: number, dy: number): void;
    resize(dx: number, dy: number): void;
    getBounds(): { x: number, y: number, width: number, height: number };
}

class Rectangle implements Shape {
    constructor(
        private x: number,
        private y: number,
        private width: number,
        private height: number,
        private color: string,
        private thickness: number
    ) {}

    draw(context: CanvasRenderingContext2D): void {
        context.beginPath();
        context.strokeStyle = this.color;
        context.lineWidth = this.thickness;
        context.rect(this.x, this.y, this.width, this.height);
        context.stroke();
    }

    contains(x: number, y: number): boolean {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    move(dx: number, dy: number): void {
        this.x += dx;
        this.y += dy;
    }

    resize(dx: number, dy: number): void {
        this.width += dx;
        this.height += dy;
    }

    getBounds(): { x: number, y: number, width: number, height: number } {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
}

class Circle implements Shape {
    constructor(
        private centerX: number,
        private centerY: number,
        private radius: number,
        private color: string,
        private thickness: number
    ) {}

    draw(context: CanvasRenderingContext2D): void {
        context.beginPath();
        context.strokeStyle = this.color;
        context.lineWidth = this.thickness;
        context.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
        context.stroke();
    }

    contains(x: number, y: number): boolean {
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        return Math.sqrt(dx * dx + dy * dy) <= this.radius;
    }

    move(dx: number, dy: number): void {
        this.centerX += dx;
        this.centerY += dy;
    }

    resize(dx: number, dy: number): void {
        const newRadius = Math.sqrt(dx * dx + dy * dy);
        this.radius = newRadius;
    }

    getBounds(): { x: number, y: number, width: number, height: number } {
        return {
            x: this.centerX - this.radius,
            y: this.centerY - this.radius,
            width: this.radius * 2,
            height: this.radius * 2
        };
    }
}

export class ShapeFactory {
    static createShape(
        type: ShapeType,
        x: number,
        y: number,
        color: string,
        thickness: number
    ): Shape {
        switch (type) {
            case ShapeType.RECTANGLE:
                return new Rectangle(x, y, 100, 100, color, thickness);
            case ShapeType.CIRCLE:
                return new Circle(x, y, 50, color, thickness);
            default:
                throw new Error(`Unsupported shape type: ${type}`);
        }
    }
}

export class ShapeManager {
    private shapes: Shape[] = [];
    private selectedShape: Shape | null = null;

    addShape(shape: Shape): void {
        this.shapes.push(shape);
    }

    removeShape(shape: Shape): void {
        const index = this.shapes.indexOf(shape);
        if (index !== -1) {
            this.shapes.splice(index, 1);
        }
    }

    selectShape(x: number, y: number): Shape | null {
        this.selectedShape = null;
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            if (this.shapes[i].contains(x, y)) {
                this.selectedShape = this.shapes[i];
                break;
            }
        }
        return this.selectedShape;
    }

    moveSelected(dx: number, dy: number): void {
        if (this.selectedShape) {
            this.selectedShape.move(dx, dy);
        }
    }

    resizeSelected(dx: number, dy: number): void {
        if (this.selectedShape) {
            this.selectedShape.resize(dx, dy);
        }
    }

    clearSelection(): void {
        this.selectedShape = null;
    }

    drawShapes(context: CanvasRenderingContext2D): void {
        this.shapes.forEach(shape => shape.draw(context));
    }
} 