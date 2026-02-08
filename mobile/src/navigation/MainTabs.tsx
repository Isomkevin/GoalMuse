import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BoardsStack } from './BoardsStack';
import { GoalsStack } from './GoalsStack';
import { StatsStack } from './StatsStack';
import { ProfileStack } from './ProfileStack';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tab.Screen name="Boards" component={BoardsStack} />
      <Tab.Screen name="Goals" component={GoalsStack} />
      <Tab.Screen name="Insights" component={StatsStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
