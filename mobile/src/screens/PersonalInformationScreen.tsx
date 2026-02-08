import React, { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { AppBar } from '../components/AppBar';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';

export function PersonalInformationScreen() {
  const navigation = useNavigation<any>();
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName);
  }, [user?.displayName]);

  const handleSave = async () => {
    const trimmed = displayName.trim();
    if (!trimmed) return;
    await updateProfile(trimmed);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppBar title="Personal Information" showBack onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.field}>
          <Text style={styles.label}>Display name</Text>
          <View style={styles.inputWrap}>
            <View style={styles.inputIcon}>
              <Icon name="person" size={20} color={colors.gray400} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrap}>
            <View style={styles.inputIcon}>
              <Icon name="mail" size={20} color={colors.gray400} />
            </View>
            <TextInput
              style={[styles.input, styles.inputReadOnly]}
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              value={user?.email ?? ''}
              editable={false}
            />
          </View>
          <Text style={styles.hint}>Email cannot be changed here.</Text>
        </View>
        <Pressable
          style={[styles.saveBtn, saved && styles.saveBtnSuccess]}
          onPress={handleSave}
          disabled={!displayName.trim()}
        >
          <Text style={styles.saveBtnText}>
            {saved ? 'Saved' : 'Save changes'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputIcon: { paddingLeft: 16, paddingRight: 8 },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: colors.text,
    paddingRight: 16,
  },
  inputReadOnly: { color: colors.gray500 },
  hint: { fontSize: 12, color: colors.gray500, marginTop: 6, marginLeft: 4 },
  saveBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  saveBtnSuccess: { backgroundColor: colors.gray700 },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: colors.white },
});
