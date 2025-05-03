import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AuthContext } from "../../infraestructure/context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator(){
    const { user } = useContext(AuthContext);

    return (
        <NavigationContainer>
            <Stack.Navigator>
                {user ? (
                    <Stack.Screen name="Home" component={HomeScreen}/>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen}/>
                        <Stack.Screen name="Register" component={RegisterScreen}/>
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}