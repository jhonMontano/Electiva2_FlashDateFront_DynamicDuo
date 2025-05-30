import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSocketConnection } from '../../infraestructure/socket/socket';
import { getUserIdFromToken } from '../../shared/decodeToken';

export default function ConversationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const flatListRef = useRef(null);

  const { matchId, matchedUser } = route.params;
  const { socket, isConnected, userId: socketUserId } = useSocketConnection();

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [userId, setUserId] = useState(socketUserId);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [roomId, setRoomId] = useState(`match_${matchId}`);

  const cacheKey = `messages_${matchId}_${userId}`;

  const saveMessagesToCache = async (messagesArray) => {
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(messagesArray));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadMessagesFromCache = async () => {
    try {
      const cachedMessages = await AsyncStorage.getItem(cacheKey);
      if (cachedMessages) {
        const parsedMessages = JSON.parse(cachedMessages);
        setMessages(parsedMessages);
        return parsedMessages;
      }
    } catch (error) {
      console.error('Error:', error);
    }
    return [];
  };

  const addMessageSafely = useCallback((newMessage) => {
    setMessages(prevMessages => {
      const messageExists = prevMessages.some(existingMsg =>
        existingMsg._id === newMessage._id ||
        (existingMsg.content === newMessage.content &&
          existingMsg.from.toString() === newMessage.from.toString() &&
          Math.abs(new Date(existingMsg.createdAt) - new Date(newMessage.createdAt)) < 5000)
      );

      if (!messageExists) {
        const updatedMessages = [...prevMessages, newMessage]
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        saveMessagesToCache(updatedMessages);

        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 100);

        return updatedMessages;
      }
      return prevMessages;
    });
  }, []);

  const loadMessages = async (currentUserId = null, showFromCache = true) => {
    try {
      const id = currentUserId || userId || await getUserIdFromToken();

      if (showFromCache && id) {
        const cachedMessages = await loadMessagesFromCache();
        if (cachedMessages.length > 0) {
          setTimeout(() => {
            if (flatListRef.current && cachedMessages.length > 0) {
              flatListRef.current.scrollToEnd({ animated: false });
            }
          }, 100);
        }
      }

      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`http://192.168.0.13:3000/api/messages/match_${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const existingMessages = await response.json();

        const formattedMessages = existingMessages
          .map((msg) => ({
            content: msg.content,
            from: msg.senderId,
            to: msg.receiverId,
            fromSelf: msg.senderId.toString() === id.toString(),
            createdAt: msg.createdAt,
            roomId: msg.roomId,
            _id: msg._id,
          }))
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        setMessages(formattedMessages);

        if (id) {
          await saveMessagesToCache(formattedMessages);
        }

        setTimeout(() => {
          if (flatListRef.current && formattedMessages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: false });
          }
        }, 100);
      } else {
        console.error('Error:', response.status);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const id = await getUserIdFromToken();
        setUserId(id);
        await loadMessages(id);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, [matchId]);

  useEffect(() => {
    if (!socket || !userId) return;

    const handlePrivateMessage = (msg) => {

      if (msg.roomId === roomId) {
        const newMessage = {
          content: msg.content,
          from: msg.from || msg.senderId,
          to: msg.to || msg.receiverId,
          fromSelf: (msg.from || msg.senderId).toString() === userId.toString(),
          createdAt: msg.createdAt || new Date().toISOString(),
          roomId: msg.roomId,
          _id: msg._id || `temp_${Date.now()}_${Math.random()}`
        };

        addMessageSafely(newMessage);
      }
    };

    const handleConnect = () => {
      socket.emit('JoinRoom', { roomId });
    };

    const handleDisconnect = () => {
    };

    socket.on('privateMessage', handlePrivateMessage);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    if (isConnected) {
      handleConnect();
    }

    return () => {
      socket.off('privateMessage', handlePrivateMessage);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, userId, roomId, isConnected, addMessageSafely]);

  useFocusEffect(
    useCallback(() => {
      const markAsRead = async () => {
        if (userId && matchId) {
          try {
            const readMessagesData = await AsyncStorage.getItem(`readMessages_${userId}`);
            const readMessagesSet = readMessagesData ? new Set(JSON.parse(readMessagesData)) : new Set();

            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`http://192.168.0.13:3000/api/messages/match_${matchId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
              const allMessages = await response.json();
              const receivedMessageIds = allMessages
                .filter(msg => msg.receiverId.toString() === userId.toString())
                .map(msg => msg._id.toString());

              receivedMessageIds.forEach(id => readMessagesSet.add(id));

              await AsyncStorage.setItem(
                `readMessages_${userId}`,
                JSON.stringify([...readMessagesSet])
              );
            }
          } catch (error) {
            console.error('Error marking messages as read:', error);
          }
        }
      };

      markAsRead();

      if (userId && matchId) {
        loadMessages(userId, false);
      }
    }, [userId, matchId])
  );

  const sendMessage = async () => {
    if (!inputMessage.trim() || !userId || !matchedUser || isSending) return;

    setIsSending(true);
    const messageContent = inputMessage.trim();
    const tempId = `temp_${Date.now()}_${Math.random()}`;

    const messageData = {
      roomId: roomId,
      senderId: userId,
      receiverId: matchedUser._id,
      content: messageContent,
    };

    const tempMessage = {
      content: messageContent,
      from: userId,
      to: matchedUser._id,
      fromSelf: true,
      roomId: roomId,
      createdAt: new Date().toISOString(),
      _id: tempId,
      isTemporary: true,
    };

    addMessageSafely(tempMessage);
    setInputMessage('');

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://192.168.0.13:3000/api/messages/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        const savedMessage = await response.json();

        setMessages((prev) => {
          const updated = prev.map(msg =>
            msg._id === tempId
              ? {
                content: savedMessage.content,
                from: savedMessage.senderId,
                to: savedMessage.receiverId,
                fromSelf: true,
                roomId: savedMessage.roomId,
                createdAt: savedMessage.createdAt,
                _id: savedMessage._id,
              }
              : msg
          );

          saveMessagesToCache(updated);
          return updated;
        });

        if (socket && isConnected) {
          const socketMessage = {
            ...messageData,
            from: userId,
            to: matchedUser._id,
            createdAt: savedMessage.createdAt,
            _id: savedMessage._id,
          };

          socket.emit('privateMessage', socketMessage);
        } else {
          console.warn('Socket no conect');
        }

      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error:', error);

      setMessages((prev) => {
        const updated = prev.filter(msg => msg._id !== tempId);
        saveMessagesToCache(updated);
        return updated;
      });

      Alert.alert(
        'Error sending message',
        'The message could not be sent. Would you like to try again?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Retry',
            onPress: () => {
              setInputMessage(messageContent);
              setTimeout(() => sendMessage(), 100);
            }
          }
        ]
      );
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const shouldShowTime = (currentIndex) => {
    if (currentIndex === 0) return true;

    const currentMessage = messages[currentIndex];
    const previousMessage = messages[currentIndex - 1];

    if (!currentMessage.createdAt || !previousMessage.createdAt) return false;

    const currentTime = new Date(currentMessage.createdAt).getTime();
    const previousTime = new Date(previousMessage.createdAt).getTime();

    if (isNaN(currentTime) || isNaN(previousTime)) return false;

    const timeDiff = currentTime - previousTime;
    const senderChanged = currentMessage.from.toString() !== previousMessage.from.toString();

    return timeDiff > 300000 || senderChanged;
  };

  const renderMessage = ({ item, index }) => {
    const isMe = item.fromSelf;
    const showTime = shouldShowTime(index);

    return (
      <View style={styles.messageContainer}>
        {showTime && (
          <Text style={styles.timeText}>
            {formatTime(item.createdAt)}
          </Text>
        )}
        <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
          <Text style={[styles.messageText, { color: isMe ? 'white' : '#333' }]}>
            {item.content}
          </Text>
          {item.isTemporary && (
            <Text style={styles.sendingText}>Enviando...</Text>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando conversación...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Return</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {matchedUser?.name || 'Usuario'}
          </Text>
          <Text style={[styles.connectionStatus, { color: isConnected ? '#4CAF50' : '#ff9800' }]}>
          </Text>
        </View>
        <Text style={styles.messageCount}>
          {messages.length} messages
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => {
          if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={10}
      />

      <View style={styles.inputContainer}>
        <TextInput
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Write a message..."
          style={styles.input}
          multiline
          maxLength={500}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity
          onPress={sendMessage}
          style={[
            styles.sendButton,
            (!inputMessage.trim() || isSending) && styles.disabledButton
          ]}
          disabled={!inputMessage.trim() || isSending}
        >
          <Text style={styles.sendButtonText}>
            {isSending ? '...' : 'Send'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 16,
    color: '#ff3366',
    marginRight: 15,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    padding: 40
  },
  connectionStatus: {
    fontSize: 10,
    marginTop: -20,
  },
  messageCount: {
    fontSize: 12,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 20,
  },
  messageContainer: {
    marginVertical: 3,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginVertical: 10,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '80%',
    marginVertical: 2,
  },
  myMessage: {
    backgroundColor: '#ff3366',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  sendingText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    backgroundColor: '#ff3366',
    marginLeft: 10,
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});