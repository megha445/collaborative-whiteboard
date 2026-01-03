import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import RoomCard from './RoomCard';
import { toast } from 'react-toastify';

const Home = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, name, users
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', type: 'public', password: '' });
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
    if (socket) {
      socket.connect();
    }
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('room-created', (room) => {
        console.log('New room created:', room);
        setRooms((prev) => {
          const exists = prev.some(r => r._id === room._id);
          if (exists) return prev;
          return [room, ...prev];
        });
        toast.success(`New room "${room.name}" created!`);
      });

      socket.on('room-deleted', (roomId) => {
        setRooms((prev) => prev.filter(room => room._id !== roomId));
        toast.info('A room was deleted');
      });

      socket.on('room-users-updated', ({ roomId, userCount }) => {
        setRooms((prev) =>
          prev.map((room) =>
            room._id === roomId ? { ...room, activeUserCount: userCount } : room
          )
        );
      });

      return () => {
        socket.off('room-created');
        socket.off('room-deleted');
        socket.off('room-users-updated');
      };
    }
  }, [socket]);

  // Filter and sort rooms
  useEffect(() => {
    let result = [...rooms];

    // Search filter
    if (searchQuery.trim()) {
      result = result.filter((room) =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.createdBy?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'users':
        result.sort((a, b) => (b.activeUserCount || 0) - (a.activeUserCount || 0));
        break;
      default:
        break;
    }

    setFilteredRooms(result);
  }, [rooms, searchQuery, sortBy]);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms');
      setRooms(response.data);
    } catch (error) {
      toast.error('Failed to fetch rooms');
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const roomData = {
        name: newRoom.name,
        type: newRoom.type,
        ...(newRoom.type === 'private' && { password: newRoom.password })
      };
      await api.post('/rooms/create', roomData);
      toast.success('Room created successfully!');
      setShowCreateModal(false);
      setNewRoom({ name: '', type: 'public', password: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🎨 Whiteboard Rooms</h1>
            <p className="text-gray-600">Welcome, <span className="font-semibold">{user?.name}</span>!</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              + Create Room
            </button>
            <button
              onClick={handleLogout}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Search rooms by name or creator..."
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="md:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="users">Most Active</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Available Rooms ({filteredRooms.length})
        </h2>
        {filteredRooms.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎨</div>
            <p className="text-gray-500 text-lg">
              {searchQuery ? 'No rooms match your search.' : 'No rooms available. Create one to get started!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <RoomCard 
              key={room._id} 
              room={room}
              onRoomDeleted={(roomId) => {
                setRooms(prev => prev.filter(r => r._id !== roomId));
              }}
            />
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Room</h2>
            <form onSubmit={handleCreateRoom}>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Room Name</label>
                <input
                  type="text"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter room name"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Room Type</label>
                <select
                  value={newRoom.type}
                  onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="public">🌍 Public</option>
                  <option value="private">🔒 Private</option>
                </select>
              </div>

              {newRoom.type === 'private' && (
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">Password</label>
                  <input
                    type="password"
                    value={newRoom.password}
                    onChange={(e) => setNewRoom({ ...newRoom, password: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter room password"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewRoom({ name: '', type: 'public', password: '' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;