import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, StyleSheet} from 'react-native';
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
              const messages = await userRepository.getMessagesByMatchId(match._id, token);

              const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
              const unreadCount = messages.filter(msg =>
                msg.receiverId.toString() === id.toString() &&
                !readMessagesSet.has(msg._id.toString())
              ).length;

              return {
                ...match,
                lastMessage: lastMessage
                  ? {
                    content: lastMessage.content,
                    createdAt: lastMessage.createdAt,
                    senderId: lastMessage.senderId,
                  }
                  : null,
                unreadCount,
                totalMessages: messages.length,
              };
            } catch (error) {
              console.error(`Error fetching messages for match ${match._id}:`, error);
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
      const messages = await userRepository.getMessages(matchId, token);

      const receivedMessageIds = messages
        .filter(msg => msg.receiverId.toString() === userId.toString())
        .map(msg => msg._id.toString());

      const newReadMessages = new Set([...readMessages, ...receivedMessageIds]);
      setReadMessages(newReadMessages);

      await AsyncStorage.setItem(`readMessages_${userId}`, JSON.stringify([...newReadMessages]));

      setMatches(prevMatches =>
        prevMatches.map(match =>
          match._id === matchId ? { ...match, unreadCount: 0 } : match
        )
      );
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const openConversation = (match) => {
    if (!userId) return console.warn('No userId available');
    const matchedUser = match.users.find(u => u._id !== userId);
    if (!matchedUser) return console.warn('No matched user found');

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
        minute: '2-digit',
      });
    } else if (diffInHours < 24 * 7) {
      return messageDate.toLocaleDateString('es-ES', { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
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
          <Text style={styles.name}>{matchedUser?.name}</Text>
          <Text style={styles.messagePreview}>
            {isLastMessageFromMe ? 'You: ' : ''}
            {truncateMessage(item.lastMessage?.content)}
          </Text>
        </View>
        <Text style={styles.time}>
          {formatTime(item.lastMessage?.createdAt)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF3C38" />
      ) : (
        <>
          {matches.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>You don't have any chats yet</Text>
            </View>
          ) : (
            <FlatList
              data={matches}
              keyExtractor={(item) => item._id}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'left',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  avatarContainer: { 
    position: 'relative' 
  },
  avatar: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    marginRight: 12 
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3C38',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadText: { 
    color: 'white', 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  messageInfo: { 
    flex: 1 
  },
  name: { 
    fontSize: 16,
    fontWeight: 'bold' 
  },
  messagePreview: { 
    fontSize: 14, 
    color: '#555', 
    marginTop: 4 
  },
  time: { 
    fontSize: 12, 
    color: '#888' 
  },
});