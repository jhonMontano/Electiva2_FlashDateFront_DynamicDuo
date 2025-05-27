import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSocket } from '../../infraestructure/socket/socket';
import { getUserIdFromToken } from '../../shared/decodeToken';

export default function ConversationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { recipientId, recipientName } = route.params;

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [userId, setUserId] = useState(null);
  const socket = useSocket();

  useEffect(() => {
    const setup = async () => {
      const id = await getUserIdFromToken();
      setUserId(id);

      socket.emit('JoinRoom', { roomId: id });

      socket.on('privateMessage', (msg) => {
        console.log('📩 Mensaje recibido:', msg);
        setMessages((prev) => [...prev, msg]);
      });
    };

    setup();

    return () => {
      socket.off('privateMessage');
    };
  }, []);

  const sendMessage = () => {
    if (!inputMessage.trim()) return;

    const msg = {
      from: userId,
      to: recipientId,
      content: inputMessage,
    };

    socket.emit('privateMessage', msg);
    setMessages((prev) => [...prev, { ...msg, fromSelf: true }]);
    setInputMessage('');
  };

  const handleExit = () => {
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  const renderItem = ({ item }) => (
    <View style={[styles.messageContainer, item.fromSelf ? styles.self : styles.other]}>
      <Text style={styles.messageText}>{item.content}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conversación con {recipientName}</Text>
        <Button title="Salir" onPress={handleExit} />
      </View>

      <FlatList
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.messagesList}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Escribe un mensaje..."
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    padding: 10,
    marginVertical: 4,
    borderRadius: 10,
    maxWidth: '80%',
  },
  self: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  other: {
    alignSelf: 'flex-start',
    backgroundColor: '#E1E1E1',
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#fafafa',
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#e91e63',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
