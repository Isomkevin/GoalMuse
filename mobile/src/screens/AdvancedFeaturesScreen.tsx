import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
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
import { settingsApi, API_BASE, type LLMProviderOption } from '../lib/api';

const SAVE_CONFIRM_DURATION_MS = 4000;

export function AdvancedFeaturesScreen() {
  const navigation = useNavigation<any>();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const saveMessageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [providers, setProviders] = useState<LLMProviderOption[]>([]);
  const [currentProvider, setCurrentProvider] = useState<string>('gemini');
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [modelOverride, setModelOverride] = useState<string>('');
  const [experiments, setExperiments] = useState<{
    runs: Array<{ label: string; provider: string; metrics: Record<string, number> }>;
    recommendation: string | null;
    updated_at?: string;
    message?: string;
  } | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [llm, exp] = await Promise.all([
        settingsApi.getLLM(token),
        settingsApi.getLLMExperiments(token).catch(() => null),
      ]);
      setProviders(llm.available_providers || []);
      setCurrentProvider(llm.current?.provider || 'openai');
      setCurrentModel(llm.current?.model ?? null);
      setModelOverride(llm.current?.model ?? '');
      setExperiments(exp || null);
    } catch (_) {
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (saveMessageTimer.current) clearTimeout(saveMessageTimer.current);
    };
  }, []);

  const selectedProviderOption = providers.find((p) => p.id === currentProvider);
  const defaultModel = selectedProviderOption?.model_default ?? '';

  const selectProvider = async (provider: string) => {
    if (!token || saving) return;
    const opt = providers.find((p) => p.id === provider);
    if (opt && !opt.available) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      await settingsApi.updateLLM(token, provider, null);
      setCurrentProvider(provider);
      setCurrentModel(null);
      setModelOverride('');
      const providerName = opt?.name ?? provider;
      setSaveMessage(`Saved. Insights will use ${providerName}.`);
      if (saveMessageTimer.current) clearTimeout(saveMessageTimer.current);
      saveMessageTimer.current = setTimeout(() => {
        setSaveMessage(null);
        saveMessageTimer.current = null;
      }, SAVE_CONFIRM_DURATION_MS);
    } catch (_) {
      setSaveMessage(null);
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const saveModelOverride = async () => {
    if (!token || saving) return;
    const modelToSave = modelOverride.trim() || null;
    setSaving(true);
    setSaveMessage(null);
    try {
      await settingsApi.updateLLM(token, currentProvider, modelToSave);
      setCurrentModel(modelToSave);
      setSaveMessage('Model preference saved.');
      if (saveMessageTimer.current) clearTimeout(saveMessageTimer.current);
      saveMessageTimer.current = setTimeout(() => {
        setSaveMessage(null);
        saveMessageTimer.current = null;
      }, SAVE_CONFIRM_DURATION_MS);
    } catch (_) {
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openOpikDashboard = useCallback(() => {
    if (!token) return;
    const url = `${API_BASE}/dashboard?token=${encodeURIComponent(token)}`;
    const parent = navigation.getParent();
    try {
      if (parent && typeof parent.navigate === 'function') {
        parent.navigate('Insights', { screen: 'OpikDashboard', params: { url } });
        return;
      }
    } catch (_) {}
    Linking.openURL(url).catch(() => {
      Alert.alert('Cannot open link', 'Open the app in a browser or copy the dashboard URL.');
    });
  }, [token, navigation]);

  if (loading) {
    return (
      <View style={styles.container}>
        <AppBar title="Advanced Features" showBack onBack={() => navigation.goBack()} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar title="Advanced Features" showBack onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Insights (alignment, synergy, and next action) use the provider below. We use Opik experiments to compare providers so you can make an informed choice.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>LLM provider</Text>
          <Text style={styles.cardHint}>Choose which model powers your AI insights. Change takes effect on the next insights load.</Text>
          <View style={styles.providerRow}>
            {(['openai', 'openrouter', 'gemini'] as const).map((id) => {
              const opt = providers.find((p) => p.id === id);
              const name = opt?.name || id;
              const available = opt?.available ?? false;
              const selected = currentProvider === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => available && selectProvider(id)}
                  style={[
                    styles.providerChip,
                    selected && styles.providerChipSelected,
                    !available && styles.providerChipDisabled,
                  ]}
                >
                  <Text style={[styles.providerChipText, selected && styles.providerChipTextSelected, !available && styles.providerChipTextDisabled]}>
                    {name}
                  </Text>
                  {!available && <Text style={styles.providerChipBadge}>No key</Text>}
                </Pressable>
              );
            })}
          </View>
          {selectedProviderOption && (
            <View style={styles.modelRow}>
              <Text style={styles.modelLabel}>Model (optional)</Text>
              <Text style={styles.modelDefault}>Default: {defaultModel}</Text>
              <TextInput
                style={styles.modelInput}
                value={modelOverride}
                onChangeText={setModelOverride}
                placeholder={`e.g. ${defaultModel}`}
                placeholderTextColor={colors.gray500}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable style={styles.modelSaveBtn} onPress={saveModelOverride} disabled={saving}>
                <Text style={styles.modelSaveBtnText}>Save model</Text>
              </Pressable>
            </View>
          )}
          {saveMessage ? <Text style={styles.saveSuccess}>{saveMessage}</Text> : saving && <Text style={styles.savingText}>Saving…</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>How we compare (Opik)</Text>
          <Text style={styles.cardHint}>
            We run the same tasks with each provider and measure alignment and next-action quality. Opik is the measuring tape.
          </Text>
          {experiments?.runs?.length ? (
            <>
              <View style={styles.runsList}>
                {experiments.runs.map((r) => (
                  <View key={r.label} style={styles.runRow}>
                    <Text style={styles.runLabel}>{r.label}</Text>
                    <View style={styles.runMetricsBlock}>
                      <Text style={styles.runMetrics}>align: {r.metrics?.alignment_avg ?? '—'}</Text>
                      <Text style={styles.runMetrics}>action len: {r.metrics?.action_length_avg ?? '—'}</Text>
                    </View>
                  </View>
                ))}
              </View>
              {experiments.recommendation && (
                <Text style={styles.recommendation}>
                  Based on our tests, we recommend: <Text style={styles.recommendationBold}>{experiments.recommendation}</Text>
                </Text>
              )}
              {experiments.updated_at && (
                <Text style={styles.updatedAt}>Updated {experiments.updated_at.slice(0, 10)}</Text>
              )}
            </>
          ) : (
            <>
              <Text style={styles.noRuns}>
                {experiments?.message || 'No experiment results yet.'}
              </Text>
              <Text style={styles.noRunsHint}>
                You can still switch providers above and try. We'll show a comparison here once our tests have run (run_all_experiments on the backend).
              </Text>
            </>
          )}
          <Pressable style={styles.dashboardBtn} onPress={openOpikDashboard}>
            <Icon name="analytics" size={20} color={colors.white} />
            <Text style={styles.dashboardBtnText}>View full dashboard in Opik</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 16, color: colors.textMuted },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 24,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4 },
  cardHint: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
  providerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  providerChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.gray50,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  providerChipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  providerChipDisabled: { opacity: 0.6 },
  providerChipText: { fontSize: 14, fontWeight: '600', color: colors.text },
  providerChipTextSelected: { color: colors.primary },
  providerChipTextDisabled: { color: colors.gray500 },
  providerChipBadge: { fontSize: 10, color: colors.gray500, marginTop: 2 },
  modelRow: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.gray100 },
  modelLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 4 },
  modelDefault: { fontSize: 12, color: colors.textMuted, marginBottom: 8 },
  modelInput: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.backgroundLight,
    marginBottom: 8,
  },
  modelSaveBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.gray100,
    borderRadius: 8,
  },
  modelSaveBtnText: { fontSize: 14, fontWeight: '600', color: colors.text },
  savingText: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
  saveSuccess: { fontSize: 14, color: colors.primary, marginTop: 8, fontWeight: '500' },
  runsList: { marginBottom: 12 },
  runRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  runLabel: { fontSize: 15, fontWeight: '500', color: colors.text },
  runMetricsBlock: { alignItems: 'flex-end', gap: 2 },
  runMetrics: { fontSize: 13, color: colors.textMuted },
  recommendation: { fontSize: 14, color: colors.text, marginBottom: 4 },
  recommendationBold: { fontWeight: '700', color: colors.primary },
  updatedAt: { fontSize: 12, color: colors.textMuted, marginBottom: 16 },
  noRuns: { fontSize: 14, color: colors.textMuted, marginBottom: 8, fontStyle: 'italic' },
  noRunsHint: { fontSize: 13, color: colors.textMuted, marginBottom: 16, lineHeight: 19 },
  dashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  dashboardBtnText: { fontSize: 15, fontWeight: '600', color: colors.white },
});
