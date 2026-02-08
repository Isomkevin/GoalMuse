import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { AppBar } from '../components/AppBar';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';

const NOTIF_KEY = '@goalmuse/notifications';

interface NotificationPrefs {
  push: boolean;
  emailDigest: boolean;
  goalReminders: boolean;
}

const defaultPrefs: NotificationPrefs = {
  push: true,
  emailDigest: true,
  goalReminders: true,
};

export function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(NOTIF_KEY);
        if (raw) setPrefs({ ...defaultPrefs, ...JSON.parse(raw) });
      } catch (_) {}
      setLoaded(true);
    })();
  }, []);

  const updatePref = useCallback(
    async (key: keyof NotificationPrefs, value: boolean) => {
      const next = { ...prefs, [key]: value };
      setPrefs(next);
      try {
        await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(next));
      } catch (_) {}
    },
    [prefs]
  );

  return (
    <View style={styles.container}>
      <AppBar title="Notifications" showBack onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!loaded ? (
          <Text style={styles.loading}>Loading...</Text>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Push and in-app</Text>
              <View style={styles.row}>
                <View style={styles.rowIcon}>
                  <Icon name="notifications" size={24} color={colors.primary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>Push notifications</Text>
                  <Text style={styles.rowHint}>Get alerts for goals and reminders</Text>
                </View>
                <Switch
                  value={prefs.push}
                  onValueChange={(v) => updatePref('push', v)}
                  trackColor={{ false: colors.gray200, true: colors.primaryLight }}
                  thumbColor={prefs.push ? colors.primary : colors.gray400}
                />
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Email</Text>
              <View style={styles.row}>
                <View style={styles.rowIcon}>
                  <Icon name="mail" size={24} color={colors.primary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>Email digest</Text>
                  <Text style={styles.rowHint}>Weekly summary of your goals</Text>
                </View>
                <Switch
                  value={prefs.emailDigest}
                  onValueChange={(v) => updatePref('emailDigest', v)}
                  trackColor={{ false: colors.gray200, true: colors.primaryLight }}
                  thumbColor={prefs.emailDigest ? colors.primary : colors.gray400}
                />
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reminders</Text>
              <View style={styles.row}>
                <View style={styles.rowIcon}>
                  <Icon name="calendar_today" size={24} color={colors.primary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>Goal reminders</Text>
                  <Text style={styles.rowHint}>Remind me about upcoming deadlines</Text>
                </View>
                <Switch
                  value={prefs.goalReminders}
                  onValueChange={(v) => updatePref('goalReminders', v)}
                  trackColor={{ false: colors.gray200, true: colors.primaryLight }}
                  thumbColor={prefs.goalReminders ? colors.primary : colors.gray400}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  loading: { fontSize: 16, color: colors.gray500, textAlign: 'center', marginTop: 24 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowHint: { fontSize: 13, color: colors.gray500, marginTop: 2 },
});
