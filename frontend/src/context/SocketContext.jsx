import { useEffect, useMemo } from 'react';
import { initSocket, connectSocket, disconnectSocket } from '../services/socket';
import { SocketContext } from './socket-context';

export const SocketProvider = ({ children }) => {
  const socket = useMemo(() => initSocket(), []);

  useEffect(() => {
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
