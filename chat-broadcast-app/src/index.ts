import {WebSocketServer,WebSocket} from 'ws';
import express from 'express';
import http from 'http';

// Use the environment PORT when deployed (Render/Heroku assign a port).
const PORT = Number(process.env.PORT) || 8080;

// Configure allowed origins. You can set ALLOWED_ORIGINS env var as
// a comma-separated list (example: https://your-frontend.app,https://your-backend.app)
const DEFAULT_ALLOWED = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://chat-broadcast-app.onrender.com',
    // common FE deployment hostname on Render (add your real FE domain if different)
    'https://chat-broadcast-app-fe.onrender.com',
    'https://chat-broadcast.vercel.app',
];
const allowedOrigins = (process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
    : DEFAULT_ALLOWED);

const app = express();

// Simple CORS-like middleware for HTTP endpoints. Sets Access-Control-Allow-Origin
app.use((req, res, next) => {
    const origin = req.headers.origin as string | undefined;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    // quick respond to OPTIONS preflight
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

app.get('/health', (_req, res) => res.json({ ok: true }));

// Debug endpoint: show the current allowed origins and env var state
app.get('/debug/origins', (_req, res) => {
    res.json({
        allowedOrigins,
        envAllowedOrigins: process.env.ALLOWED_ORIGINS || null,
    });
});

// Create HTTP server and attach the Express app
const server = http.createServer(app);

const ws = new WebSocketServer({
    server,
    verifyClient: (info, done) => {
        const origin = info.origin;
        console.log('Incoming WebSocket origin:', origin);
        // Accept if origin is absent (non-browser client) or matches allowlist
        if (!origin || allowedOrigins.includes(origin)) {
            done(true);
        } else {
            console.warn('Rejected WebSocket origin:', origin);
            done(false);
        }
    },
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (HTTP+WebSocket)`);
});

interface User{
    socket:WebSocket;   
    roomId:string;
}


let allSockets:User[]=[];

//event handler 
ws.on("connection",(socket)=>{
    socket.on('message',(message)=>{
        console.log('Received raw message:', String(message));
        let parsedMessage: any = null;
        try {
            // messages are expected as JSON strings
            parsedMessage = JSON.parse(String(message));
        } catch (err) {
            // If not JSON, treat as raw chat message and broadcast to all clients
            console.log('Non-JSON message received, broadcasting raw string');
            const payload = { type: 'chat', payload: { message: String(message) } };
            for (let i = 0; i < allSockets.length; i++) {
                allSockets[i]?.socket.send(JSON.stringify(payload));
            }
            return;
        }

        console.log('Parsed message:', parsedMessage);

        if (parsedMessage.type === 'join') {
            allSockets.push({ socket: socket, roomId: parsedMessage.payload.roomId });
            console.log(`User joined room: ${parsedMessage.payload.roomId}`);
            return;
        }

        if (parsedMessage.type === 'chat') {
            let currentUserRoom: string | null = null;

            for (let i = 0; i < allSockets.length; i++) {
                if (allSockets[i]?.socket === socket) {
                    currentUserRoom = allSockets[i]?.roomId || null;
                }
            }

            console.log('Broadcasting chat to room:', currentUserRoom);

            const out = { type: 'chat', payload: { message: parsedMessage.payload.message, roomId: currentUserRoom } };

            for (let i = 0; i < allSockets.length; i++) {
                if (allSockets[i]?.roomId === currentUserRoom) {
                    allSockets[i]?.socket.send(JSON.stringify(out));
                }
            }
        }
    });

    // Clean up when a socket closes
    socket.on('close', () => {
        allSockets = allSockets.filter((u) => u.socket !== socket);
    });
});
