import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSocket } from '../../infraestructure/socket/socket';
import { getUserIdFromToken } from '../../shared/decodeToken';

export default function ConversationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const flatListRef = useRef(null);

  const { matchId, matchedUser } = route.params;

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const socket = useSocket();

  // Cache key para persistencia local
  const cacheKey = `messages_${matchId}_${userId}`;

  // Guardar mensajes en caché local
  const saveMessagesToCache = async (messagesArray) => {
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(messagesArray));
    } catch (error) {
      console.error('Error guardando mensajes en caché:', error);
    }
  };

  // Cargar mensajes desde caché local
  const loadMessagesFromCache = async () => {
    try {
      const cachedMessages = await AsyncStorage.getItem(cacheKey);
      if (cachedMessages) {
        const parsedMessages = JSON.parse(cachedMessages);
        setMessages(parsedMessages);
        return parsedMessages;
      }
    } catch (error) {
      console.error('Error cargando mensajes desde caché:', error);
    }
    return [];
  };

  // Marcar mensajes como leídos
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
    }, [userId, matchId])
  );

  // Cargar mensajes desde la API con fallback a caché
  const loadMessages = async (currentUserId = null, showFromCache = true) => {
    try {
      const id = currentUserId || userId || await getUserIdFromToken();
      
      // Primero mostrar desde caché si está disponible
      if (showFromCache && id) {
        const cachedMessages = await loadMessagesFromCache();
        if (cachedMessages.length > 0) {
          console.log('📱 Mensajes cargados desde caché:', cachedMessages.length);
          // Auto-scroll al final
          setTimeout(() => {
            if (flatListRef.current && cachedMessages.length > 0) {
              flatListRef.current.scrollToEnd({ animated: false });
            }
          }, 100);
        }
      }

      // Luego cargar desde API
      console.log('🔄 Cargando mensajes para match:', matchId);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`http://192.168.0.13:3000/api/messages/match_${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const existingMessages = await response.json();
        console.log('📨 Mensajes cargados desde API:', existingMessages.length);

        // Mapear mensajes
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
        
        // Guardar en caché
        if (id) {
          await saveMessagesToCache(formattedMessages);
        }
        
        // Auto-scroll al final
        setTimeout(() => {
          if (flatListRef.current && formattedMessages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: false });
          }
        }, 100);
      } else {
        console.error('❌ Error al cargar mensajes desde API:', response.status);
        // Si falla la API, al menos tenemos los mensajes del caché
      }
    } catch (error) {
      console.error('❌ Error cargando mensajes:', error);
      // En caso de error de red, los mensajes del caché siguen disponibles
    }
  };

  // Sincronizar mensajes - combinar caché con API
  const syncMessages = async (newMessage) => {
    setMessages(prevMessages => {
      // Verificar si el mensaje ya existe
      const messageExists = prevMessages.some(existingMsg => 
        existingMsg._id === newMessage._id ||
        (existingMsg.content === newMessage.content && 
         existingMsg.from.toString() === newMessage.from.toString() &&
         Math.abs(new Date(existingMsg.createdAt) - new Date(newMessage.createdAt)) < 5000)
      );
      
      if (!messageExists) {
        const updatedMessages = [...prevMessages, newMessage]
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        // Guardar en caché
        saveMessagesToCache(updatedMessages);
        
        // Auto-scroll
        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
        
        return updatedMessages;
      }
      return prevMessages;
    });
  };

  // Setup inicial y configuración del socket
  useEffect(() => {
    let isMounted = true;
    let cleanup = null;
    
    const setup = async () => {
      try {
        const id = await getUserIdFromToken();
        if (!isMounted) return;
        setUserId(id);

        const roomId = `match_${matchId}`;
        
        // Configurar eventos del socket
        if (socket) {
          const handleConnect = () => {
            console.log('🔌 Socket conectado');
            setIsConnected(true);
            socket.emit('JoinRoom', { roomId });
            console.log('✅ Joined room:', roomId);
          };

          const handleDisconnect = () => {
            console.log('🔌 Socket desconectado');
            setIsConnected(false);
          };

          const handlePrivateMessage = (msg) => {
            console.log('📩 Mensaje recibido via socket:', msg);
            
            if (msg.roomId === roomId) {
              const newMessage = {
                content: msg.content,
                from: msg.from || msg.senderId,
                to: msg.to || msg.receiverId,
                fromSelf: (msg.from || msg.senderId).toString() === id.toString(),
                createdAt: msg.createdAt || new Date().toISOString(),
                roomId: msg.roomId,
                _id: msg._id || `temp_${Date.now()}_${Math.random()}`
              };
              
              syncMessages(newMessage);
            }
          };

          if (socket.connected) {
            handleConnect();
          }

          socket.on('connect', handleConnect);
          socket.on('disconnect', handleDisconnect);
          socket.on('privateMessage', handlePrivateMessage);
          
          cleanup = () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('privateMessage', handlePrivateMessage);
          };
        }

        // Cargar mensajes
        await loadMessages(id);

      } catch (error) {
        console.error('❌ Error en setup:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (matchId) {
      setup();
    }

    return () => {
      isMounted = false;
      if (cleanup) cleanup();
    };
  }, [socket, matchId]);

  // Recargar mensajes cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      if (userId && matchId) {
        loadMessages(userId, false); // No mostrar caché, solo recargar desde API
      }
    }, [userId, matchId])
  );

  const sendMessage = async () => {
    if (!inputMessage.trim() || !userId || !matchedUser || isSending) return;

    setIsSending(true);
    const messageContent = inputMessage.trim();
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    
    const messageData = {
      roomId: `match_${matchId}`,
      senderId: userId,
      receiverId: matchedUser._id,
      content: messageContent,
    };

    // Mensaje temporal para UI inmediata
    const tempMessage = {
      content: messageContent,
      from: userId,
      to: matchedUser._id,
      fromSelf: true,
      roomId: `match_${matchId}`,
      createdAt: new Date().toISOString(),
      _id: tempId,
      isTemporary: true,
    };

    // Agregar mensaje temporalmente
    setMessages((prev) => {
      const updated = [...prev, tempMessage];
      // Guardar en caché incluso el mensaje temporal
      saveMessagesToCache(updated);
      return updated;
    });
    
    setInputMessage('');

    // Scroll al final
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 50);

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
        console.log('✅ Mensaje guardado en BD:', savedMessage);
        
        // Reemplazar mensaje temporal con el guardado
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
          
          // Actualizar caché
          saveMessagesToCache(updated);
          return updated;
        });

        // Enviar por socket solo si está conectado
        if (socket && socket.connected) {
          const socketMessage = {
            ...messageData,
            from: userId,
            to: matchedUser._id,
            createdAt: savedMessage.createdAt,
            _id: savedMessage._id,
          };
          
          socket.emit('privateMessage', socketMessage);
          console.log('🔄 Mensaje enviado por socket:', socketMessage);
        }

      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      
      // Remover mensaje temporal y mostrar error
      setMessages((prev) => {
        const updated = prev.filter(msg => msg._id !== tempId);
        saveMessagesToCache(updated);
        return updated;
      });
      
      Alert.alert(
        'Error al enviar mensaje',
        'No se pudo enviar el mensaje. ¿Deseas intentar de nuevo?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Reintentar', 
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
          <Text style={styles.backButton}>← Volver</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {matchedUser?.name || 'Usuario'}
          </Text>
          <Text style={[styles.connectionStatus, { color: isConnected ? '#4CAF50' : '#ff9800' }]}>
            {isConnected ? 'En línea' : 'Reconectando...'}
          </Text>
        </View>
        <Text style={styles.messageCount}>
          {messages.length} mensajes
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
          placeholder="Escribe un mensaje..."
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
            {isSending ? '...' : 'Enviar'}
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
  },
  connectionStatus: {
    fontSize: 10,
    marginTop: 2,
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