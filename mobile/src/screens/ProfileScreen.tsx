import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useDemo } from '../context/DemoContext';
import { BottomNav } from '../components/BottomNav';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';
import type { ProfileStackParamList } from '../navigation/types';

const menuItems: Array<{
  icon: 'person' | 'lock' | 'notifications' | 'star';
  label: string;
  badge?: string;
  route: keyof ProfileStackParamList;
}> = [
  { icon: 'person', label: 'Personal Information', route: 'PersonalInformation' },
  { icon: 'lock', label: 'Security & Password', route: 'SecurityPassword' },
  { icon: 'notifications', label: 'Notifications', route: 'Notifications' },
  { icon: 'star', label: 'Subscription Plan', badge: 'Premium', route: 'SubscriptionPlan' },
];

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList, 'Account'>>();
  const { user, logout } = useAuth();
  const { useMockData } = useDemo();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.sheet} contentContainerStyle={[styles.sheetContent, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.sheetTitle}>Account</Text>
          <Pressable onPress={() => (navigation.getParent() as any)?.navigate('Boards')}><Text style={styles.doneBtn}>Done</Text></Pressable>
        </View>
        {useMockData ? (
          <View style={styles.mockBanner}>
            <Icon name="info" size={18} color={colors.white} />
            <Text style={styles.mockBannerText}>Using mock data for demo purposes</Text>
          </View>
        ) : null}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user?.displayName || user?.email || '?').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.avatarEdit}><Icon name="edit" size={16} color={colors.white} /></View>
          </View>
          <Text style={styles.profileName}>{user?.displayName || 'GoalMuse Member'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'you@example.com'}</Text>
        </View>
        <View style={styles.menu}>
          {menuItems.map((item) => (
            <Pressable
              key={item.label}
              style={styles.menuRow}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={styles.menuIconWrap}><Icon name={item.icon} size={24} color={colors.primary} /></View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              {item.badge ? <View style={styles.badge}><Text style={styles.badgeText}>{item.badge}</Text></View> : null}
              <Icon name="chevron_right" size={24} color={colors.gray400} />
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.logoutBtn} onPress={() => logout()}>
          <Icon name="logout" size={24} color={colors.red} />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
        <Text style={styles.version}>Version 2.4.1 (Build 108)</Text>
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  sheet: { flex: 1, backgroundColor: colors.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, marginTop: 40, overflow: 'hidden' },
  sheetContent: { paddingHorizontal: 24 },
  handle: { alignSelf: 'center', width: 48, height: 6, borderRadius: 3, backgroundColor: colors.gray200, marginTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  headerSpacer: { width: 40 },
  sheetTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  doneBtn: { fontSize: 14, fontWeight: '500', color: colors.primary },
  mockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  mockBannerText: { fontSize: 14, fontWeight: '600', color: colors.white },
  profileSection: { alignItems: 'center', paddingVertical: 32 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  avatarText: { fontSize: 36, fontWeight: '700', color: colors.white },
  avatarEdit: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white },
  profileName: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 16 },
  profileEmail: { fontSize: 16, color: colors.gray500, marginTop: 4 },
  menu: { gap: 4 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, paddingHorizontal: 16, backgroundColor: colors.gray50, borderRadius: 12, marginBottom: 4 },
  menuIconWrap: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: colors.text },
  badge: { backgroundColor: colors.primary + '33', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 },
  badgeText: { fontSize: 10, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56, borderRadius: 12, backgroundColor: colors.redLight, marginTop: 32 },
  logoutText: { fontSize: 16, fontWeight: '600', color: colors.red },
  version: { textAlign: 'center', fontSize: 12, color: colors.gray400, marginTop: 24 },
});
