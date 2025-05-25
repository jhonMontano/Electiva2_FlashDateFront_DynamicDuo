import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UserRepository from '../../infraestructure/api/UserRepository';
import { getUserIdFromToken } from '../../shared/decodeToken';

const Tab = createBottomTabNavigator();
const userRepository = new UserRepository();

export default function BottomTabsNavigator() {
  const [hasNewMatch, setHasNewMatch] = useState(false);

  useEffect(() => {
    const checkNewMatches = async () => {
      try {
        const id = await getUserIdFromToken();
        const token = await AsyncStorage.getItem('token');
        const matches = await userRepository.getMatchesByUserId(id, token);

        const lastSeen = await AsyncStorage.getItem('lastSeenMatches');
        const unseen = matches.some(
          (match) => new Date(match.createdAt) > new Date(lastSeen)
        );

        setHasNewMatch(unseen);
      } catch (error) {
        console.error('❌ Error revisando nuevos matches:', error.message);
      }
    };

    checkNewMatches();
    const interval = setInterval(checkNewMatches, 10000); // cada 10 segundos
    return () => clearInterval(interval);
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = 'home-outline';
              break;
            case 'Chat':
              iconName = 'chatbubble-outline';
              break;
            case 'Notifications':
              iconName = 'notifications-outline';
              break;
            case 'Profile':
              iconName = 'person-outline';
              break;
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#e91e63',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarBadge: hasNewMatch ? '•' : null, // puedes usar un número si quieres
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}