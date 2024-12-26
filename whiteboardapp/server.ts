import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { SocketServer } from './src/lib/socket/server';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// Prepare Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    // Create HTTP server
    const server = createServer(async (req, res) => {
        try {
            // Parse URL
            const parsedUrl = parse(req.url!, true);
            
            // Let Next.js handle the request
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling request:', err);
            res.statusCode = 500;
            res.end('Internal server error');
        }
    });

    // Initialize Socket.IO server
    new SocketServer(server);

    // Start server
    server.listen(port, () => {
        console.log(
            `> Server listening at http://${hostname}:${port} as ${
                dev ? 'development' : process.env.NODE_ENV
            }`
        );
    });
}); 