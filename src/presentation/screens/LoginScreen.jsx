import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, ImageBackground } from "react-native";
import { AuthContext } from "../../infraestructure/context/AuthContext";
import UserRepository from "../../infraestructure/api/UserRepository";
import { globalStyles } from "../../shared/globalStyles";
import backgroundImage from "../../../assets/images/Img-flashdate7.png";
import CustomModal from "../components/CustomModal";

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: "", message: "" });

  const showModal = (title, message) => {
    setModalMessage({ title, message });
    setModalVisible(true);
  };

  const handleLogin = async () => {
    try {
      const repo = new UserRepository();
      const response = await repo.login(email, password);

      login(response.data.user, response.data.token); 
      console.log('Rsponse', response);

    } catch (error) {
      let errorMessage = "Ocurrió un error al iniciar sesión";

      if (error.response?.status === 422) {
        errorMessage = "Invalid credentials. Verify your email and password.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showModal("Login error", errorMessage);
    }
  };

  return (
    <ImageBackground source={backgroundImage} style={globalStyles.background}>
      <View style={globalStyles.overlay}>
        <Text style={globalStyles.title}>🔥 FlashDate 🔥</Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={globalStyles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={globalStyles.input}
        />

        <TouchableOpacity style={globalStyles.button} onPress={handleLogin}>
          <Text style={globalStyles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={globalStyles.link}>¿Don't have an account? Sign up</Text>
        </TouchableOpacity>
      </View>

      <CustomModal
        visible={modalVisible}
        title={modalMessage.title}
        message={modalMessage.message}
        onClose={() => setModalVisible(false)}
      />
    </ImageBackground>
  );
}
