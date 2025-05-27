import React from 'react';
import AppNavigator from './src/presentation/navigation/AppNavigator';
import { AuthProvider } from './src/infraestructure/context/AuthContext';
import { SocketProvider } from './src/infraestructure/socket/socket';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppNavigator />
      </SocketProvider>
    </AuthProvider>
  );
}
