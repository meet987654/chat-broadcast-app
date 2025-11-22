import { WebSocketServer, WebSocket } from 'ws';
import express from 'express';
import http from 'http';

const PORT = Number(process.env.PORT) || 8080;

const DEFAULT_ALLOWED = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://chat-broadcast-app.onrender.com',
    'https://chat-broadcast-app-fe.onrender.com',
    'https://chat-broadcast.vercel.app',
];

const allowedOrigins = (process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
    : DEFAULT_ALLOWED);

const app = express();

app.use((req, res, next) => {
    const origin = req.headers.origin as string | undefined;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/debug/origins', (_req, res) => {
    res.json({
        allowedOrigins,
        envAllowedOrigins: process.env.ALLOWED_ORIGINS || null,
    });
});

const server = http.createServer(app);

// WebSocket Server (NO server: option)
const ws = new WebSocketServer({ noServer: true });

// ⭐ Render requires this ⭐
server.on('upgrade', (req, socket, head) => {
    ws.handleUpgrade(req, socket, head, (socket) => {
        ws.emit('connection', socket, req as any);
    });
});

// WebSocket connection handler
interface User {
    socket: WebSocket;
    roomId: string;
}

let allSockets: User[] = [];

ws.on('connection', (socket) => {
    socket.on('message', (message) => {
        console.log('Received raw message:', String(message));
        let parsedMessage: any = null;

        try {
            parsedMessage = JSON.parse(String(message));
        } catch {
            const payload = { type: 'chat', payload: { message: String(message) } };
            allSockets.forEach((u) => u.socket.send(JSON.stringify(payload)));
            return;
        }

        if (parsedMessage.type === 'join') {
            allSockets.push({ socket, roomId: parsedMessage.payload.roomId });
            console.log(`User joined room: ${parsedMessage.payload.roomId}`);
            return;
        }

        if (parsedMessage.type === 'chat') {
            const currentRoom = allSockets.find((u) => u.socket === socket)?.roomId;
            const out = { type: 'chat', payload: { message: parsedMessage.payload.message, roomId: currentRoom } };

            allSockets
                .filter((u) => u.roomId === currentRoom)
                .forEach((u) => u.socket.send(JSON.stringify(out)));
        }
    });

    socket.on('close', () => {
        allSockets = allSockets.filter((u) => u.socket !== socket);
    });
});

// Keepalive ping: Render may close idle connections, so ping every 30s
setInterval(() => {
    ws.clients.forEach((client) => {
        // readyState 1 === OPEN
        if ((client as any).readyState === WebSocket.OPEN) {
            try {
                client.ping();
            } catch (e) {
                // swallow ping errors; .close handler will clean up
            }
        }
    });
}, 30000);

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
