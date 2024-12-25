# WebAssembly Whiteboard Application

A real-time drawing whiteboard application that combines the performance of C++ (compiled to WebAssembly) with the modern web interface capabilities of Next.js and TypeScript.

## Overview

This application demonstrates how to build a high-performance drawing application by:
1. Implementing core drawing logic in C++
2. Compiling it to WebAssembly for browser execution
3. Creating a TypeScript wrapper for the WebAssembly module
4. Building a modern UI with Next.js and React

## Features

- Drawing Tools:
  - Freehand drawing with adjustable thickness
  - Shape tools (Rectangle, Circle)
  - Color picker for stroke colors
  - Eraser tool
- Selection Tools:
  - Select and move drawn elements
  - Delete selected elements
  - Multi-select support
- Touch Support:
  - Works on mobile devices
  - Responsive design
  - Multi-touch gestures

## Project Structure Explained

```
whiteboardapp/
├── src/                      # Source code directory
│   ├── wasm/                # WebAssembly C++ implementation
│   │   └── whiteboard.cpp   # Core drawing logic in C++
│   ├── lib/                 # TypeScript libraries
│   │   └── whiteboard.ts    # TypeScript wrapper for WASM
│   ├── components/          # React components
│   │   └── Whiteboard.tsx   # Main whiteboard component
│   └── app/                 # Next.js app directory
│       └── page.tsx         # Main page component
├── include/                 # C++ header files
│   └── wasm/
│       └── whiteboard.hpp   # C++ class definitions
├── public/                  # Public assets
│   └── wasm/               # Compiled WebAssembly files
├── CMakeLists.txt          # CMake build configuration
├── build.sh                # Build script for WASM
└── next.config.js          # Next.js configuration
```

## Technology Stack Explained

### 1. WebAssembly (C++) Layer
- Location: `src/wasm/` and `include/wasm/`
- Purpose: High-performance drawing operations
- Key Files:
  - `whiteboard.hpp`: Defines the class structure and interfaces
  - `whiteboard.cpp`: Implements the drawing logic
- Features:
  - Shape rendering
  - Selection handling
  - State management

### 2. TypeScript Wrapper Layer
- Location: `src/lib/`
- Purpose: Bridge between WebAssembly and React
- Key Files:
  - `whiteboard.ts`: Provides TypeScript interface to WASM
- Features:
  - Event handling
  - Canvas management
  - Type safety

### 3. React/Next.js Layer
- Location: `src/components/` and `src/app/`
- Purpose: User interface and interactions
- Key Files:
  - `Whiteboard.tsx`: Main React component
  - `page.tsx`: Next.js page component
- Features:
  - Tool selection
  - Color/thickness controls
  - Responsive layout

## Setup and Installation

### Prerequisites
1. Install Emscripten SDK (emsdk):
   ```bash
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ./emsdk install latest
   ./emsdk activate latest
   source ./emsdk_env.sh
   ```

2. Install Node.js (v16 or higher):
   ```bash
   # Using nvm (recommended)
   nvm install 16
   nvm use 16
   ```

3. Install CMake (v3.10 or higher):
   ```bash
   # macOS
   brew install cmake

   # Ubuntu
   sudo apt-get install cmake
   ```

### Building the Project

1. Install Node.js dependencies:
   ```bash
   cd whiteboardapp
   npm install
   ```

2. Build the WebAssembly module:
   ```bash
   bash build.sh
   ```
   This script:
   - Configures CMake for Emscripten
   - Compiles C++ to WebAssembly
   - Copies built files to public directory

3. Start the development server:
   ```bash
   npm run dev
   ```

## Implementation Details

### C++ Core (WebAssembly)
The C++ implementation provides:
- Class hierarchy for different shapes
- Selection and transformation logic
- Efficient drawing algorithms

Key concepts:
```cpp
class DrawableElement {
    // Base class for all drawable elements
    virtual void draw(emscripten::val context) = 0;
    virtual bool containsPoint(float x, float y) = 0;
    virtual void move(float dx, float dy) = 0;
};
```

### TypeScript Wrapper
The wrapper manages:
- WebAssembly module loading
- Canvas interaction
- Event handling

Key concepts:
```typescript
export class WhiteboardWrapper {
    // Manages WebAssembly interaction and canvas state
    private module: WhiteboardModule | null = null;
    private whiteboard: Whiteboard | null = null;
    // ... event handlers and drawing logic
}
```

### React Component
The React component handles:
- User interface
- Tool selection
- State management

Key concepts:
```typescript
export default function Whiteboard() {
    // Manages UI state and tool selection
    const [currentTool, setCurrentTool] = useState<'draw' | 'select' | 'erase'>('draw');
    const [currentShape, setCurrentShape] = useState<ShapeType>(ShapeType.FREEHAND);
    // ... UI rendering and event handling
}
```

## Build System Explained

### CMake Configuration
- Purpose: Configure C++ compilation to WebAssembly
- Key flags:
  - `WASM=1`: Enable WebAssembly output
  - `MODULARIZE=1`: Create modular JS wrapper
  - `EXPORT_ES6=1`: Enable ES6 module support

### Next.js Configuration
- Purpose: Configure webpack for WebAssembly
- Key settings:
  - WebAssembly loading support
  - Module resolution
  - MIME type handling

## Usage Guide

1. Drawing:
   - Select 'Draw' tool
   - Choose shape type (Freehand, Rectangle, Circle)
   - Set color and thickness
   - Draw on canvas

2. Selection:
   - Select 'Select' tool
   - Click and drag to select elements
   - Move selected elements
   - Delete with Delete button

3. Eraser:
   - Select 'Erase' tool
   - Click and drag to erase

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Troubleshooting

Common issues and solutions:
1. WebAssembly compilation errors:
   - Ensure Emscripten is properly installed
   - Check CMake configuration
   - Verify C++ compiler compatibility

2. Next.js integration issues:
   - Check WebAssembly file paths
   - Verify webpack configuration
   - Check browser console for errors

## License

MIT License - See LICENSE file for details
