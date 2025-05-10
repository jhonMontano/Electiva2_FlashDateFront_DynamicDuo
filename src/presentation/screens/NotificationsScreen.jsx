import React from 'react';
import { View, Text } from 'react-native';
import { globalStyles } from '../../shared/globalStyles';

export default function NotificationsScreen() {
  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>🔔 Notificaciones</Text>
    </View>
  );
}
