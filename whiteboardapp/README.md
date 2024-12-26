# Collaborative Whiteboard Application

A real-time collaborative whiteboard application built with Next.js, Socket.IO, and TypeScript. The application allows multiple users to draw together in real-time, chat, and share the same whiteboard space.

## Documentation

This project is split into several key components, each with its own detailed documentation:

- [Next.js Frontend Documentation](./docs/NEXTJS.md) - Details about the React components, state management, and UI implementation
- [Socket.IO Documentation](./docs/SOCKET.md) - Information about real-time communication, event system, and state synchronization
- [Design Patterns Documentation](./docs/PATTERNS.md) - Explanation of the design patterns used and code architecture
- [WebAssembly Documentation](./docs/WASM.md) - Details about WebAssembly integration for high-performance drawing
- [Full Stack Integration Guide](./docs/INTEGRATION.md) - Comprehensive guide on how Next.js, Socket.IO, and WebAssembly work together

## Quick Start

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Install dependencies:
   ```bash
   cd whiteboardapp
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- Real-time collaborative drawing
- Persistent canvas state across sessions
- Live chat functionality
- Room-based collaboration
- Multi-user support
- Responsive design
- Dark mode UI
- Undo/Redo functionality
- Multiple drawing tools
- Canvas state synchronization

## Technology Stack

- **Frontend**:
  - Next.js 14
  - React 18
  - TypeScript
  - TailwindCSS

- **Backend**:
  - Socket.IO Server
  - Custom Server Integration

## Project Structure

```
src/
├── components/          # React components
├── lib/
│   ├── patterns/       # Design pattern implementations
│   └── socket/         # Socket.IO related code
└── app/                # Next.js app router pages
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - feel free to use this project for any purpose.

## Acknowledgments

- Built with Next.js
- Inspired by Excalidraw
- Uses Socket.IO for real-time communication
