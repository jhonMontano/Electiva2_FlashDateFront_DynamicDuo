import IUserRepository from "../../domain/repositories/IUserRepository";
import api from "./UserApi";

export default class UserRepository extends IUserRepository {
    async login(email, password) {
        const response = await api.post("/auth/login", { email, password });
        return response.data;
    }

    async getUserById(userId) {
        console.log('User ID recibido ', userId);
        const response = await api.get(`/users/${userId}`);
        return response.data;
    }

    async register(userData) {
        const formData = new FormData();

        for (const key in userData) {
            if (key === "location") {
                for (const locKey in userData.location) {
                    formData.append(`location[${locKey}]`, userData.location[locKey]);
                }
            } else if (key === "preferences") {
                userData.preferences.forEach((pref, index) => {
                    formData.append(`preferences[${index}]`, pref);
                });
            } else if (key === "profilePhoto") {
                continue;
            } else {
                formData.append(key, userData[key]);
            }
        }

        if (userData.profilePhoto) {
            formData.append("profilePhoto", {
                uri: userData.profilePhoto.uri,
                name: "photo.jpg",
                type: "image/jpeg"
            });
        }

        const response = await api.post("users/register", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });

        return response.data;
    }

    async updateUser(userId, userData) {
        const formData = new FormData();

        for (const key in userData) {
            if (key === 'location') {
                for (const locKey in userData.location) {
                    formData.append(`location[${locKey}]`, userData.location[locKey]);
                }
            } else if (key === 'preferences') {
                userData.preferences.forEach((pref, index) => {
                    formData.append(`preferences[${index}]`, pref);
                });
            } else if (key === 'profilePhoto' && userData.profilePhoto?.uri) {
                formData.append('profilePhoto', {
                    uri: userData.profilePhoto.uri,
                    name: userData.profilePhoto.name,
                    type: userData.profilePhoto.type
                });
            } else {
                formData.append(key, userData[key]);
            }
        }

        const response = await api.put(`/users/${userId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    }
}

