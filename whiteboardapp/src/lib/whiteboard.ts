/**
 * @file whiteboard.ts
 * @brief TypeScript wrapper for the WebAssembly whiteboard implementation
 * 
 * This file provides the bridge between the C++ WebAssembly code and the React frontend.
 * It handles:
 * - WebAssembly module loading and initialization
 * - Canvas event management
 * - Drawing state management
 * - Touch and mouse input handling
 */

/**
 * @brief Shape types available for drawing
 * 
 * These values must match the C++ ShapeType enum exactly.
 * Used to communicate the current drawing tool between TypeScript and C++.
 */
export enum ShapeType {
    FREEHAND = 'FREEHAND',   // Freehand drawing mode
    RECTANGLE = 'RECTANGLE', // Rectangle shape tool
    CIRCLE = 'CIRCLE',      // Circle shape tool
    LINE = 'LINE',          // Straight line tool
    TRIANGLE = 'TRIANGLE'   // Triangle shape tool (future use)
}

/**
 * @brief Interface for the WebAssembly module's Whiteboard constructor
 * 
 * This interface defines the shape of the module exported by Emscripten.
 * It provides access to the Whiteboard class constructor and shape type enum.
 */
interface WhiteboardModule {
    Whiteboard: {
        new(): Whiteboard;
    };
    ShapeType: typeof ShapeType;
}

/**
 * @brief Interface for the WebAssembly-compiled Whiteboard class
 * 
 * This interface matches the public methods of the C++ Whiteboard class.
 * It defines all operations that can be performed on the whiteboard.
 */
interface Whiteboard {
    init(): void;                                    // Initialize/reset the whiteboard
    startDrawing(x: number, y: number): void;        // Start a drawing operation
    continueDrawing(x: number, y: number): void;     // Continue current drawing
    endDrawing(): void;                             // End current drawing
    setShapeType(type: ShapeType): void;            // Set the current shape tool
    setColor(color: string): void;                  // Set drawing color
    setThickness(thickness: number): void;          // Set line thickness
    draw(context: CanvasRenderingContext2D): void;  // Draw to canvas
    clear(): void;                                  // Clear the canvas
    erase(x: number, y: number, radius: number): void; // Erase at point
    startSelection(x: number, y: number): void;     // Start selection operation
    updateSelection(x: number, y: number): void;    // Update selection area
    endSelection(): void;                          // End selection operation
    moveSelected(dx: number, dy: number): void;     // Move selected elements
    deleteSelected(): void;                        // Delete selected elements
    clearSelection(): void;                        // Clear selection state
}

// Module cache to prevent reloading the WebAssembly module
let wasmModule: any = null;

/**
 * @brief Main wrapper class for the WebAssembly whiteboard
 * 
 * This class provides a TypeScript-friendly interface to the WebAssembly module.
 * It handles:
 * - Module initialization
 * - Event management
 * - Canvas interaction
 * - Drawing state
 */
export class WhiteboardWrapper {
    private module: WhiteboardModule | null = null;        // WebAssembly module reference
    private whiteboard: Whiteboard | null = null;          // Whiteboard instance
    private canvas: HTMLCanvasElement | null = null;       // Canvas element
    private context: CanvasRenderingContext2D | null = null; // Canvas context
    private isDrawing = false;                            // Drawing state flag
    private isSelecting = false;                          // Selection mode flag
    private lastX = 0;                                    // Last mouse/touch X position
    private lastY = 0;                                    // Last mouse/touch Y position
    private currentShape: ShapeType = ShapeType.FREEHAND; // Current shape tool

    /**
     * @brief Initialize the whiteboard with a canvas element
     * 
     * This method:
     * 1. Sets up the canvas and context
     * 2. Loads the WebAssembly module
     * 3. Initializes the whiteboard
     * 4. Sets up event listeners
     * 
     * @param canvas HTML Canvas element to draw on
     * @throws Error if canvas context cannot be obtained
     * @throws Error if WebAssembly module fails to load
     */
    async initialize(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        
        if (!this.context) {
            throw new Error('Could not get canvas context');
        }

        try {
            // Load WebAssembly module if not already loaded
            if (!wasmModule) {
                const { default: createModule } = await import(/* webpackIgnore: true */ '/whiteboard.js');
                wasmModule = await createModule({
                    locateFile: (path: string) => {
                        // Handle WebAssembly file location
                        if (path.endsWith('.wasm')) {
                            return '/whiteboard.wasm';
                        }
                        return path;
                    },
                });
            }

            // Initialize whiteboard instance
            this.module = wasmModule;
            this.whiteboard = new this.module.Whiteboard();
            this.whiteboard.init();
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize WebAssembly module:', error);
            throw error;
        }
    }

    /**
     * @brief Set up canvas event listeners
     * 
     * Adds listeners for:
     * - Mouse events (desktop)
     * - Touch events (mobile)
     * - Pointer events (future use)
     */
    private setupEventListeners() {
        if (!this.canvas) return;

        // Mouse event listeners
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('mouseup', this.handleMouseUp);
        this.canvas.addEventListener('mouseleave', this.handleMouseUp);

        // Touch event listeners
        this.canvas.addEventListener('touchstart', this.handleTouchStart);
        this.canvas.addEventListener('touchmove', this.handleTouchMove);
        this.canvas.addEventListener('touchend', this.handleTouchEnd);
    }

