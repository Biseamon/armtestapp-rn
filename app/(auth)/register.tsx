import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Dumbbell } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const OAUTH_PROVIDERS = [
  { name: 'Google', key: 'google', color: '#4285F4' },
  { name: 'Facebook', key: 'facebook', color: '#1877F3' },
  { name: 'Apple', key: 'apple', color: '#000' },
];

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { signUp } = useAuth();
  const { colors } = useTheme();

  const handleRegister = async () => {
    if (!email || !password || !fullName) {
      setError('Please fill in all fields');
      return;
    }

    // Email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Password strength validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must contain uppercase, lowercase, and a number');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\\/]/.test(password)) {
      setError('Password must contain at least one special character');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await signUp(email, password, fullName);

    if (error) {
      setError(error.message || 'Failed to sign up');
      setLoading(false);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleOAuthLogin = async (provider: string) => {
    setLoading(true);
    setError('');
    try {
      const redirectUrl = AuthSession.makeRedirectUri();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as any, // or as Provider if imported
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        setError(error.message || `Failed to sign up with ${provider}`);
        setLoading(false);
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, AuthSession.makeRedirectUri());

      if (result.type === 'success' || result.type === 'dismiss') {
        router.replace('/(tabs)');
      } else if (result.type === 'cancel') {
        setError(`Sign up with ${provider} was cancelled`);
      }
    } catch (err: any) {
      setError(err.message || `Failed to sign up with ${provider}`);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Dumbbell size={60} color={colors.primary} strokeWidth={2} />
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Start your strength journey today</Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={[styles.errorText, { backgroundColor: colors.error + '22', color: colors.error }]}>{error}</Text> : null}

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="John Doe"
              placeholderTextColor={colors.textTertiary}
              value={fullName}
              onChangeText={setFullName}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="your@email.com"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            disabled={loading}
          >
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>
              Already have an account? <Text style={[styles.linkBold, { color: colors.primary }]}>Sign In</Text>
            </Text>
          </TouchableOpacity>

          {/* Social login buttons */}
          <View style={styles.socialLoginContainer}>
            <Text style={[styles.socialLoginLabel, { color: colors.textSecondary }]}>Or sign up with:</Text>
            {OAUTH_PROVIDERS.map((provider) => (
              <TouchableOpacity
                key={provider.key}
                style={[styles.socialButton, { backgroundColor: provider.color }]}
                onPress={() => handleOAuthLogin(provider.key)}
                disabled={loading}
              >
                <Text style={styles.socialButtonText}>Continue with {provider.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  linkBold: {
    fontWeight: 'bold',
  },
  errorText: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
  socialLoginContainer: {
    marginVertical: 24,
    alignItems: 'center',
    gap: 12,
  },
  socialLoginLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  socialButton: {
    width: '100%',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  socialButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
