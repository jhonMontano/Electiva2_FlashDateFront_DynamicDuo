import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { globalStyles } from '../../shared/globalStyles';


export default function HomeScreen() {
  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <Text style={globalStyles.title}>🏠 Home</Text>
      </View>

      <View style={styles.content}>
        <Text style={globalStyles.paragraph}>Bienvenido a FlashDate 🎉</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    marginTop: 40,
    marginBottom: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
});