import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Toolbar from './Toolbar';
import OnlineUsers from './OnlineUsers';
import { toast } from 'react-toastify';

const CANVAS_HEIGHT = 600;

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedTool, setSelectedTool] = useState('pen');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showCursor, setShowCursor] = useState(false);
  const [otherCursors, setOtherCursors] = useState({});
  const lastPointRef = useRef(null);
  const hasJoinedRef = useRef(false);
  const lastEmitTime = useRef(0);
  const cursorFrameRef = useRef(null);
  const pendingCursorPositionRef = useRef(null);
  const { roomId } = useParams();
  const { token, user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  function drawLine(ctx, from, to, color, tool, size = 2) {
    ctx.strokeStyle = color;
    ctx.lineWidth = tool === 'eraser' ? size : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = CANVAS_HEIGHT;
  }, []);

  useEffect(() => {
    if (!socket || !roomId || hasJoinedRef.current) return;

    hasJoinedRef.current = true;
    socket.connect();
    
    const joinTimer = setTimeout(() => {
      socket.emit('join-room', { roomId, token });
    }, 100);

    socket.on('canvas-state', (canvasData) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvasData.forEach((lineSegment) => {
        if (lineSegment.from && lineSegment.to) {
          drawLine(ctx, lineSegment.from, lineSegment.to, lineSegment.color, lineSegment.tool, lineSegment.size || 2);
        }
      });
    });

    socket.on('drawing', (data) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      drawLine(ctx, data.from, data.to, data.color, data.tool, data.size || 2);
    });

    socket.on('canvas-cleared', () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    socket.on('room-users', (users) => {
      setOnlineUsers(users);
    });

    socket.on('user-joined', ({ userName }) => {
      toast.info(`${userName} joined`, { position: 'bottom-right', autoClose: 2000 });
    });

    socket.on('user-left', ({ userId, userName }) => {
      toast.warning(`${userName} left`, { position: 'bottom-right', autoClose: 2000 });
      setOtherCursors(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    });

    socket.on('cursor-position', ({ userId, userName, x, y }) => {
      const canvasWidth = canvasRef.current?.width || 1;

      setOtherCursors(prev => ({
        ...prev,
        [userId]: {
          left: (x / canvasWidth) * 100,
          top: (y / CANVAS_HEIGHT) * 100,
          userName
        }
      }));
    });

    socket.on('cursor-hidden', ({ userId }) => {
      setOtherCursors(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    });

    socket.on('error', (error) => {
      toast.error(error.message);
    });

    return () => {
      clearTimeout(joinTimer);
      socket.emit('cursor-hide', { roomId });
      socket.emit('leave-room', { roomId });
      socket.off('canvas-state');
      socket.off('drawing');
      socket.off('canvas-cleared');
      socket.off('room-users');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('cursor-position');
      socket.off('cursor-hidden');
      socket.off('error');
      cancelAnimationFrame(cursorFrameRef.current);
      cursorFrameRef.current = null;
      hasJoinedRef.current = false;
    };
  }, [socket, roomId, token]);

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    return { x, y };
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const coords = getCanvasCoordinates(e);
    lastPointRef.current = coords;
  };

  const updateCursorPosition = (coords) => {
    const canvasWidth = canvasRef.current?.width || 1;

    pendingCursorPositionRef.current = {
      ...coords,
      left: (coords.x / canvasWidth) * 100,
      top: (coords.y / CANVAS_HEIGHT) * 100
    };

    if (cursorFrameRef.current) return;

    cursorFrameRef.current = requestAnimationFrame(() => {
      setCursorPosition(pendingCursorPositionRef.current);
      cursorFrameRef.current = null;
    });
  };

  const draw = (e) => {
    const coords = getCanvasCoordinates(e);
    updateCursorPosition(coords);

    // Emit cursor position at 60fps (every ~16ms)
    const now = Date.now();
    if (now - lastEmitTime.current > 16) {
      socket.emit('cursor-move', { roomId, x: coords.x, y: coords.y });
      lastEmitTime.current = now;
    }

    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const from = lastPointRef.current;
    const to = coords;

    drawLine(ctx, from, to, selectedColor, selectedTool, brushSize);

    socket.emit('draw', {
      roomId,
      from,
      to,
      color: selectedColor,
      tool: selectedTool,
      size: brushSize
    });

    lastPointRef.current = to;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const handleMouseEnter = () => {
    setShowCursor(true);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    
    // Create a temporary canvas with white background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Fill with white background
    tempCtx.fillStyle = '#FFFFFF';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Draw the original canvas on top
    tempCtx.drawImage(canvas, 0, 0);
    
    // Convert to image and download
    tempCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `whiteboard-${Date.now()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Canvas downloaded!');
    }, 'image/png');
  };

  const handleMouseLeave = () => {
    setShowCursor(false);
    socket.emit('cursor-hide', { roomId });
    stopDrawing();
  };

  const handleClear = () => {
    socket.emit('clear-canvas', { roomId });
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">🎨 Collaborative Whiteboard</h1>
        <button
          onClick={() => navigate('/home')}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
        >
          ← Back to Home
        </button>
      </div>

      <div className="flex p-6 gap-6">
        <div className="flex-1 flex flex-col gap-4">
          <Toolbar
            selectedTool={selectedTool}
            setSelectedTool={setSelectedTool}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            onClear={handleClear}
            onDownload={handleDownload}
          />
          
          <div className="relative">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={handleMouseLeave}
              onMouseEnter={handleMouseEnter}
              className="bg-white rounded-xl shadow-lg w-full"
              style={{ height: '600px', cursor: 'none' }}
            />
            
            {/* Your Cursor */}
            {showCursor && (
              <div
                className="absolute pointer-events-none z-10 transition-transform duration-75"
                style={{
                  left: `${cursorPosition.left || 0}%`,
                  top: `${cursorPosition.top || 0}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div
                  className={`rounded-full border-2 ${
                    selectedTool === 'pen' ? 'border-blue-500' : 'border-red-500'
                  }`}
                  style={{
                    width: `${selectedTool === 'eraser' ? brushSize : Math.max(8, brushSize * 2)}px`,
                    height: `${selectedTool === 'eraser' ? brushSize : Math.max(8, brushSize * 2)}px`,
                    backgroundColor: selectedTool === 'pen' 
                      ? `${selectedColor}40` 
                      : 'rgba(255, 0, 0, 0.2)'
                  }}
                />
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold whitespace-nowrap shadow-lg">
                  {user?.name} (You)
                </div>
              </div>
            )}

            {/* Other Users' Cursors */}
            {Object.entries(otherCursors).map(([userId, cursor]) => (
              <div
                key={userId}
                className="absolute pointer-events-none z-10 transition-transform duration-75"
                style={{
                  left: `${cursor.left}%`,
                  top: `${cursor.top}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div
                  className="rounded-full border-2 border-green-500"
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: 'rgba(34, 197, 94, 0.5)'
                  }}
                />
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold whitespace-nowrap shadow-lg">
                  {cursor.userName}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-72">
          <OnlineUsers users={onlineUsers} />
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;
