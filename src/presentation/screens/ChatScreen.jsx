import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserRepository from '../../infraestructure/api/UserRepository';
import { getUserIdFromToken } from '../../shared/decodeToken';
import { useIsFocused, useNavigation } from '@react-navigation/native';

const userRepository = new UserRepository();

export default function ChatScreen() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [readMessages, setReadMessages] = useState(new Set());
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const id = await getUserIdFromToken();
        setUserId(id);
        const token = await AsyncStorage.getItem('token');
        const data = await userRepository.getMatchesByUserId(id, token);
        
        const readMessagesData = await AsyncStorage.getItem(`readMessages_${id}`);
        const readMessagesSet = readMessagesData ? new Set(JSON.parse(readMessagesData)) : new Set();
        setReadMessages(readMessagesSet);
        
        const matchesWithMessages = await Promise.all(
          (data || []).map(async (match) => {
            try {
              const messagesResponse = await fetch(`http://192.168.0.13:3000/api/messages/match_${match._id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              
              if (messagesResponse.ok) {
                const messages = await messagesResponse.json();
                
                const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
                
                const unreadCount = messages.filter(msg => 
                  msg.receiverId.toString() === id.toString() && 
                  !readMessagesSet.has(msg._id.toString())
                ).length;
                
                return {
                  ...match,
                  lastMessage: lastMessage ? {
                    content: lastMessage.content,
                    createdAt: lastMessage.createdAt,
                    senderId: lastMessage.senderId
                  } : null,
                  unreadCount: unreadCount,
                  totalMessages: messages.length
                };
              } else {
                console.warn(`Error in match ${match._id}: ${messagesResponse.status}`);
              }
              return { ...match, lastMessage: null, unreadCount: 0, totalMessages: 0 };
            } catch (error) {
              console.error(`❌ Error fetching messages for match ${match._id}:`, error);
              return { ...match, lastMessage: null, unreadCount: 0, totalMessages: 0 };
            }
          })
        );

        matchesWithMessages.sort((a, b) => {
          if (!a.lastMessage && !b.lastMessage) return 0;
          if (!a.lastMessage) return 1;
          if (!b.lastMessage) return -1;
          return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
        });

        setMatches(matchesWithMessages);
      } catch (error) {
        console.error('Error fetching matches:', error);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    if (isFocused) {
      fetchMatches();
    } else {
      setLoading(false);
    }
  }, [isFocused]);

  const markConversationAsRead = async (matchId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const messagesResponse = await fetch(`http://192.168.0.13:3000/api/messages/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (messagesResponse.ok) {
        const messages = await messagesResponse.json();
        const receivedMessageIds = messages
          .filter(msg => msg.receiverId.toString() === userId.toString())
          .map(msg => msg._id.toString());
        
        const newReadMessages = new Set([...readMessages, ...receivedMessageIds]);
        setReadMessages(newReadMessages);
        
        await AsyncStorage.setItem(
          `readMessages_${userId}`, 
          JSON.stringify([...newReadMessages])
        );
        
        setMatches(prevMatches => 
          prevMatches.map(match => 
            match._id === matchId 
              ? { ...match, unreadCount: 0 }
              : match
          )
        );
        
      }
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const openConversation = (match) => {
    if (!userId) {
      console.warn(' No userId available');
      return;
    }

    const matchedUser = match.users.find(u => u._id !== userId);

    if (!matchedUser) {
      console.warn('No matched user found for match:', match);
      return;
    }

    if (match.unreadCount > 0) {
      markConversationAsRead(match._id);
    }

    navigation.navigate('ConversationScreen', {
      matchId: match._id,
      matchedUser,
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const messageDate = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 24 * 7) {
      return messageDate.toLocaleDateString('es-ES', { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const truncateMessage = (message, maxLength = 45) => {
    if (!message) return '';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  const renderItem = ({ item }) => {
    const matchedUser = item.users.find(user => user._id !== userId);
    if (!matchedUser) return null;

    const isLastMessageFromMe = item.lastMessage?.senderId.toString() === userId.toString();
    const hasUnreadMessages = item.unreadCount > 0;

    return (
      <TouchableOpacity style={styles.chatItem} onPress={() => openConversation(item)}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: matchedUser?.profilePhoto?.[0] || 'https://via.placeholder.com/60' }}
            style={styles.avatar}
          />
          {hasUnreadMessages && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {item.unreadCount > 9 ? '9+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.messageInfo}>
          <View style={styles.nameTimeContainer}>
            <Text style={[styles.name, hasUnreadMessages && styles.boldName]}>
              {matchedUser?.name || 'Sin nombre'}
            </Text>
            {item.lastMessage && (
              <Text style={styles.time}>
                {formatTime(item.lastMessage.createdAt)}
              </Text>
            )}
          </View>
          
          {item.lastMessage ? (
            <View style={styles.messageContainer}>
              <Text style={[
                styles.lastMessage, 
                hasUnreadMessages && styles.boldMessage
              ]}>
                {isLastMessageFromMe ? 'Tú: ' : ''}
                {truncateMessage(item.lastMessage.content)}
              </Text>
              <Text style={styles.messageCounter}>
                {item.totalMessages} message{item.totalMessages !== 1 ? 's' : ''}
              </Text>
            </View>
          ) : (
            <Text style={styles.noMessages}>
              ¡Start the conversation!
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff3366" />
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#fff' }}>
      <Text style={styles.title}>Chats</Text>
      {matches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You have no active conversations.</Text>
          <Text style={styles.emptySubText}>When you have matches, they will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item._id} 
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: -10,
    color: '#333',
    padding: 30
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  chatItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    alignItems: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 84,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ff3366',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  unreadText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  messageInfo: {
    flex: 1,
  },
  nameTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    color: '#333',
  },
  boldName: {
    fontWeight: 'bold',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  lastMessage: {
    fontSize: 15,
    color: '#666',
    lineHeight: 20,
  },
  boldMessage: {
    fontWeight: '600',
    color: '#333',
  },
  noMessages: {
    fontSize: 15,
    color: '#999',
    fontStyle: 'italic',
  },
});