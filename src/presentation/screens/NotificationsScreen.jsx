import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { globalStyles } from '../../shared/globalStyles';
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
          source={{ uri: matchedUser?.profilePhoto?.[0] }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{matchedUser?.name}</Text>
      </View>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#ff3366" style={{ marginTop: 40 }} />;
  }

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Notifications</Text>

      {matches.length === 0 ? (
        <Text style={{ marginTop: 20 }}>You don't have any new matches yet</Text>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderMatch}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});
