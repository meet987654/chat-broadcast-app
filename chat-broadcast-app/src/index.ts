import {WebSocketServer,WebSocket} from 'ws';
import http from 'http';

// Use the environment PORT when deployed (Render/Heroku assign a port).
const PORT = Number(process.env.PORT) || 8080;

// Create an HTTP server so the same port can handle HTTP + WebSocket upgrades
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server running');
});

const ws = new WebSocketServer({
    server,
    verifyClient: (info, done) => {
        console.log('Incoming origin:', info.origin);
        // In production you may want to validate info.origin against an allowlist
        done(true); // accept all origins for now
    },
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (websocket path on same port)`);
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