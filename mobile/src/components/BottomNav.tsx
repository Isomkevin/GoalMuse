import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Icon } from './Icon';
import { colors } from '../theme/colors';

type TabName = 'Boards' | 'Tracking' | 'Insights' | 'Settings';

const tabs: { name: TabName; route: string; icon: string }[] = [
  { name: 'Boards', route: 'Boards', icon: 'grid_view' },
  { name: 'Tracking', route: 'Goals', icon: 'schedule' },
  { name: 'Insights', route: 'Insights', icon: 'analytics' },
  { name: 'Settings', route: 'Profile', icon: 'settings' },
];

export function BottomNav() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const currentRoute = route.name;
  const   tabRouteNames: Record<string, string> = {
    BoardsList: 'Boards',
    BoardDetail: 'Boards',
    AddGoalFromBoard: 'Boards',
    BoardDetailGrid: 'Boards',
    GoalsList: 'Goals',
    AddGoal: 'Goals',
    EditGoal: 'Goals',
    StatsHome: 'Insights',
    Insights: 'Insights',
    Account: 'Profile',
    TasksJournal: 'Goals',
    Voice: 'Insights',
    VoiceActive: 'Insights',
  };
  const activeTab = tabRouteNames[currentRoute] ?? currentRoute;

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.inner}>
        {tabs.map(({ name, route: routeName, icon }) => {
          const isActive = activeTab === routeName;
          return (
            <Pressable
              key={routeName}
              onPress={() => navigation.navigate(routeName)}
              style={styles.tab}
            >
              <Icon
                name={icon}
                size={28}
                color={isActive ? colors.primary : colors.textMuted}
              />
              <Text
                style={[styles.label, isActive && styles.labelActive]}
                numberOfLines={1}
              >
                {name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    backgroundColor: colors.cardBg,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textMuted,
  },
  labelActive: {
    fontWeight: '700',
    color: colors.primary,
  },
});
