import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import MapScreen from './src/screens/MapScreen';
import EtapesScreen from './src/screens/EtapesScreen';
import RefugesScreen from './src/screens/RefugesScreen';
import UrgencesScreen from './src/screens/UrgencesScreen';

const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Carte: '🗺',
    Étapes: '📋',
    Refuges: '🏠',
    Urgences: '🆘',
  };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icons[label] ?? '●'}</Text>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon label={route.name} focused={focused} />
          ),
          tabBarActiveTintColor: '#264653',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#eee',
            height: 60,
            paddingBottom: 8,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        })}
      >
        <Tab.Screen name="Carte" component={MapScreen} />
        <Tab.Screen name="Étapes" component={EtapesScreen} />
        <Tab.Screen name="Refuges" component={RefugesScreen} />
        <Tab.Screen name="Urgences" component={UrgencesScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
