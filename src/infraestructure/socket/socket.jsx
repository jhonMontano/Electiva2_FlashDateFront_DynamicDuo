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
        // Obtener userId para autenticación
        const id = await getUserIdFromToken();
        setUserId(id);

        // Crear nueva instancia de socket
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

        // Eventos de conexión
        newSocket.on('connect', () => {
          console.log('🔌 Socket conectado:', newSocket.id);
          setIsConnected(true);
          
          // Registrar usuario en el servidor
          newSocket.emit('userOnline', { userId: id });
        });

        newSocket.on('disconnect', (reason) => {
          console.log('🔌 Socket desconectado:', reason);
          setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
          console.error('❌ Error de conexión socket:', error);
          setIsConnected(false);
        });

        newSocket.on('reconnect', (attemptNumber) => {
          console.log('🔄 Socket reconectado después de', attemptNumber, 'intentos');
          setIsConnected(true);
          
          // Re-registrar usuario después de reconexión
          if (id) {
            newSocket.emit('userOnline', { userId: id });
          }
        });

        newSocket.on('reconnect_error', (error) => {
          console.error('❌ Error de reconexión:', error);
        });

        setSocket(newSocket);

      } catch (error) {
        console.error('❌ Error inicializando socket:', error);
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
    throw new Error('useSocket debe estar dentro de un <SocketProvider>');
  }
  return context.socket;
};

export const useSocketConnection = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketConnection debe estar dentro de un <SocketProvider>');
  }
  return {
    socket: context.socket,
    isConnected: context.isConnected,
    userId: context.userId
  };
};