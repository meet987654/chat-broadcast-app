import { WebSocketServer, WebSocket } from 'ws';
// Use fixed port 8080 for local dev (no env variable per request)
const PORT = 8080;
const ws = new WebSocketServer({
    port: PORT,
    verifyClient: (info, done) => {
        console.log('Incoming origin:', info.origin);
        done(true); // accept all origins
    },
});
console.log(`WebSocket server listening on ws://localhost:${PORT}`);
let allSockets = [];
//event handler 
ws.on("connection", (socket) => {
    socket.on('message', (message) => {
        let parsedMessage = null;
        try {
            // messages are expected as JSON strings
            // some clients may send plain text; handle gracefully
            parsedMessage = JSON.parse(String(message));
        }
        catch (err) {
            // If not JSON, treat as raw chat message and broadcast to all
            for (let i = 0; i < allSockets.length; i++) {
                allSockets[i]?.socket.send(String(message));
            }
            return;
        }
        if (parsedMessage.type === "join") {
            allSockets.push({ socket: socket, roomId: parsedMessage.payload.roomId });
            console.log(`User joined room: ${parsedMessage.payload.roomId}`);
            return;
        }
        if (parsedMessage.type === "chat") {
            let currentUserRoom = null;
            for (let i = 0; i < allSockets.length; i++) {
                if (allSockets[i]?.socket === socket) {
                    currentUserRoom = allSockets[i]?.roomId;
                }
            }
            for (let i = 0; i < allSockets.length; i++) {
                if (allSockets[i]?.roomId === currentUserRoom) {
                    allSockets[i]?.socket.send(parsedMessage.payload.message);
                }
            }
        }
    });
    // Clean up when a socket closes
    socket.on('close', () => {
        allSockets = allSockets.filter((u) => u.socket !== socket);
    });
});
//# sourceMappingURL=index.js.map