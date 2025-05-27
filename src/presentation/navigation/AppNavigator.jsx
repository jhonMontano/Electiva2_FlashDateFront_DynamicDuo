import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AuthContext } from "../../infraestructure/context/AuthContext";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";

// Importa el BottomTabsNavigator completo (el que tiene Home y Notifications)
import BottomTabsNavigator from "./BottomTabsNavigator"; // Asegúrate de que la ruta sea correcta

const Stack = createNativeStackNavigator();

// Navegación principal (Login/Register o App principal)
export default function AppNavigator() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Usuario autenticado -> app con tabs siempre visibles
          <Stack.Screen name="MainApp" component={BottomTabsNavigator} />
        ) : (
          // No autenticado -> Login y Registro
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}