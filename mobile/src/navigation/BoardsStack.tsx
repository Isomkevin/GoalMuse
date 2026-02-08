import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BoardsListScreen } from '../screens/BoardsListScreen';
import { BoardDetailScreen } from '../screens/BoardDetailScreen';
import { AddGoalScreen } from '../screens/AddGoalScreen';
import type { BoardsStackParamList } from './types';

const Stack = createNativeStackNavigator<BoardsStackParamList>();

export function BoardsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BoardsList" component={BoardsListScreen} />
      <Stack.Screen name="BoardDetail" component={BoardDetailScreen} />
      <Stack.Screen name="AddGoalFromBoard" component={AddGoalScreen} />
    </Stack.Navigator>
  );
}
