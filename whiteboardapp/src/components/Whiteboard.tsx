/**
 * @file Whiteboard.tsx
 * @brief React component for the whiteboard interface with Excalidraw-like UI
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { WhiteboardWrapper, ShapeType, Tool } from '../lib/whiteboard';
import { ColorManager } from '../lib/patterns/ColorManager';
import { ToolManager } from '../lib/patterns/ToolManager';
import { ExportManager } from '../lib/patterns/ExportManager';
import { ShapeManager, ShapeFactory } from '../lib/patterns/ShapeManager';

/**
 * @brief Main whiteboard component
 * 
 * This component integrates the WebAssembly whiteboard functionality
 * with React's component lifecycle and state management.
 */
export default function Whiteboard() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const whiteboardRef = useRef<WhiteboardWrapper | null>(null);
    const colorManagerRef = useRef<ColorManager | null>(null);
    const toolManagerRef = useRef<ToolManager | null>(null);
    const exportManagerRef = useRef<ExportManager | null>(null);
    const shapeManagerRef = useRef<ShapeManager | null>(null);

    const [currentTool, setCurrentTool] = useState<Tool>(Tool.DRAW);
    const [currentShape, setCurrentShape] = useState<ShapeType>(ShapeType.FREEHAND);
    const [isDarkMode, setIsDarkMode] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);
    const [currentColor, setCurrentColor] = useState<string>('');
    const [currentThickness, setCurrentThickness] = useState(2);
    const [eraserSize, setEraserSize] = useState(20);
    const [isDraggingShape, setIsDraggingShape] = useState(false);
    const [draggedShape, setDraggedShape] = useState<ShapeType | null>(null);

    // Initialize managers and state
    useEffect(() => {
        if (!canvasRef.current) return;

        const whiteboard = new WhiteboardWrapper();
        whiteboardRef.current = whiteboard;

        const initWhiteboard = async () => {
            try {
                await whiteboard.initialize(canvasRef.current!);
                
                // Initialize managers
                colorManagerRef.current = new ColorManager(isDarkMode, (color) => {
                    setCurrentColor(color);
                    whiteboard.setColor(color);
                });

                toolManagerRef.current = new ToolManager(whiteboard, () => {
                    // Handle state changes
                });

                exportManagerRef.current = new ExportManager(() => whiteboard.getSVGContent());
                
                shapeManagerRef.current = new ShapeManager();

                // Set initial states
                const color = isDarkMode ? '#FFFFFF' : '#000000';
                colorManagerRef.current.setColor(color);
                whiteboard.setThickness(currentThickness);
                whiteboard.setShape(currentShape);
                whiteboard.setTool(currentTool);
                whiteboard.setEraserSize(eraserSize);
            } catch (error) {
                console.error('Failed to initialize whiteboard:', error);
            }
        };

        initWhiteboard();

        return () => {
            whiteboardRef.current = null;
            colorManagerRef.current = null;
            toolManagerRef.current = null;
            exportManagerRef.current = null;
            shapeManagerRef.current = null;
        };
    }, []);

    const toggleDarkMode = () => {
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);
        
        if (canvasRef.current) {
            canvasRef.current.style.backgroundColor = newDarkMode ? '#1a1a1a' : '#ffffff';
        }

        if (colorManagerRef.current) {
            colorManagerRef.current.toggleDarkMode();
        }
    };

    const handleShapeDragStart = (e: React.DragEvent, shape: ShapeType) => {
        e.dataTransfer.setData('application/shape', shape);
        setIsDraggingShape(true);
        setDraggedShape(shape);
    };

    const handleShapeDragEnd = (e: React.DragEvent) => {
        setIsDraggingShape(false);
        setDraggedShape(null);
    };

    const handleCanvasDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        if (canvasRef.current) {
            canvasRef.current.style.cursor = 'copy';
        }
    };

    const handleCanvasDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!whiteboardRef.current || !canvasRef.current || !shapeManagerRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const shape = e.dataTransfer.getData('application/shape') as ShapeType;

        if (shape) {
            const newShape = ShapeFactory.createShape(shape, x, y, currentColor, currentThickness);
            shapeManagerRef.current.addShape(newShape);
            whiteboardRef.current.redraw();
        }

        setIsDraggingShape(false);
        setDraggedShape(null);
        if (canvasRef.current) {
            canvasRef.current.style.cursor = 'default';
        }
    };

    const handleToolChange = (tool: Tool) => {
        setCurrentTool(tool);
        if (toolManagerRef.current) {
            toolManagerRef.current.setTool(tool);
        }
    };

    const handleColorChange = (color: string) => {
        if (colorManagerRef.current) {
            colorManagerRef.current.setColor(color);
        }
    };

    const handleThicknessChange = (thickness: number) => {
        setCurrentThickness(thickness);
        if (whiteboardRef.current) {
            whiteboardRef.current.setThickness(thickness);
        }
    };

    const handleEraserSizeChange = (size: number) => {
        setEraserSize(size);
        if (whiteboardRef.current) {
            whiteboardRef.current.setEraserSize(size);
        }
    };

    const handleClear = () => {
        if (whiteboardRef.current) {
            whiteboardRef.current.clear();
        }
    };

    const handleDelete = () => {
        if (whiteboardRef.current) {
            whiteboardRef.current.deleteSelection();
        }
    };

    const exportAsPNG = () => {
        if (!canvasRef.current || !exportManagerRef.current) return;
        exportManagerRef.current.export('png', canvasRef.current, isDarkMode);
    };

    const exportAsSVG = () => {
        if (!canvasRef.current || !exportManagerRef.current) return;
        exportManagerRef.current.export('svg', canvasRef.current, isDarkMode);
    };

    return (
        <div className="h-screen w-screen flex relative bg-[#121212] text-white">
            {/* Left Toolbar */}
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-[#1e1e1e] rounded-lg p-2 shadow-lg">
                <div className="flex flex-col gap-2">
                    <button
                        className={`p-3 rounded-lg ${currentTool === Tool.DRAW ? 'bg-[#3d3d3d]' : 'hover:bg-[#2d2d2d]'}`}
                        onClick={() => handleToolChange(Tool.DRAW)}
                        title="Draw"
                    >
                        ✏️
                    </button>
                    <button
                        className={`p-3 rounded-lg ${currentTool === Tool.SELECT ? 'bg-[#3d3d3d]' : 'hover:bg-[#2d2d2d]'}`}
                        onClick={() => handleToolChange(Tool.SELECT)}
                        title="Select"
                    >
                        ↖️
                    </button>
                    <button
                        className={`p-3 rounded-lg ${currentTool === Tool.ERASE ? 'bg-[#3d3d3d]' : 'hover:bg-[#2d2d2d]'}`}
                        onClick={() => handleToolChange(Tool.ERASE)}
                        title="Erase"
                    >
                        🗑️
                    </button>
                    <div className="h-px bg-gray-600 my-2"></div>
                    <div
                        draggable
                        onDragStart={(e) => handleShapeDragStart(e, ShapeType.RECTANGLE)}
                        onDragEnd={handleShapeDragEnd}
                        className="p-3 rounded-lg hover:bg-[#2d2d2d] cursor-move"
                        title="Rectangle"
                    >
                        ⬜
                    </div>
                    <div
                        draggable
                        onDragStart={(e) => handleShapeDragStart(e, ShapeType.CIRCLE)}
                        onDragEnd={handleShapeDragEnd}
                        className="p-3 rounded-lg hover:bg-[#2d2d2d] cursor-move"
                        title="Circle"
                    >
                        ⭕
                    </div>
                </div>
            </div>

            {/* Top Toolbar */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-[#1e1e1e] rounded-lg p-2 shadow-lg flex items-center gap-4">
                <button
                    className="p-2 rounded hover:bg-[#2d2d2d]"
                    onClick={toggleDarkMode}
                >
                    {isDarkMode ? '☀️' : '🌙'}
                </button>
                {currentTool === Tool.DRAW && (
                    <>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={currentColor}
                                onChange={(e) => handleColorChange(e.target.value)}
                                className="w-8 h-8 rounded bg-transparent"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="1"
                                max="20"
                                value={currentThickness}
                                onChange={(e) => handleThicknessChange(Number(e.target.value))}
                                className="w-24"
                            />
                        </div>
                    </>
                )}
                {currentTool === Tool.ERASE && (
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="5"
                            max="50"
                            value={eraserSize}
                            onChange={(e) => handleEraserSizeChange(Number(e.target.value))}
                            className="w-24"
                        />
                    </div>
                )}
                <button
                    className="p-2 rounded hover:bg-[#2d2d2d] text-red-500"
                    onClick={handleClear}
                >
                    🗑️
                </button>
                {currentTool === Tool.SELECT && (
                    <button
                        className="p-2 rounded hover:bg-[#2d2d2d] text-red-500"
                        onClick={handleDelete}
                    >
                        ❌
                    </button>
                )}
                <div className="h-px bg-gray-600 mx-2"></div>
                <button
                    className="p-2 rounded hover:bg-[#2d2d2d]"
                    onClick={exportAsPNG}
                    title="Export as PNG"
                >
                    📷
                </button>
                <button
                    className="p-2 rounded hover:bg-[#2d2d2d]"
                    onClick={exportAsSVG}
                    title="Export as SVG"
                >
                    📊
                </button>
            </div>

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                width={window.innerWidth}
                height={window.innerHeight}
                className="w-full h-full"
                onDragOver={handleCanvasDragOver}
                onDrop={handleCanvasDrop}
                style={{ cursor: isDraggingShape ? 'copy' : 'default' }}
            />

            {/* Shape Preview when Dragging */}
            {isDraggingShape && draggedShape && (
                <div
                    className="fixed pointer-events-none bg-white/10 border-2 border-white/30 rounded"
                    style={{
                        width: draggedShape === ShapeType.CIRCLE ? '80px' : '100px',
                        height: draggedShape === ShapeType.CIRCLE ? '80px' : '100px',
                        borderRadius: draggedShape === ShapeType.CIRCLE ? '50%' : '4px',
                        left: '0',
                        top: '0',
                        transform: `translate(${window.innerWidth / 2}px, ${window.innerHeight / 2}px)`
                    }}
                />
            )}
        </div>
    );
} 