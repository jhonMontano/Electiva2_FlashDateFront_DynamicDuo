import IUserRepository from "../../domain/repositories/IUserRepository";
import api from "./UserApi";

export default class UserRepository extends IUserRepository {
  async login(email, password) {
    const response = await api.post("/auth/login", { email, password });
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
      description: userData.description,
      profilePhoto: Array.isArray(userData.profilePhoto)
        ? userData.profilePhoto
        : [userData.profilePhoto],
    };

    const response = await api.post("/users/register", payload);
    return response.data;
  }

  async getUserById(userId) {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  }

  async updateUser(userId, userData) {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  }

  async getAllUserExcept(loggedUserId) {
    try {
      const response = await api.get("/users");
      const allUsers = response.data;

      const loggedUserResponse = await api.get(`/users/${loggedUserId}`);
      const loggedUser = loggedUserResponse.data;

      const matchesResponse = await api.get(`/swipes/matches/${loggedUserId}`);
      const matchedUserIds = matchesResponse.data.map(match => match.matchedUser._id);

      const filteredUsers = allUsers.filter(user =>
        user._id !== loggedUserId &&
        !matchedUserIds.includes(user._id) &&
        loggedUser.preferences.includes(user.gender)
      );

      return filteredUsers;
    } catch (error) {
      console.error("Error filtering users:", error);
      return [];
    }
  }

  async sendSwipe(userId, targetUserId, action) {
    const response = await api.post("/swipes", {
      userId,
      targetUserId,
      action,
    });
    return response.data;
  }

  async getMatchesByUserId(userId) {
    const response = await api.get(`/swipes/matches/${userId}`);
    return response.data;
  }

  async getMessagesByMatchId(matchId) {
    try {
      const response = await api.get(`/messages/match_${matchId}`);
      return response.data;
    } catch (error) {
      console.error('getMessagesByMatchId error:', error);
      throw error;
    }
  }

  async getMessages(matchId) {
    try {
      const response = await api.get(`/messages/${matchId}`);
      return response.data;
    } catch (error) {
      console.error('getMessages error:', error);
      throw error;
    }
  }

  async getMessageById(messageId) {
    const response = await api.get(`/messages/${messageId}`);
    return response.data;
  }

  async sendMessage(messageData) {
    try {
      const response = await api.post("/messages", messageData);
      return response.data;
    } catch (error) {
      console.error("sendMessage error:", error);
      throw error;
    }
  }
}