import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('user');
                const storedToken = await AsyncStorage.getItem('token');

                if (storedUser && storedToken && storedToken !== "null") {
                    setUser(JSON.parse(storedUser));
                    setToken(storedToken);
                }
            } catch (error) {
                }finally {
                    setLoading(false);
                }    
            };

            loadUserData();
        }, []);

        const login = async (userData, jwtToken) => {
            setUser(userData);
            setToken(jwtToken);

            await AsyncStorage.setItem('user', JSON.stringify(userData));
            await AsyncStorage.setItem('token', jwtToken);
        };

        const logout = async () => {
            setUser(null);
            setToken(null);
            await AsyncStorage.clear();
        };
        return (
            <AuthContext.Provider value={{user, token, loading, login, logout}}>
                {children}
            </AuthContext.Provider>
        );
    };
