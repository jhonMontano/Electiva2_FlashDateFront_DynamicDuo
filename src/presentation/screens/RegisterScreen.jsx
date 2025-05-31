import React, { useState, useEffect } from "react";
import { Platform, Text, TextInput, TouchableOpacity, ScrollView, Button, View } from "react-native";
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

const locationData = {
  countries: [
    { code: "CO", name: "Colombia" },
    { code: "US", name: "United States" },
    { code: "MX", name: "Mexico" },
    { code: "BR", name: "Brazil" },
    { code: "AR", name: "Argentina" },
    { code: "PE", name: "Peru" },
    { code: "CL", name: "Chile" },
    { code: "EC", name: "Ecuador" },
    { code: "VE", name: "Venezuela" },
    { code: "ES", name: "Spain" }
  ],
  states: {
    CO: [
      { code: "ANT", name: "Antioquia" },
      { code: "CUN", name: "Cundinamarca" },
      { code: "VAL", name: "Valle del Cauca" },
      { code: "ATL", name: "Atlántico" },
      { code: "BOL", name: "Bolívar" },
      { code: "SAN", name: "Santander" },
      { code: "CAL", name: "Caldas" },
      { code: "TOL", name: "Tolima" }
    ],
    US: [
      { code: "CA", name: "California" },
      { code: "TX", name: "Texas" },
      { code: "FL", name: "Florida" },
      { code: "NY", name: "New York" },
      { code: "IL", name: "Illinois" },
      { code: "PA", name: "Pennsylvania" }
    ],
    MX: [
      { code: "JAL", name: "Jalisco" },
      { code: "NL", name: "Nuevo León" },
      { code: "DF", name: "Ciudad de México" },
      { code: "QRO", name: "Querétaro" },
      { code: "YUC", name: "Yucatán" }
    ],
    BR: [
      { code: "SP", name: "São Paulo" },
      { code: "RJ", name: "Rio de Janeiro" },
      { code: "MG", name: "Minas Gerais" },
      { code: "BA", name: "Bahia" },
      { code: "PR", name: "Paraná" }
    ],
    AR: [
      { code: "BA", name: "Buenos Aires" },
      { code: "COR", name: "Córdoba" },
      { code: "SF", name: "Santa Fe" },
      { code: "MEN", name: "Mendoza" }
    ],
    PE: [
      { code: "LIM", name: "Lima" },
      { code: "ARE", name: "Arequipa" },
      { code: "LAL", name: "La Libertad" },
      { code: "CUS", name: "Cusco" }
    ],
    CL: [
      { code: "RM", name: "Región Metropolitana" },
      { code: "VAL", name: "Valparaíso" },
      { code: "BIO", name: "Biobío" },
      { code: "ARA", name: "Araucanía" }
    ],
    EC: [
      { code: "PIC", name: "Pichincha" },
      { code: "GUA", name: "Guayas" },
      { code: "AZU", name: "Azuay" },
      { code: "MAN", name: "Manabí" }
    ],
    VE: [
      { code: "DC", name: "Distrito Capital" },
      { code: "MIR", name: "Miranda" },
      { code: "ZUL", name: "Zulia" },
      { code: "CAR", name: "Carabobo" }
    ],
    ES: [
      { code: "MD", name: "Madrid" },
      { code: "CT", name: "Cataluña" },
      { code: "AN", name: "Andalucía" },
      { code: "VC", name: "Valencia" }
    ]
  },
  cities: {
    "CO-ANT": ["Medellín", "Bello", "Itagüí", "Envigado", "Sabaneta", "Rionegro", "Apartadó"],
    "CO-CUN": ["Bogotá", "Soacha", "Chía", "Zipaquirá", "Facatativá", "Mosquera", "Fusagasugá"],
    "CO-VAL": ["Cali", "Palmira", "Buenaventura", "Tuluá", "Cartago", "Buga", "Jamundí"],
    "CO-ATL": ["Barranquilla", "Soledad", "Malambo", "Puerto Colombia", "Galapa"],
    "CO-BOL": ["Cartagena", "Magangué", "Turbaco", "Arjona", "El Carmen de Bolívar"],
    "CO-SAN": ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja"],
    "CO-CAL": ["Manizales", "La Dorada", "Chinchiná", "Villamaría", "Riosucio"],
    "CO-TOL": ["Ibagué", "Espinal", "Melgar", "Honda", "Líbano"],

    "US-CA": ["Los Angeles", "San Francisco", "San Diego", "Sacramento", "Oakland", "Fresno"],
    "US-TX": ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "El Paso"],
    "US-FL": ["Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale", "Tallahassee"],
    "US-NY": ["New York City", "Buffalo", "Rochester", "Syracuse", "Albany", "Yonkers"],
    "US-IL": ["Chicago", "Aurora", "Rockford", "Joliet", "Naperville", "Springfield"],
    "US-PA": ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton"],

    "MX-JAL": ["Guadalajara", "Zapopan", "Tlaquepaque", "Tonalá", "Puerto Vallarta"],
    "MX-NL": ["Monterrey", "Guadalupe", "San Nicolás", "Escobedo", "Apodaca"],
    "MX-DF": ["Ciudad de México", "Ecatepec", "Nezahualcóyotl", "Tlalnepantla"],
    "MX-QRO": ["Querétaro", "San Juan del Río", "Corregidora", "El Marqués"],
    "MX-YUC": ["Mérida", "Kanasín", "Umán", "Progreso", "Valladolid"],

    "BR-SP": ["São Paulo", "Guarulhos", "Campinas", "São Bernardo", "Santos"],
    "BR-RJ": ["Rio de Janeiro", "Niterói", "Nova Iguaçu", "Duque de Caxias", "Petrópolis"],
    "BR-MG": ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim"],
    "BR-BA": ["Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari"],
    "BR-PR": ["Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel"],

    "AR-BA": ["Buenos Aires", "La Plata", "Mar del Plata", "Quilmes", "Bahía Blanca"],
    "AR-COR": ["Córdoba", "Villa María", "Río Cuarto", "San Francisco", "Carlos Paz"],
    "AR-SF": ["Rosario", "Santa Fe", "Rafaela", "Venado Tuerto", "Reconquista"],
    "AR-MEN": ["Mendoza", "San Rafael", "Godoy Cruz", "Luján de Cuyo", "Maipú"],

    "PE-LIM": ["Lima", "Callao", "San Juan de Lurigancho", "Villa El Salvador", "Comas"],
    "PE-ARE": ["Arequipa", "Cayma", "Cerro Colorado", "Paucarpata", "Mariano Melgar"],
    "PE-LAL": ["Trujillo", "Chimbote", "Huamachuco", "Pacasmayo", "Santiago de Chuco"],
    "PE-CUS": ["Cusco", "Wanchaq", "Santiago", "San Sebastián", "San Jerónimo"],

    "CL-RM": ["Santiago", "Puente Alto", "Maipú", "Las Condes", "La Florida"],
    "CL-VAL": ["Valparaíso", "Viña del Mar", "Villa Alemana", "Quilpué", "San Antonio"],
    "CL-BIO": ["Concepción", "Talcahuano", "Chillán", "Los Ángeles", "Coronel"],
    "CL-ARA": ["Temuco", "Villarrica", "Pucón", "Angol", "Nueva Imperial"],

    "EC-PIC": ["Quito", "Cayambe", "Machachi", "Sangolquí", "Tabacundo"],
    "EC-GUA": ["Guayaquil", "Durán", "Samborondón", "Daule", "Milagro"],
    "EC-AZU": ["Cuenca", "Gualaceo", "Paute", "Girón", "Santa Isabel"],
    "EC-MAN": ["Portoviejo", "Manta", "Chone", "Montecristi", "Jipijapa"],

    "VE-DC": ["Caracas", "Petare", "Maracay", "Baruta", "Chacao"],
    "VE-MIR": ["Los Teques", "Guarenas", "Guatire", "Charallave", "Cúa"],
    "VE-ZUL": ["Maracaibo", "Cabimas", "Ciudad Ojeda", "Punto Fijo", "Machiques"],
    "VE-CAR": ["Valencia", "Puerto Cabello", "Guacara", "Mariara", "San Diego"],

    "ES-MD": ["Madrid", "Móstoles", "Alcalá de Henares", "Fuenlabrada", "Leganés"],
    "ES-CT": ["Barcelona", "Hospitalet", "Terrassa", "Badalona", "Sabadell"],
    "ES-AN": ["Sevilla", "Málaga", "Córdoba", "Granada", "Almería"],
    "ES-VC": ["Valencia", "Alicante", "Elche", "Castellón", "Gandía"]
  }
};

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState(new Date());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [description, setDescription] = useState("");
  const [preferences, setPreferences] = useState("");
  
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  
  const [profilePhotos, setProfilePhotos] = useState([]);
  const [tempPhotoUrls, setTempPhotoUrls] = useState([""]);

  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: "", message: "" });

  const [showDatePicker, setShowDatePicker] = useState(false);

  const getAvailableStates = () => {
    return selectedCountry ? locationData.states[selectedCountry] || [] : [];
  };

  const getAvailableCities = () => {
    if (selectedCountry && selectedState) {
      const cityKey = `${selectedCountry}-${selectedState}`;
      return locationData.cities[cityKey] || [];
    }
    return [];
  };

  useEffect(() => {
    if (selectedCountry) {
      setSelectedState("");
      setSelectedCity("");
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedState) {
      setSelectedCity("");
    }
  }, [selectedState]);

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
    if (!name || !lastName || !birthday || !email || !password || !gender || !preferences || !selectedCountry || !selectedState || !selectedCity) {
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
      
      const countryName = locationData.countries.find(c => c.code === selectedCountry)?.name || selectedCountry;
      const stateName = getAvailableStates().find(s => s.code === selectedState)?.name || selectedState;
      const cityName = selectedCity;

      const userData = {
        name,
        lastName,
        birthday: birthday.toISOString().split("T")[0].replace(/-/g, "/"),
        email,
        password,
        gender,
        preferences: preferences.split(",").map((pref) => pref.trim()),
        location: { 
          country: countryName, 
          state: stateName, 
          city: cityName 
        },
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
      console.error("Error al registrar:", error);
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

      <View style={globalStyles.inputGroup}>
        <Text style={globalStyles.label}>Country</Text>
        <View style={{ ...globalStyles.pickerWrapper, height: Platform.OS === 'android' ? 50 : undefined }}>
          <Picker
            selectedValue={selectedCountry}
            onValueChange={(itemValue) => setSelectedCountry(itemValue)}
            style={globalStyles.picker}
            mode="dropdown"
          >
            <Picker.Item label="Select Country" value="" />
            {locationData.countries.map(country => (
              <Picker.Item key={country.code} label={country.name} value={country.code} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={globalStyles.inputGroup}>
        <Text style={globalStyles.label}>State</Text>
        <View style={{ ...globalStyles.pickerWrapper, height: Platform.OS === 'android' ? 50 : undefined }}>
          <Picker
            selectedValue={selectedState}
            onValueChange={(itemValue) => setSelectedState(itemValue)}
            style={globalStyles.picker}
            mode="dropdown"
            enabled={selectedCountry !== ""}
          >
            <Picker.Item label={selectedCountry ? "Select State" : "Select Country First"} value="" />
            {getAvailableStates().map(state => (
              <Picker.Item key={state.code} label={state.name} value={state.code} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={globalStyles.inputGroup}>
        <Text style={globalStyles.label}>City</Text>
        <View style={{ ...globalStyles.pickerWrapper, height: Platform.OS === 'android' ? 50 : undefined }}>
          <Picker
            selectedValue={selectedCity}
            onValueChange={(itemValue) => setSelectedCity(itemValue)}
            style={globalStyles.picker}
            mode="dropdown"
            enabled={selectedState !== ""}
          >
            <Picker.Item label={selectedState ? "Select City" : "Select State First"} value="" />
            {getAvailableCities().map(city => (
              <Picker.Item key={city} label={city} value={city} />
            ))}
          </Picker>
        </View>
      </View>

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