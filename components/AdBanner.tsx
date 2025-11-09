import { View, Text, StyleSheet, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export function AdBanner() {
  const { isPremium } = useAuth();
  const { colors } = useTheme();

  if (isPremium) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.adLabel, { color: colors.textTertiary }]}>Advertisement</Text>
      <View style={[styles.adContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Text style={[styles.adText, { color: colors.textSecondary }]}>AdMob Banner Placeholder</Text>
        <Text style={[styles.adSubtext, { color: colors.textTertiary }]}>
          {Platform.OS === 'web'
            ? '320x50 - Ads display on mobile devices'
            : '320x50 Banner Ad'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 8,
  },
  adLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  adContent: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  adText: {
    fontSize: 12,
    fontWeight: '600',
  },
  adSubtext: {
    fontSize: 10,
    marginTop: 2,
  },
});
