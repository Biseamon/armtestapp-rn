import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Dumbbell, Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { updatePassword, session } = useAuth();
  const { colors } = useTheme();

  // Handle the deep link token from the email
  useEffect(() => {
    const parseUrlAndVerify = async (url: string | null) => {
      if (!url) {
        console.log('No URL provided');
        return null;
      }

      console.log('Parsing URL:', url);

      let access_token: string | null = null;
      let refresh_token: string | null = null;
      let type: string | null = null;

      // Parse tokens from URL fragment (after #) or query params (after ?)
      // Check for fragment (after #)
      const fragmentMatch = url.match(/#(.+)/);
      if (fragmentMatch) {
        const fragmentParams = new URLSearchParams(fragmentMatch[1]);
        access_token = fragmentParams.get('access_token');
        refresh_token = fragmentParams.get('refresh_token');
        type = fragmentParams.get('type');

        // Check for errors in the URL (expired token, etc.)
        const error = fragmentParams.get('error');
        const errorDescription = fragmentParams.get('error_description');

        if (error) {
          console.log('Error in URL fragment:', { error, errorDescription });
          return { access_token: null, refresh_token: null, type: null, error, errorDescription };
        }

        console.log('Parsed from fragment:', { access_token: !!access_token, refresh_token: !!refresh_token, type });
      }

      // Fallback to query params (after ?)
      if (!access_token) {
        const queryMatch = url.match(/\?(.+)/);
        if (queryMatch) {
          const queryParams = new URLSearchParams(queryMatch[1].split('#')[0]);
          access_token = queryParams.get('access_token');
          refresh_token = queryParams.get('refresh_token');
          type = queryParams.get('type');

          // Check for errors in query params too
          const error = queryParams.get('error');
          const errorDescription = queryParams.get('error_description');

          if (error) {
            console.log('Error in query params:', { error, errorDescription });
            return { access_token: null, refresh_token: null, type: null, error, errorDescription };
          }

          console.log('Parsed from query:', { access_token: !!access_token, refresh_token: !!refresh_token, type });
        }
      }

      return { access_token, refresh_token, type };
    };

    const verifyResetToken = async () => {
      try {
        // Get the initial URL that opened the app (contains the tokens in the fragment)
        const initialUrl = await Linking.getInitialURL();
        console.log('Initial URL:', initialUrl);
        console.log('Route params:', params);

        let tokens = await parseUrlAndVerify(initialUrl);

        // Also check route params as fallback
        if (!tokens?.access_token && params.access_token) {
          tokens = {
            access_token: params.access_token as string,
            refresh_token: params.refresh_token as string,
            type: params.type as string,
          };
          console.log('Using route params:', { access_token: !!tokens.access_token, refresh_token: !!tokens.refresh_token, type: tokens.type });
        }

        console.log('Final token check:', {
          hasAccessToken: !!tokens?.access_token,
          hasRefreshToken: !!tokens?.refresh_token,
          type: tokens?.type,
          hasSession: !!session,
          error: (tokens as any)?.error
        });

        // Check if there was an error in the URL (expired link, etc.)
        if ((tokens as any)?.error) {
          const errorDesc = (tokens as any)?.errorDescription;
          console.log('URL contains error - link may be expired or invalid');
          if (errorDesc?.includes('expired')) {
            setError('This reset link has expired. Please request a new one.');
          } else if (errorDesc?.includes('invalid')) {
            setError('This reset link is invalid. Please request a new one.');
          } else {
            setError(`Reset link error: ${errorDesc?.replace(/\+/g, ' ') || (tokens as any)?.error}`);
          }
        } else if (tokens?.type === 'recovery' && tokens.access_token && tokens.refresh_token) {
          console.log('Setting session with recovery tokens...');
          // Set the session with the tokens from the email link
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            setError('Invalid or expired reset link. Please request a new one.');
          } else {
            console.log('Session set successfully!');
            // Clear any existing error
            setError('');
          }
        } else if (!session) {
          console.log('No recovery tokens found and no existing session');
          setError('Invalid or expired reset link. Please request a new one.');
        } else {
          console.log('Using existing session - user may already be logged in');
          // If user has an active session but no recovery token, allow them to change password
          // This handles the case where user is already logged in
        }
      } catch (err) {
        console.error('Error verifying reset token:', err);
        setError('Invalid or expired reset link. Please request a new one.');
      } finally {
        setInitializing(false);
      }
    };

    verifyResetToken();

    // Listen for URL changes (when app is already running)
    const subscription = Linking.addEventListener('url', async (event) => {
      console.log('URL event received:', event.url);
      const tokens = await parseUrlAndVerify(event.url);

      if (tokens?.type === 'recovery' && tokens.access_token && tokens.refresh_token) {
        console.log('Setting session from URL event...');
        setInitializing(true);
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        });

        if (sessionError) {
          console.error('Session error from URL event:', sessionError);
          setError('Invalid or expired reset link. Please request a new one.');
        } else {
          console.log('Session set successfully from URL event!');
          setError(''); // Clear any previous errors
        }
        setInitializing(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []); // Empty deps - only run once on mount

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 6) {
      return 'Password must be at least 6 characters';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\\/]/.test(pwd)) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await updatePassword(password);

    if (error) {
      setError(error.message || 'Failed to reset password');
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  // Show loading spinner while initializing
  if (initializing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Verifying reset link...</Text>
      </View>
    );
  }

  if (success) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Dumbbell size={60} color={colors.primary} strokeWidth={2} />
            <Text style={[styles.title, { color: colors.text }]}>Password Reset Successful!</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Your password has been updated successfully
            </Text>
          </View>

          <View style={styles.form}>
            <View style={[styles.infoBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
              <Text style={[styles.infoText, { color: colors.text }]}>
                You can now sign in with your new password.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={styles.buttonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Dumbbell size={60} color={colors.primary} strokeWidth={2} />
          <Text style={[styles.title, { color: colors.text }]}>Set New Password</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Choose a strong password for your account
          </Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <Text style={[styles.errorText, { backgroundColor: colors.error + '22', color: colors.error }]}>
              {error}
            </Text>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>New Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
                autoFocus
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color={colors.textSecondary} />
                ) : (
                  <Eye size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                placeholder="Re-enter your password"
                placeholderTextColor={colors.textTertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={colors.textSecondary} />
                ) : (
                  <Eye size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.requirementsBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.requirementsTitle, { color: colors.text }]}>Password Requirements:</Text>
            <Text style={[styles.requirementsText, { color: colors.textSecondary }]}>• At least 6 characters</Text>
            <Text style={[styles.requirementsText, { color: colors.textSecondary }]}>• One uppercase letter</Text>
            <Text style={[styles.requirementsText, { color: colors.textSecondary }]}>• One lowercase letter</Text>
            <Text style={[styles.requirementsText, { color: colors.textSecondary }]}>• One number</Text>
            <Text style={[styles.requirementsText, { color: colors.textSecondary }]}>• One special character</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={loading || !session}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Updating...' : 'Reset Password'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            disabled={loading}
            style={styles.linkContainer}
          >
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>
              Back to <Text style={[styles.linkBold, { color: colors.primary }]}>Login</Text>
            </Text>
          </TouchableOpacity>
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
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
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    borderRadius: 12,
    padding: 16,
    paddingRight: 50,
    fontSize: 16,
    borderWidth: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
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
  linkContainer: {
    marginTop: 20,
  },
  linkText: {
    textAlign: 'center',
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
  infoBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  requirementsBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  requirementsText: {
    fontSize: 13,
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});
