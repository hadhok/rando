import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, Text } from 'react-native';
import { GpxProvider } from './src/context/GpxContext';
import { TrekProvider } from './src/context/TrekContext';

import MapScreen from './src/screens/MapScreen';
import TrekScreen from './src/screens/TrekScreen';
import RouteScreen from './src/screens/RouteScreen';
import SpotsScreen from './src/screens/SpotsScreen';
import InfoScreen from './src/screens/InfoScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  Carte:  '🗺',
  Trek:   '🏕',
  Route:  '📍',
  Spots:  '🏠',
  Infos:  '📡',
};

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>
      {TAB_ICONS[label] ?? '●'}
    </Text>
  );
}

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <GpxProvider>
      <TrekProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarIcon: ({ focused }) => (
                <TabIcon label={route.name} focused={focused} />
              ),
              tabBarActiveTintColor: '#264653',
              tabBarInactiveTintColor: '#aaa',
              tabBarStyle: {
                backgroundColor: '#fff',
                borderTopColor: '#e8e8e8',
                height: 62,
                paddingBottom: 8,
                paddingTop: 2,
              },
              tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            })}
          >
            <Tab.Screen name="Carte"  component={MapScreen}   />
            <Tab.Screen name="Trek"   component={TrekScreen}  />
            <Tab.Screen name="Route"  component={RouteScreen} />
            <Tab.Screen name="Spots"  component={SpotsScreen} />
            <Tab.Screen name="Infos"  component={InfoScreen}  />
          </Tab.Navigator>
        </NavigationContainer>
      </TrekProvider>
    </GpxProvider>
  );
}
