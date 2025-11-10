import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  Image,
  Platform,
  Linking,
  TextInput,
  Modal,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { BookOpen, Camera, Crown, Heart, Info, LogOut, Mail, Moon, Shield, Sun, User, Weight } from 'lucide-react-native';
import { GuideModal } from '@/components/GuideModal';
import { STRIPE_CONFIG, APP_CONFIG } from '@/lib/config';

export default function Profile() {
  const { profile, signOut, isPremium, refreshProfile } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>(profile?.weight_unit || 'lbs');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now());
  const [showDonationModal, setShowDonationModal] = useState(false);

  useEffect(() => {
    if (profile?.avatar_url) {
      console.log('Profile avatar URL changed:', profile.avatar_url);
      setAvatarUrl(profile.avatar_url);
      setImageKey(Date.now());
    }
  }, [profile?.avatar_url]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera roll permissions are required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Changed from ImagePicker.MediaTypeOptions.Images
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0] && profile) {
        await uploadAvatar(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadAvatar = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setUploading(true);

      if (!profile) {
        Alert.alert('Error', 'No profile found');
        return;
      }

      console.log('Starting upload with asset:', asset.uri);

      // Delete ALL old avatars for this user (to handle different file extensions)
      try {
        // List all files in the avatars bucket that start with the user ID
        const { data: existingFiles, error: listError } = await supabase.storage
          .from('avatars')
          .list('', {
            search: profile.id, // Search for files containing the user ID
          });

        if (listError) {
          console.warn('Failed to list existing avatars:', listError);
        } else if (existingFiles && existingFiles.length > 0) {
          // Filter to only include files that match the user ID pattern (user_id.ext)
          const userAvatars = existingFiles.filter(file =>
            file.name.startsWith(`${profile.id}.`)
          );

          if (userAvatars.length > 0) {
            const filesToDelete = userAvatars.map(file => file.name);
            console.log('Deleting old avatars:', filesToDelete);

            const { error: deleteError } = await supabase.storage
              .from('avatars')
              .remove(filesToDelete);

            if (deleteError) {
              console.warn('Failed to delete old avatars:', deleteError);
            } else {
              console.log('Old avatars deleted successfully');
            }
          }
        }
      } catch (error) {
        console.warn('Error deleting old avatars:', error);
        // Don't throw - continue with upload even if deletion fails
      }

      const fileExt = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
      // Use user ID as filename for security and simplicity
      const fileName = `${profile.id}.${fileExt}`;
      const filePath = fileName;

      console.log('File details:', { fileName, fileExt, filePath });

      // Read file as base64 using FileSystem legacy API
      console.log('Reading file as base64...');
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!base64) {
        throw new Error('Failed to read image file');
      }

      console.log('File read successfully, converting to ArrayBuffer...');

      // Upload to Supabase Storage using base64-arraybuffer
      // This uses the authenticated session automatically
      console.log('Uploading file to path:', filePath);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(base64), {
          contentType: `image/${fileExt}`,
          upsert: true, // This will replace existing file with same name
          cacheControl: '0', // Disable caching so new images appear immediately
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        console.error('Upload error details:', JSON.stringify(uploadError, null, 2));
        throw uploadError;
      }

      console.log('Upload successful! Path:', uploadData.path);
      console.log('Upload data:', JSON.stringify(uploadData, null, 2));

      // Get public URL with cache-busting timestamp
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add cache-busting timestamp to the URL stored in database
      const timestamp = Date.now();
      const publicUrlWithTimestamp = `${publicUrl}?t=${timestamp}`;

      console.log('Public URL with cache-buster:', publicUrlWithTimestamp);

      // Update profile in database with the timestamped URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrlWithTimestamp })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      // Force immediate reload with cache busting
      setAvatarUrl(publicUrlWithTimestamp);
      setImageKey(timestamp);

      await refreshProfile();
      
      console.log('Avatar updated successfully');
      Alert.alert('Success', 'Profile picture updated!');

    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      Alert.alert(
        'Upload Failed', 
        error?.message || 'Failed to upload image. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleWeightUnitToggle = async (value: boolean) => {
    const newUnit = value ? 'kg' : 'lbs';
    setWeightUnit(newUnit);

    if (profile) {
      await supabase
        .from('profiles')
        .update({ weight_unit: newUnit })
        .eq('id', profile.id);

      await refreshProfile();
    }
  };

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
      'Premium features include:\n\n✓ Unlimited workout tracking\n✓ Advanced analytics\n✓ No advertisements\n✓ Export data\n\nContact support to upgrade your account.',
      [{ text: 'OK' }]
    );
  };

  const handleDonate = () => {
    // Build return URL based on platform
    let returnUrl: string;
    if (Platform.OS === 'web') {
      returnUrl = window.location.origin;
    } else if (Platform.OS === 'ios') {
      returnUrl = `${APP_CONFIG.scheme}://profile`;
    } else if (Platform.OS === 'android') {
      returnUrl = `${APP_CONFIG.url}/profile`;
    } else {
      returnUrl = `${APP_CONFIG.scheme}://profile`;
    }

    // Use configured Stripe donation URL
    const stripeDonationUrl = `${STRIPE_CONFIG.donationUrl}?prefilled_return_url=${encodeURIComponent(returnUrl)}`;

    if (Platform.OS === 'web') {
      window.open(stripeDonationUrl, '_blank');
    } else {
      Linking.openURL(stripeDonationUrl);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content}>
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.avatarContainer, { backgroundColor: colors.background }]}
            onPress={pickImage}
            disabled={uploading}
          >
            {avatarUrl ? (
              <Image
                source={{
                  uri: avatarUrl.includes('?t=') ? avatarUrl : `${avatarUrl}?t=${imageKey}`,
                  cache: 'reload' // Force reload
                }}
                style={styles.avatar}
                key={`avatar-${imageKey}`}
                onError={(e) => {
                  console.log('Image load error:', e.nativeEvent.error);
                  console.log('Failed URL:', avatarUrl);
                  // Don't clear the URL, just log the error
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', avatarUrl);
                }}
                onLoadStart={() => {
                  console.log('Image loading started');
                }}
              />
            ) : (
              <User size={60} color={colors.primary} strokeWidth={2} />
            )}
            <View style={[styles.cameraIcon, uploading && styles.cameraIconDisabled]}>
              {uploading ? (
                <Text style={styles.uploadingText}>...</Text>
              ) : (
                <Camera size={20} color="#FFF" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={[styles.name, { color: colors.text }]}>{profile?.full_name || 'User'}</Text>
          <Text style={[styles.email, { color: colors.textTertiary }]}>{profile?.email || 'No email'}</Text>

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

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Weight size={20} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>Weight Unit</Text>
              </View>
              <View style={styles.weightUnitToggle}>
                <Text style={[styles.unitLabel, weightUnit === 'lbs' && styles.unitLabelActive, { color: weightUnit === 'lbs' ? colors.primary : colors.textTertiary }]}>lbs</Text>
                <Switch
                  value={weightUnit === 'kg'}
                  onValueChange={handleWeightUnitToggle}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFF"
                />
                <Text style={[styles.unitLabel, weightUnit === 'kg' && styles.unitLabelActive, { color: weightUnit === 'kg' ? colors.primary : colors.textTertiary }]}>kg</Text>
              </View>
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

        <TouchableOpacity
          style={[styles.guideButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowGuide(true)}
        >
          <BookOpen size={22} color="#FFF" />
          <Text style={styles.guideButtonText}>App Guide - Learn How to Use</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.donateButton, { backgroundColor: colors.surface, borderColor: '#FF6B9D' }]}
          onPress={handleDonate}
        >
          <Heart size={20} color="#FF6B9D" />
          <Text style={[styles.donateText, { color: '#FF6B9D' }]}>Support Development</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.signOutButton, { backgroundColor: colors.surface, borderColor: colors.error }]} onPress={handleSignOut}>
          <LogOut size={20} color={colors.error} />
          <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <GuideModal visible={showGuide} onClose={() => setShowGuide(false)} />
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
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#E63946',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
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
  guideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  guideButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  donateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
  },
  donateText: {
    fontSize: 16,
    fontWeight: 'bold',
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
  weightUnitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unitLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  unitLabelActive: {
    fontWeight: 'bold',
  },
  uploadingText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cameraIconDisabled: {
    opacity: 0.5,
  },
});
