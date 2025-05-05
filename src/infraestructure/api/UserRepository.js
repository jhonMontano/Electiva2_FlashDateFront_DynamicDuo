import IUserRepository from "../../domain/repositories/IUserRepository";
import api from "./UserApi";

export default class UserRepository extends IUserRepository {
    async login(email, password) {
        const response = await api.post("/auth/login", { email, password });
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
}

