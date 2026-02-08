import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AppStateProvider } from './src/context/AppStateContext';
import { AuthStack } from './src/navigation/AuthStack';
import { RootStack } from './src/navigation/RootStack';
import { navigationRef } from './src/navigation/rootNavigation';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from './src/theme/colors';

function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthStack />;
  }

  return <RootStack />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppStateProvider>
            <NavigationContainer ref={navigationRef}>
              <RootNavigator />
              <StatusBar style="dark" />
            </NavigationContainer>
          </AppStateProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
