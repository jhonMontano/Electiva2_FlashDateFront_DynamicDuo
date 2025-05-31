import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserIdFromToken } from '../../shared/decodeToken';
import UserRepository from '../../infraestructure/api/UserRepository';
import { useIsFocused } from '@react-navigation/native';

const userRepository = new UserRepository();

export default function NotificationsScreen() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const id = await getUserIdFromToken();
        setUserId(id);

        const token = await AsyncStorage.getItem('token');
        const data = await userRepository.getMatchesByUserId(id, token);
        setMatches(data);

        await AsyncStorage.setItem('lastSeenMatches', new Date().toISOString());
      } catch (error) {
        console.error('Error:', error.message);
      } finally {
        setLoading(false);
      }
    };

    if (isFocused) fetchMatches();
  }, [isFocused]);

  const renderMatch = ({ item }) => {
    const matchedUser = item.users.find(user => user._id !== userId);

    return (
      <View style={styles.matchCard}>
        <Image
          source={{ uri: matchedUser?.profilePhoto?.[0] || 'https://via.placeholder.com/60' }}
          style={styles.avatar}
        />
        <View style={styles.matchInfo}>
          <Text style={styles.name}>{matchedUser?.name} {matchedUser?.lastName}</Text>
          <Text style={styles.matchMessage}>
            ¡You matched with {matchedUser?.name || 'someone special'}!
          </Text>
          <Text style={styles.matchSubtext}>Now you can start chatting</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF3C38" />
      ) : (
        <>
          {matches.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>You don't have any new matches yet</Text>
            </View>
          ) : (
            <FlatList
              data={matches}
              keyExtractor={(item, index) => item._id || index.toString()}
              renderItem={renderMatch}
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
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  matchInfo: {
    flex: 1,
  },
  matchMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  matchSubtext: {
    fontSize: 14,
    color: '#666',
  },
});