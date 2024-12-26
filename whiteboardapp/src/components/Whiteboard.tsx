/**
 * @file Whiteboard.tsx
 * @brief Whiteboard component with real-time drawing capabilities
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { SocketClient } from '@/lib/socket/client';
import { DrawEventData } from '@/lib/socket/events';
import { Tool, ToolFactory, DrawOptions } from '@/lib/patterns/tools';
import { CommandInvoker, DrawCommand, ClearCommand } from '@/lib/patterns/commands';
import { CanvasStateSync } from '@/lib/patterns/canvasState';

interface WhiteboardProps {
    socketClient: SocketClient;
    roomId: string;
}

export default function Whiteboard({ socketClient, roomId }: WhiteboardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const commandInvokerRef = useRef<CommandInvoker>(new CommandInvoker());
    const canvasStateSyncRef = useRef<CanvasStateSync | null>(null);
    const currentToolRef = useRef<Tool>(ToolFactory.getTool('pen'));

    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<string>('pen');
    const [color, setColor] = useState<string>('#ffffff');
    const [thickness, setThickness] = useState<number>(2);

    const initializeCanvas = () => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return;

        // Set actual size in memory (scaled to account for extra pixel density)
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement?.getBoundingClientRect();
        if (!rect) return;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        // Set visible size
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        // Scale context to match device pixel ratio
        context.scale(dpr, dpr);
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = color;
        context.lineWidth = thickness;

        // Fill background only if it's the first initialization
        if (!contextRef.current) {
            context.fillStyle = '#1e1e1e';
            context.fillRect(0, 0, canvas.width, canvas.height);
        }

        contextRef.current = context;
    };

    useEffect(() => {
        initializeCanvas();
        window.addEventListener('resize', initializeCanvas);

        // Initialize canvas state sync
        canvasStateSyncRef.current = new CanvasStateSync(socketClient);

        // Set up socket event listeners
        socketClient.onDrawStart((data: DrawEventData) => {
            if (!contextRef.current) return;
            const tool = ToolFactory.getTool(data.tool);
            tool.begin(contextRef.current, data.x, data.y, {
                color: data.color,
                thickness: data.thickness
            });
        });

        socketClient.onDrawMove((data: DrawEventData) => {
            if (!contextRef.current) return;
            const tool = ToolFactory.getTool(data.tool);
            tool.move(contextRef.current, data.x, data.y, {
                color: data.color,
                thickness: data.thickness
            });
        });

        socketClient.onDrawEnd(() => {
            if (!contextRef.current) return;
            currentToolRef.current.end(contextRef.current);
            saveCanvasState();
        });

        socketClient.onClear(() => {
            if (!contextRef.current || !canvasRef.current) return;
            const clearCommand = new ClearCommand(contextRef.current);
            commandInvokerRef.current.execute(clearCommand);
            saveCanvasState();
        });

        return () => {
            window.removeEventListener('resize', initializeCanvas);
            canvasStateSyncRef.current?.cleanup();
            socketClient.removeAllListeners();
        };
    }, [socketClient]);

    useEffect(() => {
        currentToolRef.current = ToolFactory.getTool(tool);
    }, [tool]);

    const saveCanvasState = () => {
        if (!canvasRef.current || !canvasStateSyncRef.current) return;
        canvasStateSyncRef.current.saveState(canvasRef.current);
    };

    const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): [number, number] => {
        const canvas = canvasRef.current;
        if (!canvas) return [0, 0];
        
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        return [
            (e.clientX - rect.left) * (canvas.width / (rect.width * dpr)),
            (e.clientY - rect.top) * (canvas.height / (rect.height * dpr))
        ];
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!contextRef.current) return;

        const [x, y] = getCoordinates(e);
        const options: DrawOptions = { color, thickness };

        currentToolRef.current.begin(contextRef.current, x, y, options);
        setIsDrawing(true);

        socketClient.startDrawing({
            userId: socketClient.id,
            x,
            y,
            color,
            thickness,
            tool
        });
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !contextRef.current) return;

        const [x, y] = getCoordinates(e);
        const options: DrawOptions = { color, thickness };

        const drawCommand = new DrawCommand(
            contextRef.current,
            currentToolRef.current,
            x,
            y,
            options
        );
        commandInvokerRef.current.execute(drawCommand);

        socketClient.continueDrawing({
            userId: socketClient.id,
            x,
            y,
            color,
            thickness,
            tool
        });
    };

    const stopDrawing = () => {
        if (!contextRef.current) return;
        currentToolRef.current.end(contextRef.current);
        setIsDrawing(false);

        socketClient.endDrawing({
            userId: socketClient.id,
            x: 0,
            y: 0,
            color,
            thickness,
            tool
        });
        
        saveCanvasState();
    };

    const clearCanvas = () => {
        if (!contextRef.current || !canvasRef.current) return;
        const clearCommand = new ClearCommand(contextRef.current);
        commandInvokerRef.current.execute(clearCommand);
        socketClient.clearCanvas();
        saveCanvasState();
    };

    const handleUndo = () => {
        commandInvokerRef.current.undo();
        saveCanvasState();
    };

    const handleRedo = () => {
        commandInvokerRef.current.redo();
        saveCanvasState();
    };

    return (
        <div className="absolute inset-0 flex flex-col bg-[#121212]">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between p-2 bg-[#1e1e1e] border-b border-[#2d2d2d]">
                <div className="flex items-center gap-2">
                    {/* Drawing Tools */}
                    <div className="flex items-center bg-[#2d2d2d] p-1.5 rounded-lg shadow-lg">
                        <select
                            value={tool}
                            onChange={(e) => setTool(e.target.value)}
                            className="bg-[#2d2d2d] text-[#efefef] border-none outline-none cursor-pointer"
                        >
                            {ToolFactory.getAvailableTools().map(toolName => (
                                <option key={toolName} value={toolName}>
                                    {toolName.charAt(0).toUpperCase() + toolName.slice(1)}
                                </option>
                            ))}
                        </select>
                        <div className="mx-2 h-6 w-px bg-[#404040]" />
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                            title="Color picker"
                        />
                        <div className="mx-2 h-6 w-px bg-[#404040]" />
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={thickness}
                            onChange={(e) => setThickness(parseInt(e.target.value))}
                            className="w-32 accent-[#4a9eff]"
                            title="Brush size"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleUndo}
                            className="px-3 py-1.5 bg-[#2d2d2d] text-[#efefef] rounded-lg hover:bg-[#404040] transition-colors shadow-lg"
                            title="Undo"
                        >
                            Undo
                        </button>
                        <button
                            onClick={handleRedo}
                            className="px-3 py-1.5 bg-[#2d2d2d] text-[#efefef] rounded-lg hover:bg-[#404040] transition-colors shadow-lg"
                            title="Redo"
                        >
                            Redo
                        </button>
                        <button
                            onClick={clearCanvas}
                            className="px-3 py-1.5 bg-[#2d2d2d] text-[#efefef] rounded-lg hover:bg-[#404040] transition-colors shadow-lg"
                            title="Clear canvas"
                        >
                            Clear
                        </button>
                    </div>
                </div>

                {/* Room Info */}
                <div className="text-[#efefef] text-sm">
                    Room: {roomId}
                </div>
            </div>

            {/* Canvas Container */}
            <div className="flex-1 relative bg-[#1e1e1e]">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                />
            </div>
        </div>
    );
} 