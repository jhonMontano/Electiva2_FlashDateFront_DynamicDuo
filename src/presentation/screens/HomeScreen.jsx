import React, { useContext } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { globalStyles } from '../../shared/globalStyles';
import { AuthContext } from '../../infraestructure/context/AuthContext';

export default function HomeScreen() {
  const { logout } = useContext(AuthContext);

  const handleLogout = async () => {
    try {
      await logout();
      console.log("Token removed. Redirecting to Login...");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>🏠 Home</Text>

      <TouchableOpacity style={globalStyles.button} onPress={handleLogout}>
        <Text style={globalStyles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
