import React from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Icon } from './Icon';
import { colors } from '../theme/colors';

export const GOAL_CATEGORIES = ['Career', 'Health', 'Personal', 'Finance'] as const;
export const OTHER_CATEGORY_LABEL = 'Other';
export type GoalCategory = (typeof GOAL_CATEGORIES)[number];

export function isPresetCategory(cat: string): boolean {
  return (GOAL_CATEGORIES as readonly string[]).includes(cat);
}

interface GoalFormProps {
  title: string;
  onTitleChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  targetDate: string;
  onTargetDateChange: (v: string) => void;
  /** When provided, tapping the target date row calls this (parent shows date picker). */
  onTargetDatePress?: () => void;
  category: string;
  onCategoryChange: (v: string) => void;
  imageUri: string;
  onImagePress: () => void;
}

function formatDisplayDate(isoDate: string): string {
  if (!isoDate.trim()) return '';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function GoalForm({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  targetDate,
  onTargetDateChange,
  onTargetDatePress,
  category,
  onCategoryChange,
  imageUri,
  onImagePress,
}: GoalFormProps) {
  const isOtherSelected = !isPresetCategory(category);
  const customCategoryValue = isOtherSelected ? category : '';

  return (
    <>
      {/* Goal visualization card */}
      <Pressable style={styles.vizCard} onPress={onImagePress}>
        {imageUri ? (
          <>
            <Image
              source={{ uri: imageUri }}
              style={styles.vizImage}
              resizeMode="cover"
              onError={() => {}}
            />
            <View style={styles.vizOverlay}>
              <Text style={styles.vizOverlayText}>Tap to change image</Text>
            </View>
          </>
        ) : (
          <>
            <Icon name="auto_awesome" size={40} color={colors.primary} style={styles.vizIcon} />
            <Text style={styles.vizTitle}>Visualize your success</Text>
            <Text style={styles.vizSub}>Add an image to your vision board later</Text>
          </>
        )}
      </Pressable>

      <View style={styles.field}>
        <Text style={styles.label}>GOAL NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Speak at a global event"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={onTitleChange}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>DESCRIPTION</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your vision and steps to reach it..."
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={onDescriptionChange}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>TARGET DATE</Text>
        {onTargetDatePress ? (
          <Pressable style={styles.dateRow} onPress={onTargetDatePress}>
            <Text
              style={[styles.dateInput, styles.dateInputText, !targetDate && styles.dateInputPlaceholder]}
              numberOfLines={1}
            >
              {targetDate ? formatDisplayDate(targetDate) : 'Select a date'}
            </Text>
            <View style={styles.calendarIconWrap}>
              <Icon name="calendar_today" size={22} color={colors.textMuted} />
            </View>
          </Pressable>
        ) : (
          <View style={styles.dateRow}>
            <TextInput
              style={[styles.input, styles.dateInput, styles.dateInputFlex]}
              placeholder="Select a date (YYYY-MM-DD)"
              placeholderTextColor={colors.textMuted}
              value={targetDate}
              onChangeText={onTargetDateChange}
            />
            <View style={styles.calendarIconWrap}>
              <Icon name="calendar_today" size={22} color={colors.textMuted} />
            </View>
          </View>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>CATEGORY</Text>
        <View style={styles.chipRow}>
          {GOAL_CATEGORIES.map((cat) => {
            const selected = category === cat;
            return (
              <Pressable
                key={cat}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => onCategoryChange(cat)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{cat}</Text>
              </Pressable>
            );
          })}
          <Pressable
            style={[styles.chip, isOtherSelected && styles.chipSelected]}
            onPress={() => onCategoryChange('')}
          >
            <Text style={[styles.chipText, isOtherSelected && styles.chipTextSelected]}>
              {OTHER_CATEGORY_LABEL}
            </Text>
          </Pressable>
        </View>
        {isOtherSelected && (
          <TextInput
            style={[styles.input, styles.customCategoryInput]}
            placeholder="Enter your category"
            placeholderTextColor={colors.textMuted}
            value={customCategoryValue}
            onChangeText={(v) => onCategoryChange(v.trim())}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  vizCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary + '25',
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
  },
  vizIcon: {
    marginBottom: 12,
  },
  vizTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  vizSub: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  vizImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  vizOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vizOverlayText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
    minHeight: 56,
  },
  dateInput: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  dateInputText: {
    fontSize: 16,
    color: colors.text,
  },
  dateInputPlaceholder: {
    color: colors.textMuted,
  },
  dateInputFlex: {
    borderWidth: 0,
    marginTop: 0,
  },
  calendarIconWrap: {
    paddingRight: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
  },
  chipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.primary,
  },
  customCategoryInput: {
    marginTop: 12,
  },
});
