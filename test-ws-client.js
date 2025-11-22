const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
    console.log('✓ Connected to server');
    
    // Send join message
    const joinMsg = JSON.stringify({ type: 'join', payload: { roomId: 'testroom' } });
    console.log('→ Sending join:', joinMsg);
    ws.send(joinMsg);
    
    // After 1 second, send a chat message
    setTimeout(() => {
        const chatMsg = JSON.stringify({ type: 'chat', payload: { message: 'Hello from test client!' } });
        console.log('→ Sending chat:', chatMsg);
        ws.send(chatMsg);
    }, 1000);
    
    // Close after 3 seconds
    setTimeout(() => {
        console.log('✓ Closing connection');
        ws.close();
    }, 3000);
});

ws.on('message', (data) => {
    console.log('← Received from server:', data);
});

ws.on('error', (err) => {
    console.error('✗ Error:', err.message);
});

ws.on('close', () => {
    console.log('✓ Disconnected');
    process.exit(0);
});
