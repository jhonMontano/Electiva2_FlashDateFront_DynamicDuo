import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { globalStyles } from '../../shared/globalStyles';
import { AuthContext } from '../../infraestructure/context/AuthContext';
import UserRepository from '../../infraestructure/api/UserRepository';
import CustomModal from '../components/CustomModal';
import Icon from 'react-native-vector-icons/Ionicons';
import { Image } from 'react-native';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: '', message: '' });
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    gender: '',
    preferences: '',
    country: '',
    state: '',
    city: '',
    profilePhoto: ''
  });

  const showModal = (title, message) => {
    setModalMessage({ title, message });
    setModalVisible(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = user?._id || user?.id;
        console.log("User desde contexto:", user);
        console.log("ID del usuario:", userId);

        if (!userId) {
          showModal('Error', 'No se encontró el ID del usuario');
          return;
        }

        const repo = new UserRepository();
        const userData = await repo.getUserById(userId);

        setFormData({
          name: userData.name || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          gender: userData.gender || '',
          preferences: userData.preferences?.join(',') || '',
          country: userData.location?.country || '',
          state: userData.location?.state || '',
          city: userData.location?.city || '',
          profilePhoto: userData.profilePhoto?.[0] || ''
        });

      } catch (error) {
        console.log('Error loading user:', error);
        showModal('Error', 'Error loading profile data');
      } finally {
        setLoading(false);
      }
    };

    if (user && (user._id || user.id)) {
      fetchData();
    } else {
      console.log("User not found in the context");
      setLoading(false);
    }
  }, [user]);

  const handleSaveChanges = async () => {
    try {
      const userId = user?._id || user?.id;
      const repo = new UserRepository();
      await repo.updateUser(userId, {
        ...formData,
        preferences: formData.preferences.split(',').map(p => p.trim()),
        location: {
          country: formData.country,
          state: formData.state,
          city: formData.city
        }
      });
      showModal('Success', 'Profile updated successfully');
    } catch (error) {
      showModal('Error', error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      console.log("Token removed. Redirecting to Login...");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <View style={globalStyles.container}>
        <ActivityIndicator size="large" color="#e91e63" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={globalStyles.container}>
      <View style={styles.header}>
        {formData.profilePhoto ? (
          <Image
            source={{ uri: formData.profilePhoto }}
            style={{ width: 120, height: 120, borderRadius: 60, alignSelf: 'center', marginVertical: 10 }}
          />
        ) : (
          <Text style={{ alignSelf: 'center', marginBottom: 10 }}>No profile photo</Text>
        )}
        <TouchableOpacity onPress={() => setShowLogoutModal(true)}>
          <Icon name="log-out-outline" size={28} color="#333" />
        </TouchableOpacity>
        <Modal transparent={true} visible={showLogoutModal} animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modal}>
              <Text style={styles.modalText}>¿Do you want to log out?</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setShowLogoutModal(false)} style={styles.cancelBtn}>
                  <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                  <Text style={styles.btnText}>Exit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>

      <TextInput
        style={globalStyles.input}
        placeholder="Name"
        value={formData.name}
        onChangeText={text => setFormData({ ...formData, name: text })}
      />
      <TextInput
        style={globalStyles.input}
        placeholder="Last Name"
        value={formData.lastName}
        onChangeText={text => setFormData({ ...formData, lastName: text })}
      />
      <TextInput
        style={globalStyles.input}
        placeholder="Email"
        value={formData.email}
        editable={false}
      />
      <TextInput
        style={globalStyles.input}
        placeholder="Gender"
        value={formData.gender}
        onChangeText={text => setFormData({ ...formData, gender: text })}
      />
      <TextInput
        style={globalStyles.input}
        placeholder="Preferences (comma-separated)"
        value={formData.preferences}
        onChangeText={text => setFormData({ ...formData, preferences: text })}
      />
      <TextInput
        style={globalStyles.input}
        placeholder="Country"
        value={formData.country}
        onChangeText={text => setFormData({ ...formData, country: text })}
      />
      <TextInput
        style={globalStyles.input}
        placeholder="State"
        value={formData.state}
        onChangeText={text => setFormData({ ...formData, state: text })}
      />
      <TextInput
        style={globalStyles.input}
        placeholder="City"
        value={formData.city}
        onChangeText={text => setFormData({ ...formData, city: text })}
      />

      <TouchableOpacity style={globalStyles.button} onPress={handleSaveChanges}>
        <Text style={globalStyles.buttonText}>Apply changes</Text>
      </TouchableOpacity>

      <CustomModal
        visible={modalVisible}
        title={modalMessage.title}
        message={modalMessage.message}
        onClose={() => setModalVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    marginTop: 40,
    marginBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: 280,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 10,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelBtn: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
  },
  logoutBtn: {
    backgroundColor: '#e53935',
    padding: 10,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

