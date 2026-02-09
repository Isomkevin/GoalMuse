import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { AppBar } from '../components/AppBar';
import { colors } from '../theme/colors';
import type { StatsStackParamList } from '../navigation/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<StatsStackParamList, 'OpikDashboard'>;

export function OpikDashboardScreen() {
  const route = useRoute<Props['route']>();
  const navigation = useNavigation<Props['navigation']>();
  const { url } = route.params;

  return (
    <View style={styles.container}>
      <AppBar
        title="Opik Dashboard"
        showBack
        onBack={() => navigation.goBack()}
      />
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  webview: { flex: 1 },
});
