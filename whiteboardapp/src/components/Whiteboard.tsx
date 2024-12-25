/**
 * @file Whiteboard.tsx
 * @brief React component for the whiteboard interface
 * 
 * This component provides the user interface for the whiteboard application.
 * It manages:
 * - Canvas setup and sizing
 * - Tool selection (draw, select, erase)
 * - Shape selection (freehand, rectangle, circle)
 * - Color and thickness controls
 * - Action buttons (clear, delete)
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { WhiteboardWrapper, ShapeType } from '../lib/whiteboard';

/**
 * @brief Main whiteboard component
 * 
 * This component integrates the WebAssembly whiteboard functionality
 * with React's component lifecycle and state management.
 * 
 * Features:
 * - Responsive canvas sizing
 * - Tool selection UI
 * - Drawing controls
 * - Touch and mouse support
 */
export default function Whiteboard() {
    // Refs for canvas and whiteboard instance
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const whiteboardRef = useRef<WhiteboardWrapper | null>(null);

    // State for drawing settings
    const [color, setColor] = useState('#000000');           // Current color
    const [thickness, setThickness] = useState(2);           // Line thickness
    const [currentTool, setCurrentTool] = useState<'draw' | 'select' | 'erase'>('draw');  // Active tool
    const [currentShape, setCurrentShape] = useState<ShapeType>(ShapeType.FREEHAND);      // Active shape

    /**
     * @brief Initialize whiteboard on component mount
     * 
     * This effect:
     * 1. Sets up the canvas size
     * 2. Initializes the whiteboard wrapper
     * 3. Sets up window resize handling
     */
    useEffect(() => {
        const initWhiteboard = async () => {
            if (!canvasRef.current) return;

            // Set canvas size to window dimensions
            const canvas = canvasRef.current;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // Create and initialize whiteboard instance
            const whiteboard = new WhiteboardWrapper();
            await whiteboard.initialize(canvas);
            whiteboardRef.current = whiteboard;
        };

        initWhiteboard();

        // Handle window resize events
        const handleResize = () => {
            if (!canvasRef.current) return;
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    /**
     * @brief Update whiteboard color when changed
     */
    useEffect(() => {
        if (whiteboardRef.current) {
            whiteboardRef.current.setColor(color);
        }
    }, [color]);

    /**
     * @brief Update line thickness when changed
     */
    useEffect(() => {
        if (whiteboardRef.current) {
            whiteboardRef.current.setThickness(thickness);
        }
    }, [thickness]);

    /**
     * @brief Toggle selection mode when tool changes
     */
    useEffect(() => {
        if (whiteboardRef.current) {
            whiteboardRef.current.toggleSelection(currentTool === 'select');
        }
    }, [currentTool]);

    /**
     * @brief Update shape type when changed
     */
    useEffect(() => {
        if (whiteboardRef.current) {
            whiteboardRef.current.setShape(currentShape);
        }
    }, [currentShape]);

    /**
     * @brief Clear the entire canvas
     */
    const handleClear = () => {
        if (whiteboardRef.current) {
            whiteboardRef.current.clear();
        }
    };

    /**
     * @brief Delete selected elements
     */
    const handleDelete = () => {
        if (whiteboardRef.current && currentTool === 'select') {
            whiteboardRef.current.deleteSelection();
        }
    };

    return (
        <div className="relative w-full h-screen">
            {/* Canvas Element */}
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
            />

            {/* Tools Panel */}
            <div className="absolute top-4 left-4 flex flex-col gap-4">
                {/* Drawing Tools */}
                <div className="bg-white p-4 rounded-lg shadow-lg flex gap-4">
                    <button
                        onClick={() => setCurrentTool('draw')}
                        className={`px-4 py-2 rounded ${
                            currentTool === 'draw' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                        }`}
                        title="Draw shapes and lines"
                    >
                        Draw
                    </button>
                    <button
                        onClick={() => setCurrentTool('select')}
                        className={`px-4 py-2 rounded ${
                            currentTool === 'select' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                        }`}
                        title="Select and move elements"
                    >
                        Select
                    </button>
                    <button
                        onClick={() => setCurrentTool('erase')}
                        className={`px-4 py-2 rounded ${
                            currentTool === 'erase' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                        }`}
                        title="Erase parts of the drawing"
                    >
                        Erase
                    </button>
                </div>

                {/* Shape Selection (only shown in draw mode) */}
                {currentTool === 'draw' && (
                    <div className="bg-white p-4 rounded-lg shadow-lg flex gap-4">
                        <button
                            onClick={() => setCurrentShape(ShapeType.FREEHAND)}
                            className={`px-4 py-2 rounded ${
                                currentShape === ShapeType.FREEHAND ? 'bg-blue-500 text-white' : 'bg-gray-200'
                            }`}
                            title="Freehand drawing tool"
                        >
                            Freehand
                        </button>
                        <button
                            onClick={() => setCurrentShape(ShapeType.RECTANGLE)}
                            className={`px-4 py-2 rounded ${
                                currentShape === ShapeType.RECTANGLE ? 'bg-blue-500 text-white' : 'bg-gray-200'
                            }`}
                            title="Draw rectangles"
                        >
                            Rectangle
                        </button>
                        <button
                            onClick={() => setCurrentShape(ShapeType.CIRCLE)}
                            className={`px-4 py-2 rounded ${
                                currentShape === ShapeType.CIRCLE ? 'bg-blue-500 text-white' : 'bg-gray-200'
                            }`}
                            title="Draw circles"
                        >
                            Circle
                        </button>
                    </div>
                )}

                {/* Style Controls */}
                <div className="bg-white p-4 rounded-lg shadow-lg flex gap-4">
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-10 h-10 cursor-pointer"
                        title="Select drawing color"
                    />
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={thickness}
                        onChange={(e) => setThickness(Number(e.target.value))}
                        className="w-32"
                        title="Adjust line thickness"
                    />
                </div>

                {/* Action Buttons */}
                <div className="bg-white p-4 rounded-lg shadow-lg flex gap-4">
                    <button
                        onClick={handleClear}
                        className="px-4 py-2 bg-red-500 text-white rounded"
                        title="Clear entire canvas"
                    >
                        Clear All
                    </button>
                    {currentTool === 'select' && (
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-500 text-white rounded"
                            title="Delete selected elements"
                        >
                            Delete Selected
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
} 