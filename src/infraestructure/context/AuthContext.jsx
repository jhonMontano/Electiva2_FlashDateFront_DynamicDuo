import { createContext, useState } from "react";
import * as SecureStore from "expo-secure-store";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const login = (userData) => {
        setUser(userData);
        SecureStore.setItemAsync("token", userData.token);
    };

    const logout = async () => {
        setUser(null);
        await SecureStore.deleteItemAsync("token");
    };

    return (
        <AuthContext.Provider value={{user, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
};
