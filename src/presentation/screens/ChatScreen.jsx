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
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const id = await getUserIdFromToken();
        setUserId(id);
        const token = await AsyncStorage.getItem('token');
        const data = await userRepository.getMatchesByUserId(id, token);
        setMatches(data);
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setLoading(false);
      }
    };
    if (isFocused) fetchMatches();
  }, [isFocused]);

  const openConversation = (match) => {
    console.log('📱 Navegando a conversación:', {
      matchId: match._id,
      matchedUser: match.users.find(u => u._id !== userId)
    });

    navigation.navigate('ConversationScreen', {
      matchId: match._id,
      matchedUser: match.users.find(u => u._id !== userId),
    });
  };

  const renderItem = ({ item }) => {
    const matchedUser = item.users.find(user => user._id !== userId);
    return (
      <TouchableOpacity style={styles.chatItem} onPress={() => openConversation(item)}>
        <Image source={{ uri: matchedUser?.profilePhoto?.[0] }} style={styles.avatar} />
        <View>
          <Text style={styles.name}>{matchedUser?.name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <ActivityIndicator size="large" color="#ff3366" style={{ marginTop: 40 }} />;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>Chats</Text>
      {matches.length === 0 ? (
        <Text>No tienes conversaciones activas.</Text>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chatItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
  },
});