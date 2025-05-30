import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import SwipeCard from '../../presentation/components/SwipeCard';
import { globalStyles } from '../../shared/globalStyles';
import UserRepository from '../../infraestructure/api/UserRepository';
import { getUserIdFromToken } from '../../shared/decodeToken';

const userRepository = new UserRepository();

const styles = StyleSheet.create({
  homeTitle: {
    textAlign: 'left',
    marginTop: 20,
    zIndex: 10,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'right',
    alignItems: 'center',
  },
});

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
    return <ActivityIndicator size="large" color="#f26b6b" style={{ flex: 1 }} />;
  }

  if (currentIndex >= profiles.length) {
    return (
      <View style={globalStyles.container}>
        <Text>There are no more profiles for now.</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <Text style={[globalStyles.title, styles.homeTitle]}>Home</Text>
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