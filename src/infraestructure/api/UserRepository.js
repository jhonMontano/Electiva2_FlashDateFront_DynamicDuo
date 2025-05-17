import IUserRepository from "../../domain/repositories/IUserRepository";
import api from "./UserApi";

export default class UserRepository extends IUserRepository {
  async login(email, password) {
    console.log("🔐 Login payload:", { email, password });
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  }

  async getUserById(userId) {
    console.log("📥 Fetching user with ID:", userId);
    const response = await api.get(`/users/${userId}`);
    return response.data;
  }

  async register(userData) {
    const payload = {
      name: userData.name,
      lastName: userData.lastName,
      birthday: userData.birthday,
      email: userData.email,
      password: userData.password,
      gender: userData.gender,
      preferences: userData.preferences,
      location: {
        country: userData.location?.country || "",
        state: userData.location?.state || "",
        city: userData.location?.city || "",
      },
      profilePhoto: Array.isArray(userData.profilePhoto) ? userData.profilePhoto : [userData.profilePhoto],
    };

    console.log("🚀 Registering user with payload:", payload);

    const response = await api.post("/users/register", payload, {
      headers: { "Content-Type": "application/json" },
    });

    console.log("✅ Register response:", response.data);
    return response.data;
  }

  async updateUser(userId, userData) {
    console.log("✏️ Updating user:", userId, userData);
    const response = await api.put(`/users/${userId}`, userData, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  }
}
