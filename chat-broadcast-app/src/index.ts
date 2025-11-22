import {WebSocketServer,WebSocket} from 'ws';

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