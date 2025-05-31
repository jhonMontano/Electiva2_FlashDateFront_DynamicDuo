import React, { useState } from "react";
import { Platform, Text, TextInput, TouchableOpacity, ScrollView, Button, View, } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { globalStyles } from "../../shared/globalStyles";
import UserRepository from "../../infraestructure/api/UserRepository";
import CustomModal from "../components/CustomModal";
import { Picker } from '@react-native-picker/picker';

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
  const [description, setDescription] = useState("");
  const [preferences, setPreferences] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [profilePhotos, setProfilePhotos] = useState([]);
  const [tempPhotoUrls, setTempPhotoUrls] = useState([""]);

  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: "", message: "" });

  const [showDatePicker, setShowDatePicker] = useState(false);

  const showModal = (title, message) => {
    setModalMessage({ title, message });
    setModalVisible(true);
  };
  const validateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age >= 18;
  };

  const validateFields = () => {
    if (!name || !lastName || !birthday || !email || !password || !gender || !preferences || !country || !state || !city) {
      showModal("Required fields", "Please complete all required fields.");
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      showModal("Invalid Email", "Please enter a valid email address.");
      return false;
    }
    if (!validateAge(birthday)) {
      showModal("insufficient age", "You must be at least 18 years old to register.");
      return false;
    }

    if (password.length < 6) {
      showModal("Invalid password", "Password must be at least 6 characters long.");
      return false;
    }

    if (!profilePhotos.length || !profilePhotos.some(url => url && url.trim() !== "")) {
      showModal("Profile Photos", "Please add at least one profile photo URL.");
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateFields()) return;

    try {
      const repo = new UserRepository();
      const userData = {
        name,
        lastName,
        birthday: birthday.toISOString().split("T")[0].replace(/-/g, "/"),
        email,
        password,
        gender,
        preferences: preferences.split(",").map((pref) => pref.trim()),
        location: { country, state, city },
        description,
        profilePhoto: profilePhotos,
      };

      await repo.register(userData);
      showModal("Success", "Registration successful. You can now log in.");
    } catch (error) {
      let errorMessage = "An error occurred while registering.";
      if (error.response?.status === 422) {
        errorMessage = error.response.data?.error?.[0]?.msg || "Invalid data.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      console.error(" Error al registrar:", error);
      showModal("Error", errorMessage);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS !== "ios") setShowDatePicker(false);
    if (selectedDate) setBirthday(selectedDate);
    if (!validateAge(selectedDate)) {
      showModal("insufficient age", "You must be at least 18 years old to register.");
    }
  };

  const openPhotoModal = () => {
    setTempPhotoUrls(profilePhotos.length > 0 ? [...profilePhotos] : [""]);
    setPhotoModalVisible(true);
  };

  return (
    <ScrollView
      contentContainerStyle={{ ...globalStyles.container, paddingVertical: 30}}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={globalStyles.title}>Register</Text>

      <TextInput placeholder="Name" value={name} onChangeText={setName} style={globalStyles.input} />
      <TextInput placeholder="Last name" value={lastName} onChangeText={setLastName} style={globalStyles.input} />

      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <TextInput
          placeholder="Birthday"
          value={birthday ? birthday.toLocaleDateString() : ""}
          style={globalStyles.input}
          editable={false}
          pointerEvents="none"
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
            display="default"
            onChange={handleDateChange}
          />
        ))}

      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={globalStyles.input} keyboardType="email-address" autoCapitalize="none" />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={globalStyles.input} secureTextEntry />

      <View style={globalStyles.inputGroup}>
        <Text style={globalStyles.label}>Gender</Text>
        <View
          style={{
            ...globalStyles.pickerWrapper,
            height: Platform.OS === 'android' ? 50 : undefined,
          }}
        >
          <Picker
            selectedValue={gender}
            onValueChange={(itemValue) => setGender(itemValue)}
            style={globalStyles.picker}
            mode={Platform.OS === 'ios' ? 'dialog' : 'dropdown'}
          >
            <Picker.Item label="Select Gender" value="" />
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
          </Picker>
        </View>
      </View>

      <View style={globalStyles.inputGroup}>
        <Text style={globalStyles.label}>Preferences</Text>
        <View style={{ ...globalStyles.pickerWrapper, height: Platform.OS === 'android' ? 50 : undefined }}>
          <Picker
            selectedValue={preferences}
            onValueChange={(itemValue) => setPreferences(itemValue)}
            style={globalStyles.picker}
            mode="dropdown"
          >
            <Picker.Item label="Select Preference" value="" />
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
          </Picker>
        </View>
      </View>

      <TextInput placeholder="Country" value={country} onChangeText={setCountry} style={globalStyles.input} />
      <TextInput placeholder="State" value={state} onChangeText={setState} style={globalStyles.input} />
      <TextInput placeholder="City" value={city} onChangeText={setCity} style={globalStyles.input} />
      <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={globalStyles.input} />

      <View style={globalStyles.container}>
        <Button title="Add profile photos" onPress={openPhotoModal} />
        {profilePhotos.length > 0 && (
          <Text style={{ marginTop: 10 }}>URLs added: {profilePhotos.length}</Text>
        )}
      </View>

      <CustomModal
        visible={photoModalVisible}
        title="Profile photos"
        message="Enter the URLs of your photos"
        onClose={() => setPhotoModalVisible(false)}
      >
        <ScrollView>
          {tempPhotoUrls.map((url, index) => (
            <TextInput
              key={index}
              placeholder={`URL #${index + 1}`}
              value={url}
              onChangeText={(text) => {
                const updated = [...tempPhotoUrls];
                updated[index] = text;
                setTempPhotoUrls(updated);
              }}
              style={globalStyles.input}
            />
          ))}
          <Button title="Add another URL +" onPress={() => setTempPhotoUrls([...tempPhotoUrls, ""])} />
          <View style={{ marginVertical: 10 }} />
          <Button
            title="Save URLs"
            onPress={() => {
              const valid = tempPhotoUrls.filter(url => url && typeof url === "string" && url.trim() !== "");
              if (valid.length === 0) {
                alert("Add at least one valid URL.");
                return;
              }
              setProfilePhotos(valid);
              setPhotoModalVisible(false);
            }}
          />
        </ScrollView>
      </CustomModal>

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
