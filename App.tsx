import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, Text, View, StyleSheet } from 'react-native';
import { GpxProvider, useGpx, SyncStatus } from './src/context/GpxContext';
import { C, FF, injectFonts } from './src/theme';

import MapScreen from './src/screens/MapScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import JournalScreen from './src/screens/JournalScreen';
import ChecklistScreen from './src/screens/ChecklistScreen';
import RetourScreen from './src/screens/RetourScreen';
import TerrainScreen from './src/screens/TerrainScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Carte',   icon: '🗺',  component: MapScreen },
  { name: 'Treks',   icon: '⛰',  component: DashboardScreen },
  { name: 'Journal', icon: '✎',   component: JournalScreen },
  { name: 'Sac',     icon: '✓',   component: ChecklistScreen },
  { name: 'Retour',  icon: '🚌',  component: RetourScreen },
  { name: 'Terrain', icon: '◉',   component: TerrainScreen },
];

const SYNC_META: Record<SyncStatus, { dot: string; label: string }> = {
  idle:    { dot: '#94a3b8', label: 'local' },
  syncing: { dot: '#fbbf24', label: 'sync…' },
  ok:      { dot: '#4ade80', label: 'sauvé' },
  error:   { dot: '#ef4444', label: 'erreur' },
};

function AppHeader({ isOnline }: { isOnline: boolean }) {
  const { syncStatus } = useGpx();
  const meta = SYNC_META[isOnline ? syncStatus : 'idle'];
  const dotColor = isOnline ? meta.dot : '#ef4444';
  const label    = isOnline ? meta.label : 'offline';
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
        <View style={[h.statusDot, { backgroundColor: dotColor }]} />
        <Text style={h.statusText}>{label}</Text>
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
  statusText: {
    fontFamily: FF.mono, fontSize: 9, letterSpacing: 1,
    color: C.paper, opacity: 0.6, textTransform: 'uppercase',
  },
});
