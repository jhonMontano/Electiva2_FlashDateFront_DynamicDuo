import React, { useRef } from 'react';
import { Animated, PanResponder, View, Image, Text, StyleSheet, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 120;

export default function SwipeCard({ user, onSwipeLeft, onSwipeRight }) {
  const position = useRef(new Animated.ValueXY()).current;

  const calculateAge = (birthday) => {
    if (!birthday) return '';

    const today = new Date();
    const birthDate = new Date(birthday);

    if (isNaN(birthDate.getTime())) return '';

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const formatBirthday = (birthday) => {
    if (!birthday) return '';

    const birthDate = new Date(birthday);
    if (isNaN(birthDate.getTime())) return birthday;

    return birthDate.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const forceSwipe = (direction) => {
    const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      direction === 'right' ? onSwipeRight(user) : onSwipeLeft(user);
      position.setValue({ x: 0, y: 0 });
    });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
    outputRange: ['-30deg', '0deg', '30deg'],
  });

  const cardStyle = {
    transform: [...position.getTranslateTransform(), { rotate }],
  };

  const userAge = calculateAge(user.birthday);

  return (
    <Animated.View {...panResponder.panHandlers} style={[styles.card, cardStyle]}>
      <Image source={{ uri: user.fotoPerfil }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>
          {user.name} {user.lastName}
        </Text>
        <Text style={styles.birthday}>
          {formatBirthday(user.birthday)}
        </Text>
        <Text>{userAge && `${userAge}`} years</Text>
        <Text>{user.gender}</Text>
        <Text style={styles.location}>{user.ubicacion}</Text>
        <Text>{user.description}</Text>
      </View>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH - 40,
    height: 600,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    position: 'absolute',
    elevation: 5,
  },
  image: {
    width: '100%',
    height: 350,
  },
  info: {
    padding: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  location: {
    fontSize: 16,
    color: 'gray',
  },
});
