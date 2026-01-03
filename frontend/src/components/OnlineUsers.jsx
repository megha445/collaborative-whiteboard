const OnlineUsers = ({ users }) => {
    return (
      <div className="bg-white shadow-lg rounded-lg p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-3">👥 Online Users ({users.length})</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {users.map((user) => (
            <div key={user._id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-semibold text-sm text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default OnlineUsers;