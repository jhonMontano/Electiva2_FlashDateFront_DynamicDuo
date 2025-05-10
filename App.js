import React from 'react';
import AppNavigator from './src/presentation/navigation/AppNavigator'; 
import { AuthProvider } from './src/infraestructure/context/AuthContext';

export default function App() {
  return (
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
  );
}
