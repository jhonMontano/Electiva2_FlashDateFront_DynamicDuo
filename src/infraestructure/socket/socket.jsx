import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserIdFromToken } from '../../shared/decodeToken';

const SOCKET_URL = 'http://192.168.0.13:3000'; 


const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let newSocket = null;
    let reconnectTimeout = null;

    const initializeSocket = async () => {
      try {
        const id = await getUserIdFromToken();
        setUserId(id);

        newSocket = io(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          timeout: 20000,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          auth: {
            userId: id
          }
        });

        newSocket.on('connect', () => {
          setIsConnected(true);
          
          newSocket.emit('userOnline', { userId: id });
        });

        newSocket.on('disconnect', (reason) => {
          setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
          console.error('Error de conexión socket:', error);
          setIsConnected(false);
        });

        newSocket.on('reconnect', (attemptNumber) => {
          setIsConnected(true);
          
          if (id) {
            newSocket.emit('userOnline', { userId: id });
          }
        });

        newSocket.on('reconnect_error', (error) => {
          console.error('Error de reconexión:', error);
        });

        setSocket(newSocket);

      } catch (error) {
        console.error('Error inicializando socket:', error);
      }
    };

    initializeSocket();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, userId }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be inside a <SocketProvider>');
  }
  return context.socket;
};

export const useSocketConnection = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be inside a <SocketProvider>');
  }
  return {
    socket: context.socket,
    isConnected: context.isConnected,
    userId: context.userId
  };
};