import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppBar } from '../components/AppBar';
import { BottomNav } from '../components/BottomNav';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';

type VoiceFlow = 'morning' | 'reflection' | 'nudge';

const VOICE_CARDS: { id: VoiceFlow; title: string; description: string; cta: string; icon: string; gradient: [string, string] }[] = [
  {
    id: 'morning',
    title: 'Morning planning',
    description: 'Set your intentions and focus your energy for the day ahead.',
    cta: 'Start my day',
    icon: 'light_mode',
    gradient: ['rgba(255,237,213,0.6)', 'rgba(10,125,164,0.2)'],
  },
  {
    id: 'reflection',
    title: 'End-of-day reflection',
    description: 'Review your progress and capture insights in your voice journal.',
    cta: 'Reflect on today',
    icon: 'dark_mode',
    gradient: ['rgba(49,46,129,0.4)', 'rgba(88,28,135,0.4)'],
  },
  {
    id: 'nudge',
    title: 'Gentle nudge',
    description: 'A soft audio reminder of your most critical next action.',
    cta: 'Read my next action',
    icon: 'volume_up',
    gradient: ['rgba(204,251,241,0.5)', 'rgba(191,219,254,0.5)'],
  },
];

export function VoiceScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <AppBar
        title="GoalMuse"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <Pressable style={styles.helpBtn}>
            <Icon name="help_outline" size={24} color={colors.text} />
          </Pressable>
        }
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.title}>Voice Selection</Text>
          <Text style={styles.subtitle}>Voice augments your board. Use one flow at a time.</Text>
        </View>
        <View style={styles.cards}>
          {VOICE_CARDS.map((card) => (
            <Pressable
              key={card.id}
              style={styles.card}
              onPress={() => navigation.navigate('VoiceActive', { flow: card.id })}
            >
              <View style={[styles.cardImage, { backgroundColor: card.gradient[0] }]}>
                <View style={styles.cardIconWrap}>
                  <Icon name={card.icon} size={24} color={colors.primary} />
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardDesc}>{card.description}</Text>
                <Pressable
                  style={styles.cta}
                  onPress={() => navigation.navigate('VoiceActive', { flow: card.id })}
                >
                  <Text style={styles.ctaText}>{card.cta}</Text>
                </Pressable>
              </View>
            </Pressable>
          ))}
        </View>
        <View style={styles.footerSpacer} />
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  helpBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },
  hero: { paddingVertical: 24, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.textMuted, textAlign: 'center', maxWidth: 280, lineHeight: 22 },
  cards: { gap: 16 },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    height: 100,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 16,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { padding: 20 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  cardDesc: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: 16 },
  cta: {
    alignSelf: 'flex-start',
    minWidth: 120,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  ctaText: { fontSize: 14, fontWeight: '600', color: colors.white },
  footerSpacer: { height: 40 },
});
