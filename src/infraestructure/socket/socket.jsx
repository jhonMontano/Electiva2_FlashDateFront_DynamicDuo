import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000'; 

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
    });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const socket = useContext(SocketContext);
  if (!socket) {
    throw new Error('useSocket debe estar dentro de un <SocketProvider>');
  }
  return socket;
};

export const getSocket = () => {
  const socket = useContext(SocketContext);
  if (!socket) {
    throw new Error('getSocket debe usarse dentro de un <SocketProvider>');
  }
  return socket;
};
