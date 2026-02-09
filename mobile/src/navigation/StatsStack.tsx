import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatsScreen } from '../screens/StatsScreen';
import { VoiceScreen } from '../screens/VoiceScreen';
import { VoiceActiveScreen } from '../screens/VoiceActiveScreen';
import { OpikDashboardScreen } from '../screens/OpikDashboardScreen';
import type { StatsStackParamList } from './types';

const Stack = createNativeStackNavigator<StatsStackParamList>();

export function StatsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StatsHome" component={StatsScreen} />
      <Stack.Screen name="Voice" component={VoiceScreen} />
      <Stack.Screen name="VoiceActive" component={VoiceActiveScreen} />
      <Stack.Screen name="OpikDashboard" component={OpikDashboardScreen} />
    </Stack.Navigator>
  );
}
