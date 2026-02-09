import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PersonalInformationScreen } from '../screens/PersonalInformationScreen';
import { SecurityPasswordScreen } from '../screens/SecurityPasswordScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { SubscriptionPlanScreen } from '../screens/SubscriptionPlanScreen';
import { AdvancedFeaturesScreen } from '../screens/AdvancedFeaturesScreen';
import type { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Account" component={ProfileScreen} />
      <Stack.Screen name="PersonalInformation" component={PersonalInformationScreen} />
      <Stack.Screen name="SecurityPassword" component={SecurityPasswordScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="SubscriptionPlan" component={SubscriptionPlanScreen} />
      <Stack.Screen name="AdvancedFeatures" component={AdvancedFeaturesScreen} />
    </Stack.Navigator>
  );
}
