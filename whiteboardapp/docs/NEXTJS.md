# Next.js Frontend Documentation

This document details the Next.js implementation in the Collaborative Whiteboard application, explaining the frontend architecture, components, and state management.

## Table of Contents
1. [Project Structure](#project-structure)
2. [Components](#components)
3. [Routing](#routing)
4. [State Management](#state-management)
5. [Performance Optimization](#performance-optimization)

## Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── room/
│       └── [id]/
│           └── page.tsx   # Room page
├── components/            # React components
│   ├── Whiteboard.tsx    # Main whiteboard
│   └── Chat.tsx          # Chat interface
├── lib/                   # Utilities and patterns
│   ├── patterns/         # Design pattern implementations
│   └── socket/           # Socket.IO integration
└── styles/               # Global styles
    └── globals.css       # TailwindCSS and global styles
```

## Components

### Whiteboard Component
```typescript
interface WhiteboardProps {
    socketClient: SocketClient;
    roomId: string;
}

export default function Whiteboard({ socketClient, roomId }: WhiteboardProps) {
    // Canvas refs and state
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    
    // Tool state
    const [tool, setTool] = useState<string>('pen');
    const [color, setColor] = useState<string>('#ffffff');
    const [thickness, setThickness] = useState<number>(2);

    // Drawing handlers
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        // Drawing logic
    };

    return (
        <div className="absolute inset-0 flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center p-2">
                {/* Tool controls */}
            </div>

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                // Other event handlers
            />
        </div>
    );
}
```

### Chat Component
```typescript
interface ChatProps {
    socketClient: SocketClient;
    roomId: string;
}

export default function Chat({ socketClient, roomId }: ChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');

    const sendMessage = () => {
        socketClient.sendMessage(input);
        setInput('');
    };

    return (
        <div className="flex flex-col h-full">
            {/* Message list */}
            <div className="flex-1 overflow-y-auto">
                {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                ))}
            </div>

            {/* Input area */}
            <div className="p-4">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
            </div>
        </div>
    );
}
```

## Routing

### App Router Configuration
```typescript
// app/layout.tsx
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="bg-[#121212] text-white">
                {children}
            </body>
        </html>
    );
}
```

### Dynamic Room Routes
```typescript
// app/room/[id]/page.tsx
export default function RoomPage({
    params: { id }
}: {
    params: { id: string }
}) {
    const socketClient = useSocketClient();

    return (
        <div className="flex h-screen">
            <Whiteboard socketClient={socketClient} roomId={id} />
            <Chat socketClient={socketClient} roomId={id} />
        </div>
    );
}
```

## State Management

### Socket Client Hook
```typescript
export function useSocketClient() {
    const [client, setClient] = useState<SocketClient | null>(null);

    useEffect(() => {
        const socketClient = new SocketClient();
        socketClient.connect();
        setClient(socketClient);

        return () => {
            socketClient.disconnect();
        };
    }, []);

    return client;
}
```

### Canvas State Hook
```typescript
export function useCanvasState(canvasRef: RefObject<HTMLCanvasElement>) {
    const saveState = useCallback(() => {
        if (!canvasRef.current) return;
        const imageData = canvasRef.current.toDataURL('image/png');
        return imageData;
    }, [canvasRef]);

    const loadState = useCallback((imageData: string) => {
        if (!canvasRef.current) return;
        const img = new Image();
        img.src = imageData;
        img.onload = () => {
            const context = canvasRef.current?.getContext('2d');
            context?.drawImage(img, 0, 0);
        };
    }, [canvasRef]);

    return { saveState, loadState };
}
```

## Performance Optimization

### Canvas Optimization
```typescript
function optimizeCanvas(canvas: HTMLCanvasElement) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Set actual size in memory
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Set visible size
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Scale context
    const context = canvas.getContext('2d');
    context?.scale(dpr, dpr);

    return context;
}
```

### Event Throttling
```typescript
import { throttle } from 'lodash';

const throttledDraw = throttle((e: MouseEvent) => {
    draw(e);
}, 16); // ~60fps
```

### Memoization
```typescript
const MemoizedToolbar = memo(function Toolbar({
    tool,
    setTool,
    color,
    setColor
}: ToolbarProps) {
    return (
        <div className="flex items-center">
            {/* Toolbar content */}
        </div>
    );
});
```

## Styling

### TailwindCSS Configuration
```javascript
// tailwind.config.js
module.exports = {
    content: [
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                background: '#121212',
                surface: '#1e1e1e',
                primary: '#4a9eff'
            }
        }
    }
};
```

### Global Styles
```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
    .btn {
        @apply px-4 py-2 rounded-lg transition-colors;
    }

    .btn-primary {
        @apply bg-primary hover:bg-primary/80;
    }
}
```

## Error Handling

### Error Boundary
```typescript
export class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return <ErrorFallback />;
        }
        return this.props.children;
    }
}
```

### Loading States
```typescript
export function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
        </div>
    );
}
```

## Testing

### Component Testing
```typescript
import { render, fireEvent } from '@testing-library/react';

describe('Whiteboard', () => {
    it('should handle drawing events', () => {
        const { getByRole } = render(<Whiteboard />);
        const canvas = getByRole('presentation');
        
        fireEvent.mouseDown(canvas);
        // Assert drawing state
    });
});
```

### Integration Testing
```typescript
describe('Room Page', () => {
    it('should connect to socket and join room', async () => {
        const { getByText } = render(<RoomPage params={{ id: 'test-room' }} />);
        
        await waitFor(() => {
            expect(getByText('Connected')).toBeInTheDocument();
        });
    });
});
```

## Deployment

### Environment Variables
```typescript
// .env.local
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Build Configuration
```javascript
// next.config.js
module.exports = {
    reactStrictMode: true,
    images: {
        domains: ['localhost'],
    },
    webpack: (config) => {
        // Custom webpack config
        return config;
    }
};
``` 