import React, { useState } from "react";
import {
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Button,
  Image,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { globalStyles } from "../../shared/globalStyles";
import UserRepository from "../../infraestructure/api/UserRepository";
import CustomModal from "../components/CustomModal";

let DatePickerWeb;
if (Platform.OS === "web") {
  DatePickerWeb = require("react-datepicker").default;
  require("react-datepicker/dist/react-datepicker.css");
}

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState(new Date());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [preferences, setPreferences] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: "", message: "" });

  const showModal = (title, message) => {
    setModalMessage({ title, message });
    setModalVisible(true);
  };

  const validateFields = () => {
    if (
      !name ||
      !lastName ||
      !birthday ||
      !email ||
      !password ||
      !gender ||
      !preferences ||
      !country ||
      !state ||
      !city
    ) {
      showModal("Required fields", "Please complete all required fields.");
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      showModal("Invalid Email", "Please enter a valid email address.");
      return false;
    }

    if (password.length < 6) {
      showModal("Invalid password", "Password must be at least 6 characters long.");
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateFields()) return;

    try {
      const repo = new UserRepository();
      const response = await repo.register({
        name,
        lastName,
        birthday: birthday.toISOString().split("T")[0],
        email,
        password,
        gender,
        preferences: preferences.split(","),
        location: { country, state, city },
        profilePhoto,
      });

      showModal("Success", "Registration successful. You can now log in.");
    } catch (error) {
      let errorMessage = "An error occurred while registering.";

      if (error.response?.status === 422) {
        const firstError = error.response.data?.error?.[0]?.msg || "Datos inválidos.";
        errorMessage = firstError;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showModal("Error", errorMessage);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    if (event.type === "dismissed") {
      setShowDatePicker(false);
      return;
    }
    setBirthday(selectedDate || birthday);
    setShowDatePicker(false);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      alert("Se requiere permiso para acceder a la galería.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfilePhoto(uri);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        ...globalStyles.container,
        paddingVertical: 40,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={globalStyles.title}>🔥 Register 🔥</Text>

      <TextInput placeholder="Name" value={name} onChangeText={setName} style={globalStyles.input} />
      <TextInput placeholder="Last name" value={lastName} onChangeText={setLastName} style={globalStyles.input} />

      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <TextInput
          placeholder="Birthday"
          value={birthday ? birthday.toLocaleDateString() : ""}
          style={globalStyles.input}
          editable={false}
        />
      </TouchableOpacity>

      {showDatePicker &&
        (Platform.OS === "web" ? (
          <DatePickerWeb
            selected={birthday}
            onChange={(date) => {
              setBirthday(date);
              setShowDatePicker(false);
            }}
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            dateFormat="yyyy-MM-dd"
            inline
          />
        ) : (
          <DateTimePicker
            value={birthday}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleDateChange}
          />
        ))}

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
        style={globalStyles.input}
        secureTextEntry
      />
      <TextInput placeholder="Gender (Male/Female)" value={gender} onChangeText={setGender} style={globalStyles.input} />
      <TextInput
        placeholder="Preferences (Male,Female)"
        value={preferences}
        onChangeText={setPreferences}
        style={globalStyles.input}
      />
      <TextInput placeholder="Country" value={country} onChangeText={setCountry} style={globalStyles.input} />
      <TextInput placeholder="State" value={state} onChangeText={setState} style={globalStyles.input} />
      <TextInput placeholder="City" value={city} onChangeText={setCity} style={globalStyles.input} />

      <View style={styles.container}>
        <Text style={styles.title}>Select a profile picture</Text>
        <Button title="Select image" onPress={pickImage} />
        {profilePhoto ? <Image source={{ uri: profilePhoto }} style={styles.image} /> : null}
      </View>

      <TouchableOpacity style={globalStyles.button} onPress={handleRegister}>
        <Text style={globalStyles.buttonText}>Sign up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={globalStyles.link}>¿Already have an account? Login</Text>
      </TouchableOpacity>

      <CustomModal
        visible={modalVisible}
        title={modalMessage.title}
        message={modalMessage.message}
        onClose={() => {
          setModalVisible(false);
          if (modalMessage.title === "Success") navigation.navigate("Login");
        }}
      />
    </ScrollView>
  );
}

const styles = {
  container: {
    alignItems: "center",
    marginVertical: 10,
  },
  title: {
    fontSize: 16,
    marginBottom: 10,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: 10,
  },
};
