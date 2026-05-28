import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, Text, View, StyleSheet } from 'react-native';
import { GpxProvider } from './src/context/GpxContext';
import { C, FF, injectFonts } from './src/theme';

import MapScreen from './src/screens/MapScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ChecklistScreen from './src/screens/ChecklistScreen';
import RetourScreen from './src/screens/RetourScreen';
import MeteoScreen from './src/screens/MeteoScreen';
import TerrainScreen from './src/screens/TerrainScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Carte',   icon: '🗺',  component: MapScreen },
  { name: 'Treks',   icon: '⛰',  component: DashboardScreen },
  { name: 'Sac',     icon: '✓',   component: ChecklistScreen },
  { name: 'Retour',  icon: '🚌',  component: RetourScreen },
  { name: 'Météo',   icon: '☁',   component: MeteoScreen },
  { name: 'Terrain', icon: '◉',   component: TerrainScreen },
];

function AppHeader({ isOnline }: { isOnline: boolean }) {
  return (
    <View style={h.header}>
      <View style={h.logoRow}>
        <View style={h.logoBadge}>
          <Text style={h.logoEmoji}>⛰</Text>
        </View>
        <View>
          <Text style={h.appName}>RandoOS</Text>
          <Text style={h.appSub}>Préparation · Terrain · Offline</Text>
        </View>
      </View>
      <View style={h.statusRow}>
        <View style={[h.statusDot, isOnline ? h.dotOnline : h.dotOffline]} />
        <Text style={h.statusText}>{isOnline ? 'En ligne' : 'Hors ligne'}</Text>
      </View>
    </View>
  );
}

export default function App() {
  injectFonts();

  const [isOnline, setIsOnline] = useState(
    Platform.OS === 'web' && typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (Platform.OS === 'web') {
      if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
      const on = () => setIsOnline(true);
      const off = () => setIsOnline(false);
      window.addEventListener('online', on);
      window.addEventListener('offline', off);
      return () => {
        window.removeEventListener('online', on);
        window.removeEventListener('offline', off);
      };
    }
  }, []);

  return (
    <GpxProvider>
      <View style={styles.root}>
        <AppHeader isOnline={isOnline} />
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarIcon: ({ focused }) => (
                <Text style={{ fontSize: 17, opacity: focused ? 1 : 0.5 }}>
                  {TABS.find(t => t.name === route.name)?.icon ?? '●'}
                </Text>
              ),
              tabBarActiveTintColor: C.paper,
              tabBarInactiveTintColor: 'rgba(244,240,232,0.45)',
              tabBarActiveBackgroundColor: C.accent,
              tabBarInactiveBackgroundColor: C.ink2,
              tabBarStyle: {
                backgroundColor: C.ink2,
                borderTopWidth: 2,
                borderTopColor: C.accent,
                height: 58,
                paddingBottom: 6,
                paddingTop: 2,
              },
              tabBarLabelStyle: {
                fontSize: 8,
                fontFamily: FF.mono,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
              },
            })}
          >
            {TABS.map(tab => (
              <Tab.Screen
                key={tab.name}
                name={tab.name}
                component={tab.component}
              />
            ))}
          </Tab.Navigator>
        </NavigationContainer>
      </View>
    </GpxProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.ink },
});

const h = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBadge: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(244,240,232,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoEmoji: { fontSize: 16 },
  appName: {
    fontFamily: FF.display, fontSize: 18, fontWeight: '600',
    color: C.paper, letterSpacing: -0.5,
  },
  appSub: {
    fontFamily: FF.mono, fontSize: 8, letterSpacing: 1.5,
    color: C.paper, opacity: 0.5, textTransform: 'uppercase', marginTop: 1,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  dotOnline: { backgroundColor: '#4ade80' },
  dotOffline: { backgroundColor: '#ef4444' },
  statusText: {
    fontFamily: FF.mono, fontSize: 9, letterSpacing: 1,
    color: C.paper, opacity: 0.6, textTransform: 'uppercase',
  },
});
