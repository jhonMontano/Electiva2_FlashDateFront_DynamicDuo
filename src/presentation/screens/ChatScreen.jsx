import React from 'react';
import { View, Text } from 'react-native';
import { globalStyles } from '../../shared/globalStyles';

export default function ChatScreen() {
  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>💬 Chat</Text>
    </View>
  );
}
