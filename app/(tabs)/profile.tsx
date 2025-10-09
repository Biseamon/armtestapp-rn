import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { Crown, User, LogOut, Shield, Info, Mail, Moon, Sun } from 'lucide-react-native';

export default function Profile() {
  const { profile, signOut, isPremium } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleUpgrade = () => {
    Alert.alert(
      'Upgrade to Premium',
      'Premium features include:\n\n✓ Unlimited workout tracking\n✓ Advanced analytics\n✓ Custom training programs\n✓ No advertisements\n✓ Export data\n\nContact support to upgrade your account.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content}>
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.background }]}>
            <User size={60} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{profile?.full_name || 'User'}</Text>
          <Text style={[styles.email, { color: colors.textTertiary }]}>{profile?.email}</Text>

          {isPremium ? (
            <View style={[styles.premiumBadge, { backgroundColor: colors.premium }]}>
              <Crown size={16} color={isDark ? '#1A1A1A' : '#1A1A1A'} />
              <Text style={styles.premiumText}>Premium Member</Text>
            </View>
          ) : (
            <TouchableOpacity style={[styles.upgradeButton, { backgroundColor: colors.premium }]} onPress={handleUpgrade}>
              <Crown size={16} color={isDark ? '#1A1A1A' : '#1A1A1A'} />
              <Text style={styles.upgradeText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Mail size={20} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>Email</Text>
              </View>
              <Text style={[styles.settingValue, { color: colors.textTertiary }]}>{profile?.email}</Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Shield size={20} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>Account Status</Text>
              </View>
              <Text style={[styles.settingValue, { color: colors.textTertiary }]}>
                {isPremium ? 'Premium' : 'Free'}
              </Text>
            </View>
          </View>

          {profile?.is_test_user && (
            <View style={[styles.testUserBanner, { backgroundColor: colors.surface, borderColor: colors.premium }]}>
              <Info size={20} color={colors.premium} />
              <Text style={[styles.testUserText, { color: colors.premium }]}>
                Test User - Premium Access Enabled
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                {isDark ? <Moon size={20} color={colors.primary} /> : <Sun size={20} color={colors.primary} />}
                <Text style={[styles.settingText, { color: colors.text }]}>Dark Mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={isDark ? '#FFF' : '#FFF'}
              />
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={[styles.settingText, { color: colors.text }]}>Push Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={notificationsEnabled ? '#FFF' : '#FFF'}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Premium Benefits</Text>

          <View style={[styles.benefitsCard, { backgroundColor: colors.surface }]}>
            <View style={styles.benefitItem}>
              <Text style={[styles.benefitIcon, { color: colors.primary }]}>✓</Text>
              <Text style={[styles.benefitText, { color: colors.textSecondary }]}>Unlimited workout tracking</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={[styles.benefitIcon, { color: colors.primary }]}>✓</Text>
              <Text style={[styles.benefitText, { color: colors.textSecondary }]}>Advanced progress analytics</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={[styles.benefitIcon, { color: colors.primary }]}>✓</Text>
              <Text style={[styles.benefitText, { color: colors.textSecondary }]}>Custom training programs</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={[styles.benefitIcon, { color: colors.primary }]}>✓</Text>
              <Text style={[styles.benefitText, { color: colors.textSecondary }]}>No advertisements</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={[styles.benefitIcon, { color: colors.primary }]}>✓</Text>
              <Text style={[styles.benefitText, { color: colors.textSecondary }]}>Export your data</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={[styles.benefitIcon, { color: colors.primary }]}>✓</Text>
              <Text style={[styles.benefitText, { color: colors.textSecondary }]}>Priority support</Text>
            </View>

            {!isPremium && (
              <TouchableOpacity
                style={[styles.upgradeButtonLarge, { backgroundColor: colors.premium }]}
                onPress={handleUpgrade}
              >
                <Crown size={20} color="#1A1A1A" />
                <Text style={styles.upgradeTextLarge}>Get Premium Now</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
              Arm Wrestling Pro helps you track your training, set goals, and
              monitor your progress. Built for serious arm wrestlers who want to
              take their performance to the next level.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.signOutButton, { backgroundColor: colors.surface, borderColor: colors.error }]} onPress={handleSignOut}>
          <LogOut size={20} color={colors.error} />
          <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 16,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  premiumText: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: 'bold',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  upgradeText: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 14,
  },
  testUserBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
  },
  testUserText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  benefitsCard: {
    borderRadius: 12,
    padding: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  benefitIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  benefitText: {
    fontSize: 14,
    flex: 1,
  },
  upgradeButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  upgradeTextLarge: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 40,
  },
});