    /**
     * @brief Handle mouse down event
     * 
     * Starts drawing or selection operation based on current mode.
     * Converts window coordinates to canvas coordinates.
     */
    private handleMouseDown = (e: MouseEvent) => {
        if (!this.whiteboard || !this.canvas) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.isDrawing = true;
        this.lastX = x;
        this.lastY = y;

        if (this.isSelecting) {
            this.whiteboard.startSelection(x, y);
        } else {
            this.whiteboard.startDrawing(x, y);
        }
        this.draw();
    };

    /**
     * @brief Handle mouse move event
     * 
     * Continues drawing or updates selection based on current mode.
     * Converts window coordinates to canvas coordinates.
     */
    private handleMouseMove = (e: MouseEvent) => {
        if (!this.isDrawing || !this.whiteboard || !this.canvas) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.isSelecting) {
            this.whiteboard.updateSelection(x, y);
        } else {
            this.whiteboard.continueDrawing(x, y);
        }

        this.lastX = x;
        this.lastY = y;
        this.draw();
    };

    /**
     * @brief Handle mouse up event
     * 
     * Ends drawing or selection operation based on current mode.
     */
    private handleMouseUp = () => {
        if (!this.whiteboard || !this.isDrawing) return;

        this.isDrawing = false;
        if (this.isSelecting) {
            this.whiteboard.endSelection();
        } else {
            this.whiteboard.endDrawing();
        }
    };

    /**
     * @brief Handle touch start event
     * 
     * Starts drawing or selection operation based on current mode.
     * Converts window coordinates to canvas coordinates.
     */
    private handleTouchStart = (e: TouchEvent) => {
        if (!this.whiteboard || !this.canvas) return;
        e.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        this.isDrawing = true;
        this.lastX = x;
        this.lastY = y;

        if (this.isSelecting) {
            this.whiteboard.startSelection(x, y);
        } else {
            this.whiteboard.startDrawing(x, y);
        }
        this.draw();
    };

    /**
     * @brief Handle touch move event
     * 
     * Continues drawing or updates selection based on current mode.
     * Converts window coordinates to canvas coordinates.
     */
    private handleTouchMove = (e: TouchEvent) => {
        if (!this.isDrawing || !this.whiteboard || !this.canvas) return;
        e.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        if (this.isSelecting) {
            this.whiteboard.updateSelection(x, y);
        } else {
            this.whiteboard.continueDrawing(x, y);
        }

        this.lastX = x;
        this.lastY = y;
        this.draw();
    };

    /**
     * @brief Handle touch end event
     * 
     * Ends drawing or selection operation based on current mode.
     */
    private handleTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        if (!this.whiteboard || !this.isDrawing) return;

        this.isDrawing = false;
        if (this.isSelecting) {
            this.whiteboard.endSelection();
        } else {
            this.whiteboard.endDrawing();
        }
    };

    /**
     * @brief Set the current shape type
     * @param shape Shape type to use for drawing
     */
    setShape(shape: ShapeType) {
        if (!this.whiteboard) return;
        this.currentShape = shape;
        this.whiteboard.setShapeType(shape);
    }

    /**
     * @brief Toggle selection mode
     * @param enabled Whether selection mode should be enabled
     */
    toggleSelection(enabled: boolean) {
        this.isSelecting = enabled;
        if (!enabled && this.whiteboard) {
            this.whiteboard.clearSelection();
        }
    }

    /**
     * @brief Move selected elements
     * @param dx X offset in pixels
     * @param dy Y offset in pixels
     */
    moveSelection(dx: number, dy: number) {
        if (!this.whiteboard) return;
        this.whiteboard.moveSelected(dx, dy);
        this.draw();
    }

    /**
     * @brief Delete selected elements
     */
    deleteSelection() {
        if (!this.whiteboard) return;
        this.whiteboard.deleteSelected();
        this.draw();
    }

    /**
     * @brief Set the current drawing color
     * @param color Color in HTML format (e.g., "#000000")
     */
    setColor(color: string) {
        if (!this.whiteboard) return;
        this.whiteboard.setColor(color);
    }

    /**
     * @brief Set the current line thickness
     * @param thickness Thickness in pixels
     */
    setThickness(thickness: number) {
        if (!this.whiteboard) return;
        this.whiteboard.setThickness(thickness);
    }

    /**
     * @brief Clear the entire canvas
     */
    clear() {
        if (!this.whiteboard || !this.context || !this.canvas) return;
        this.whiteboard.clear();
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * @brief Erase content at specified coordinates
     * @param x X coordinate of eraser center
     * @param y Y coordinate of eraser center
     * @param radius Eraser radius in pixels
     */
    erase(x: number, y: number, radius: number) {
        if (!this.whiteboard) return;
        this.whiteboard.erase(x, y, radius);
        this.draw();
    }

    /**
     * @brief Draw the current state to the canvas
     * 
     * Clears the canvas and redraws all elements.
     * Called after each operation that modifies the drawing.
     */
    private draw() {
        if (!this.whiteboard || !this.context || !this.canvas) return;
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.whiteboard.draw(this.context);
    }
} 