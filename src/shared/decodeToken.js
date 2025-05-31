import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getUserIdFromToken = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return null;
    try {
        const decode = jwtDecode(token);
        return decode.userId || decode.id || decode._id;
    } catch (error) {
        return null;
    }
};