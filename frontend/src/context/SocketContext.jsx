import { createContext, useContext, useEffect, useState } from 'react';
import { initSocket, connectSocket, disconnectSocket } from '../services/socket';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketInstance = initSocket();
    setSocket(socketInstance);

    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connectSocket, disconnectSocket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};