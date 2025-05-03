import React from "react";
import { AuthProvider } from "./src/infraestructure/context/AuthContext";
import AppNavidator from "./src/presentation/navigation/AppNavigator";

export default function App() {
  return (
    <AuthProvider>
      <AppNavidator/>
    </AuthProvider>
  );
}