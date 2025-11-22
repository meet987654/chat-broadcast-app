import { useEffect, useRef, useState } from 'react';

function App() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [roomId, setRoomId] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!hasJoined) return;

    const ws = new WebSocket('wss://chat-broadcast-app.onrender.com');
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      ws.send(JSON.stringify({ type: 'join', payload: { roomId } }));
    };

    ws.onmessage = (event) => {
      setMessages((prev) => [...prev, String(event.data)]);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      socketRef.current = null;
    };

    return () => {
      ws.close();
    };
  }, [hasJoined, roomId]);

  const joinRoom = () => {
    if (roomId.trim() === '') {
      alert('Please enter a room ID');
      return;
    }
    setHasJoined(true);
  };

  const sendMessage = () => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (input.trim() === '') return;

    ws.send(JSON.stringify({ type: 'chat', payload: { message: input } }));
    setInput('');
  };

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-2xl p-8 border border-gray-200">
            <h1 className="text-3xl font-bold text-black mb-2 text-center">
              Chat Room
            </h1>
            <p className="text-gray-600 text-center mb-6">
              Enter a room ID to join
            </p>
            <input
              type="text"
              className="w-full px-4 py-3 text-black bg-gray-50 border-2 border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-black transition"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Room ID"
              onKeyDown={(e) => {
                if (e.key === 'Enter') joinRoom();
              }}
            />
            <button
              className="w-full bg-black text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-800 transition"
              onClick={joinRoom}
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-black">Room: {roomId}</h2>
            <p className="text-sm text-gray-600">Active chat session</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No messages yet</p>
              <p className="text-gray-400 text-sm mt-1">Start the conversation!</p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200"
              >
                <p className="text-black break-words leading-relaxed">{m}</p>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t-2 border-gray-200 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            className="flex-1 px-4 py-3 text-black bg-gray-50 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black transition"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendMessage();
            }}
            placeholder="Type your message..."
          />
          <button
            className="px-8 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition"
            onClick={sendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;