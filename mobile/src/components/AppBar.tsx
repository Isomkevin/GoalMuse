import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { colors } from '../theme/colors';

interface AppBarProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  subtitle?: string;
  /** When 'left', title is large and left-aligned (no left action area). */
  titleAlign?: 'left' | 'center';
}

export function AppBar({ title, showBack, onBack, leftAction, rightAction, subtitle, titleAlign = 'center' }: AppBarProps) {
  const insets = useSafeAreaInsets();
  const isTitleLeft = titleAlign === 'left';

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <View style={[styles.left, isTitleLeft && styles.leftGrow]}>
          {!isTitleLeft && showBack && onBack ? (
            <TouchableOpacity onPress={onBack} style={styles.iconBtn} hitSlop={12}>
              <Icon name="arrow_back_ios" size={24} color={colors.text} />
            </TouchableOpacity>
          ) : !isTitleLeft && leftAction ? (
            leftAction
          ) : isTitleLeft ? (
            <Text style={styles.titleLeft} numberOfLines={1}>
              {title}
            </Text>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>
        {!isTitleLeft && (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        )}
        <View style={[styles.right, isTitleLeft && styles.rightFlex]}>{rightAction ?? <View style={styles.placeholder} />}</View>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingBottom: 8,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  left: { minWidth: 48, alignItems: 'flex-start' },
  leftGrow: { flex: 1 },
  right: { minWidth: 48, alignItems: 'flex-end' },
  rightFlex: { flex: 1 },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 8,
  },
  titleLeft: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.textMuted,
    paddingHorizontal: 18,
    marginTop: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: { width: 48, height: 48 },
});
