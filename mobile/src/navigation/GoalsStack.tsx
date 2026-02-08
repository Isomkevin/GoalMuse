import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GoalsListScreen } from '../screens/GoalsListScreen';
import { AddGoalScreen } from '../screens/AddGoalScreen';
import { EditGoalScreen } from '../screens/EditGoalScreen';
import { TasksJournalScreen } from '../screens/TasksJournalScreen';
import type { GoalsStackParamList } from './types';

const Stack = createNativeStackNavigator<GoalsStackParamList>();

export function GoalsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GoalsList" component={GoalsListScreen} />
      <Stack.Screen name="AddGoal" component={AddGoalScreen} />
      <Stack.Screen name="EditGoal" component={EditGoalScreen} />
      <Stack.Screen name="TasksJournal" component={TasksJournalScreen} />
    </Stack.Navigator>
  );
}
