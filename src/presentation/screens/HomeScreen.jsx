import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import SwipeCard from '../../presentation/components/SwipeCard';
import UserRepository from '../../infraestructure/api/UserRepository';
import { getUserIdFromToken } from '../../shared/decodeToken';

const userRepository = new UserRepository();

export default function HomeScreen() {
  const [loggedUserId, setLoggedUserId] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      const userId = await getUserIdFromToken();
      if (userId) {
        setLoggedUserId(userId);
        await fetchProfiles(userId);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
    }
  };

  const fetchProfiles = async (userId) => {
    try {
      const users = await userRepository.getAllUserExcept(userId);
      setProfiles(users);
    } catch (error) {
      console.log('Error uploading profiles ', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipeLeft = async (user) => {
    await sendSwipe(user, 'dislike');
    setCurrentIndex(prev => prev + 1);
  };

  const handleSwipeRight = async (user) => {
    const result = await sendSwipe(user, 'like');
    if (result?.match) {
      alert('¡You have a new match!');
    }
    setCurrentIndex(prev => prev + 1);
  };

  const sendSwipe = async (user, action) => {
    try {
      const res = await userRepository.sendSwipe(loggedUserId, user._id, action);
      return res;
    } catch (error) {
      console.log(`Error to do swipe (${action}):`, error)
    }
  };

  if (loading || !loggedUserId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3C38" />
      </View>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Home</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>There are no more profiles for now.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
      </View>
      <View style={styles.cardContainer}>
        {profiles
          .slice(currentIndex)
          .reverse()
          .map((user) => (
            <SwipeCard
              key={user._id}
              user={{
                ...user,
                fotoPerfil: user.profilePhoto[0],
                ubicacion: `${user.location.city}, ${user.location.country}`,
              }}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
            />
          ))}
      </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
});