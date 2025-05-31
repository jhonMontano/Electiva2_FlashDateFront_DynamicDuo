import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import Icon from 'react-native-vector-icons/Ionicons';

import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import ConversationScreen from '../screens/ConversationScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';

import UserRepository from '../../infraestructure/api/UserRepository';
import { getUserIdFromToken } from '../../shared/decodeToken';

import { useSocket } from '../../infraestructure/socket/socket';

const Tab = createBottomTabNavigator();
const ChatStack = createNativeStackNavigator();
const userRepository = new UserRepository();

function ChatStackNavigator() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatList" component={ChatScreen} />
      <ChatStack.Screen name="ConversationScreen" component={ConversationScreen} />
    </ChatStack.Navigator>
  );
}

export default function BottomTabsNavigator() {
  const [hasNewMatch, setHasNewMatch] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    const checkInitialMatches = async () => {
      try {
        const id = await getUserIdFromToken();
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
          console.warn('No token found');
          return;
        }

        const matches = await userRepository.getMatchesByUserId(id, token);

        if (!Array.isArray(matches)) {
          console.warn('Matches is not an array:', matches);
          return;
        }

        const lastSeen = await AsyncStorage.getItem('lastSeenMatches');
        
        if (!lastSeen) {
          setHasNewMatch(matches.length > 0);
          return;
        }

        const lastSeenDate = new Date(lastSeen);
        
        if (isNaN(lastSeenDate.getTime())) {
          console.warn('Invalid lastSeen date:', lastSeen);
          setHasNewMatch(matches.length > 0);
          return;
        }

        const unseen = matches.some((match) => {
          if (!match.createdAt) {
            console.warn('Match without createdAt:', match);
            return false;
          }
          
          const matchDate = new Date(match.createdAt);
          
          if (isNaN(matchDate.getTime())) {
            console.warn('Invalid match date:', match.createdAt);
            return false;
          }
          
          return matchDate > lastSeenDate;
        });

        setHasNewMatch(unseen);
      } catch (error) {
        console.error('Error checking new matches:', error.message);
        console.error('Full error:', error);
        
        setHasNewMatch(false);
      }
    };

    checkInitialMatches();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const setupListeners = async () => {
      if (!socket) return;

      try {
        const id = await getUserIdFromToken();
        
        if (!id) {
          console.warn('No user ID found');
          return;
        }

        socket.emit('JoinRoom', { roomId: id });

        socket.on('newMatch', (data) => {
          console.log('New match received:', data);
          if (isMounted) {
            setHasNewMatch(true);
          }
        });
      } catch (error) {
        console.error('Error setting up socket listeners:', error);
      }
    };

    setupListeners();

    return () => {
      isMounted = false;
      if (socket) {
        socket.off('newMatch');
      }
    };
  }, [socket]);

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
            default:
              iconName = 'help-outline';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#e91e63',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chat" component={ChatStackNavigator} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarBadge: hasNewMatch ? '•' : null,
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}