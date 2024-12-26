# WebAssembly Whiteboard Application

A modern, high-performance whiteboard application built with WebAssembly, React, and TypeScript.

## Features

### Drawing Tools
- Freehand drawing with adjustable thickness
- Shape tools (Rectangle, Circle)
- Selection tool for moving and deleting elements
- Eraser tool with adjustable size

### Color Management
- Smart dark/light mode detection and switching
- Automatic color adaptation for better visibility
- Custom color picker with persistence
- Default colors optimized for each mode

### Export Options
- PNG export with background
- SVG export with preserved vectors
- Maintains dark/light mode in exports

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **UI Framework**: TailwindCSS
- **WebAssembly**: C++ compiled with Emscripten
- **Build System**: CMake
- **Development**: Next.js

## Architecture

The application follows these design patterns and principles:

### State Management
- **Observer Pattern**: For canvas updates and tool state changes
- **Command Pattern**: For undo/redo operations
- **State Pattern**: For tool mode management
- **Strategy Pattern**: For different drawing algorithms

### Color System
- **State Machine**: For color mode transitions
- **Observer Pattern**: For color state synchronization
- **Factory Pattern**: For color scheme generation

### Component Structure
```
src/
├── components/
│   └── Whiteboard.tsx       # Main UI component
├── lib/
│   └── whiteboard.ts        # TypeScript wrapper
└── wasm/
    ├── whiteboard.cpp       # Core C++ implementation
    └── whiteboard.hpp       # C++ header file
```

## Setup and Installation

1. Install dependencies:
```bash
npm install
```

2. Build WebAssembly module:
```bash
bash run.sh
```

3. Start development server:
```bash
npm run dev
```

## Development

### Code Organization
- **UI Components**: React components with TypeScript
- **WebAssembly Core**: C++ implementation of drawing algorithms
- **Bridge Layer**: TypeScript wrapper for WebAssembly module

### Design Principles
1. **Separation of Concerns**
   - UI logic in React components
   - Drawing logic in WebAssembly
   - State management in TypeScript

2. **Type Safety**
   - Strong typing throughout
   - Interface-driven development
   - Runtime type checking

3. **Performance**
   - WebAssembly for computations
   - Efficient canvas operations
   - Optimized state updates

## Documentation

- [Algorithms Documentation](./ALGORITHMS.md)
- [API Reference](./API.md)
- [Contributing Guide](./CONTRIBUTING.md)

## Performance Considerations

- WebAssembly for compute-intensive operations
- Canvas optimization techniques
- Efficient state management
- Memory pooling for drawing operations

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers with WebAssembly support

## License

MIT License - see [LICENSE](./LICENSE) for details
