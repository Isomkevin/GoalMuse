import React, { useState } from 'react';
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

export function SecurityPasswordScreen() {
  const navigation = useNavigation<any>();
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async () => {
    setMessage(null);
    if (!currentPassword.trim()) {
      setMessage({ type: 'error', text: 'Enter your current password.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    const ok = await changePassword(currentPassword, newPassword);
    if (ok) {
      setMessage({ type: 'success', text: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setMessage({ type: 'error', text: 'Current password is incorrect.' });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppBar title="Security & Password" showBack onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.field}>
          <Text style={styles.label}>Current password</Text>
          <View style={styles.inputWrap}>
            <View style={styles.inputIcon}>
              <Icon name="lock" size={20} color={colors.gray400} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter current password"
              placeholderTextColor={colors.textMuted}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrent}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              style={styles.eyeBtn}
              onPress={() => setShowCurrent((s) => !s)}
            >
              <Icon
                name={showCurrent ? 'visibility_off' : 'visibility'}
                size={22}
                color={colors.gray400}
              />
            </Pressable>
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>New password</Text>
          <View style={styles.inputWrap}>
            <View style={styles.inputIcon}>
              <Icon name="lock" size={20} color={colors.gray400} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.textMuted}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              style={styles.eyeBtn}
              onPress={() => setShowNew((s) => !s)}
            >
              <Icon
                name={showNew ? 'visibility_off' : 'visibility'}
                size={22}
                color={colors.gray400}
              />
            </Pressable>
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Confirm new password</Text>
          <View style={styles.inputWrap}>
            <View style={styles.inputIcon}>
              <Icon name="lock" size={20} color={colors.gray400} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Re-enter new password"
              placeholderTextColor={colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              style={styles.eyeBtn}
              onPress={() => setShowConfirm((s) => !s)}
            >
              <Icon
                name={showConfirm ? 'visibility_off' : 'visibility'}
                size={22}
                color={colors.gray400}
              />
            </Pressable>
          </View>
        </View>
        {message ? (
          <View
            style={[
              styles.messageBox,
              message.type === 'success' ? styles.messageSuccess : styles.messageError,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                message.type === 'success' ? styles.messageTextSuccess : styles.messageTextError,
              ]}
            >
              {message.text}
            </Text>
          </View>
        ) : null}
        <Pressable
          style={styles.changeBtn}
          onPress={handleChangePassword}
        >
          <Text style={styles.changeBtnText}>Change password</Text>
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
    paddingRight: 8,
  },
  eyeBtn: { padding: 12 },
  messageBox: { padding: 12, borderRadius: 12, marginTop: 8 },
  messageSuccess: { backgroundColor: colors.primaryLight },
  messageError: { backgroundColor: colors.redLight },
  messageText: { fontSize: 14 },
  messageTextSuccess: { color: colors.primary, fontWeight: '500' },
  messageTextError: { color: colors.red, fontWeight: '500' },
  changeBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  changeBtnText: { fontSize: 16, fontWeight: '600', color: colors.white },
});
