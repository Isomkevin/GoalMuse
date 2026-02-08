import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppBar } from '../components/AppBar';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';

const FREE_FEATURES = [
  'Up to 3 boards',
  'Basic goal tracking',
  'Weekly email digest',
];

const PREMIUM_FEATURES = [
  'Unlimited boards',
  'Advanced analytics',
  'Voice goals & journal',
  'Priority support',
  'No ads',
];

export function SubscriptionPlanScreen() {
  const navigation = useNavigation<any>();
  const isPremium = false; // Could come from context/AsyncStorage later

  return (
    <View style={styles.container}>
      <AppBar title="Subscription Plan" showBack onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.currentCard}>
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>
              {isPremium ? 'Premium' : 'Free'}
            </Text>
          </View>
          <Text style={styles.currentTitle}>
            {isPremium ? 'You’re on Premium' : 'You’re on the Free plan'}
          </Text>
          <Text style={styles.currentSubtitle}>
            {isPremium
              ? 'Thanks for supporting GoalMuse. You have access to all features.'
              : 'Upgrade to Premium for unlimited boards and more.'}
          </Text>
        </View>

        {!isPremium && (
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <View style={styles.planIconWrap}>
                <Icon name="star" size={28} color={colors.white} />
              </View>
              <View style={styles.planTitleWrap}>
                <Text style={styles.planTitle}>Premium</Text>
                <Text style={styles.planPrice}>$4.99 / month</Text>
              </View>
            </View>
            <View style={styles.features}>
              {PREMIUM_FEATURES.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Icon name="check" size={20} color={colors.primary} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
            <Pressable style={styles.upgradeBtn}>
              <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.freeSection}>
          <Text style={styles.freeSectionTitle}>Free plan includes</Text>
          {FREE_FEATURES.map((f) => (
            <View key={f} style={styles.freeRow}>
              <Icon name="check" size={18} color={colors.gray500} />
              <Text style={styles.freeRowText}>{f}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  currentCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  currentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    marginBottom: 12,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  currentTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  currentSubtitle: { fontSize: 15, color: colors.gray500, marginTop: 8 },

  planCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: 24,
  },
  planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  planIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  planTitleWrap: {},
  planTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  planPrice: { fontSize: 16, color: colors.primary, fontWeight: '600', marginTop: 2 },
  features: { marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  featureText: { fontSize: 15, color: colors.text, marginLeft: 10 },
  upgradeBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeBtnText: { fontSize: 16, fontWeight: '600', color: colors.white },

  freeSection: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 16,
  },
  freeSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: 12,
  },
  freeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  freeRowText: { fontSize: 14, color: colors.gray500, marginLeft: 8 },
});
