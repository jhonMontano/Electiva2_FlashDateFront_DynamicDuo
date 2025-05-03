import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function CustomModal({ visible, title, message, onClose }) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center"
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#e63946"
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center"
  },
  button: {
    backgroundColor: "#e63946",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold"
  }
});
