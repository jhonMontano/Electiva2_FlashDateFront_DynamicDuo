import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { globalStyles } from "../../shared/globalStyles";

export default function CustomModal({ visible, title, message, onClose, children }) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>{title}</Text>
          {message && <Text style={styles.modalText}>{message}</Text>}
          
          <View style={styles.childrenContainer}>
            {children}
          </View>
          
          <TouchableOpacity
            style={[globalStyles.button, styles.closeButton]}
            onPress={onClose}
          >
            <Text style={globalStyles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "80%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
  childrenContainer: {
    width: "100%",
    marginVertical: 10,
  },
  closeButton: {
    marginTop: 10,
  },
});