import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';

export function NotFoundScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <View style={styles.bg1} />
      <View style={styles.bg2} />
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <View style={styles.iconPulse} />
          <View style={styles.iconCircle}>
            <Icon name="explore_off" size={40} color={colors.primary} />
          </View>
        </View>
        <Text style={styles.title}>This screen doesn't exist.</Text>
        <Text style={styles.desc}>
          It seems you've wandered off the path. Let's get you back to your vision board.
        </Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Main', { screen: 'Boards' })}
        >
          <Text style={styles.primaryBtnText}>Back to GoalMuse</Text>
        </Pressable>
        <Pressable onPress={() => {}}>
          <Text style={styles.secondaryBtn}>Contact Support</Text>
        </Pressable>
      </View>
      <View style={styles.indicator} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  bg1: {
    position: 'absolute',
    top: '-10%',
    left: '-10%',
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: colors.primaryLight,
  },
  bg2: {
    position: 'absolute',
    bottom: '-10%',
    right: '-10%',
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: colors.primaryLight,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconWrap: {
    position: 'relative',
    marginBottom: 40,
  },
  iconPulse: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    top: -8,
    left: -8,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  desc: {
    fontSize: 16,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  primaryBtn: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  secondaryBtn: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray400,
  },
  indicator: {
    position: 'absolute',
    bottom: 8,
    width: 128,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray200,
  },
});
