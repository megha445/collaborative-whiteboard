import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const RoomCard = ({ room, onRoomDeleted }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isCreator = user?.id === room.createdBy?._id;

  const handleJoinRoom = async () => {
    if (room.type === 'private') {
      setShowPasswordModal(true);
      return;
    }
    navigate(`/whiteboard/${room._id}`);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/rooms/join', { roomId: room._id, password });
      navigate(`/whiteboard/${room._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async () => {
    setLoading(true);
    try {
      await api.delete(`/rooms/${room._id}`);
      toast.success('Room deleted successfully!');
      setShowDeleteModal(false);
      if (onRoomDeleted) {
        onRoomDeleted(room._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition p-6 border-2 border-gray-100 hover:border-blue-400">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{room.name}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  room.type === 'public'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                }`}
              >
                {room.type === 'public' ? '🌍 Public' : '🔒 Private'}
              </span>
              <span className="text-sm text-gray-500">
                👥 {room.activeUserCount || 0} online
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Created by <span className="font-semibold">{room.createdBy?.name}</span>
        </p>

        <div className="flex gap-2">
          <button
            onClick={handleJoinRoom}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Join Room
          </button>
          
          {isCreator && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition"
              title="Delete Room"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Enter Password</h3>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                placeholder="Room password"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPassword('');
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
                  {loading ? 'Joining...' : 'Join'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Delete Room?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "<span className="font-semibold">{room.name}</span>"? 
              This action cannot be undone and all canvas data will be lost.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRoom}
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RoomCard;