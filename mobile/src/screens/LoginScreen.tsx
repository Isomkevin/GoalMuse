import React, { useState } from 'react';
import {
  Alert,
  Image,
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
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';

const DEMO_EMAIL = 'demo@goalmuse.app';
const DEMO_PASSWORD = 'demo';

export function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
  };

  const handleLogin = async () => {
    if (!email.trim()) return;
    const ok = await login(email.trim(), password);
    if (!ok) Alert.alert('Login failed', 'Invalid email or password. Check your credentials and try again.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.topBar} />
          <View style={styles.content}>
            <View style={styles.branding}>
              <View style={styles.logo}>
                <Image source={require('../../assets/icon.png')} style={styles.logoImage} resizeMode="contain" />
              </View>
              <Text style={styles.title}>GoalMuse</Text>
              <Text style={styles.subtitle}>Your vision, one board.</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrap}>
                <View style={styles.inputIcon}>
                  <Icon name="mail" size={20} color={colors.gray400} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <View style={styles.inputIcon}>
                  <Icon name="lock" size={20} color={colors.gray400} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.forgotRow}>
                <Pressable>
                  <Text style={styles.forgotLink}>Forgot password?</Text>
                </Pressable>
              </View>

              <Pressable style={styles.primaryBtn} onPress={handleLogin}>
                <Text style={styles.primaryBtnText}>Log in</Text>
              </Pressable>

              <View style={styles.signupRow}>
                <Text style={styles.signupText}>New to GoalMuse?</Text>
                <Pressable onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.signupLink}>Create account</Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.demoHint, pressed && styles.demoHintPressed]}
              onPress={fillDemo}
              hitSlop={8}
              accessibilityLabel="Fill demo credentials"
              accessibilityHint="Fills email and password with demo account"
            >
              <Icon name="info" size={14} color={colors.gray400} />
              <Text style={styles.demoText}>Tap to fill demo: {DEMO_EMAIL}</Text>
            </Pressable>
          </View>
          <View style={styles.bottomBar} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 480,
  },
  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  topBar: {
    height: 128,
    width: '100%',
    backgroundColor: colors.primaryLight,
  },
  content: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    marginTop: -48,
  },
  branding: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  logoImage: {
    width: 56,
    height: 56,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
    paddingLeft: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingLeft: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
    paddingRight: 16,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: -4,
  },
  forgotLink: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  signupText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  demoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 64,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.gray50,
    borderRadius: 9999,
    alignSelf: 'center',
  },
  demoHintPressed: {
    opacity: 0.7,
  },
  demoText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  bottomBar: {
    height: 8,
    width: '100%',
    backgroundColor: colors.primary,
  },
});
