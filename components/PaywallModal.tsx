import { View, Text, Modal, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { Crown, X } from 'lucide-react-native';

type PaywallModalProps = {
  visible: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  feature: string;
};

const premiumFeatures = [
  '📊 Advanced Analytics (6 chart types)',
  '📈 PR Timeline & Consistency Tracking',
  '📏 Body Measurements Tracking',
  '📄 Detailed Progress Reports',
  '🎯 Unlimited Goals',
  '💪 Unlimited Workouts',
  '📅 Unlimited Scheduled Trainings',
  '🏋️ Unlimited Training Cycles',
  '🚫 Ad-Free Experience',
];

export function PaywallModal({ visible, onClose, onUpgrade, feature }: PaywallModalProps) {
  const handleUpgrade = () => {
    const stripePaymentUrl = 'https://buy.stripe.com/test_00000000';

    if (Platform.OS === 'web') {
      window.open(stripePaymentUrl, '_blank');
    } else {
      Linking.openURL(stripePaymentUrl);
    }

    if (onUpgrade) {
      onUpgrade();
    }
    onClose();
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#999" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Crown size={60} color="#FFD700" strokeWidth={2} />
          </View>

          <Text style={styles.title}>Premium Feature</Text>
          <Text style={styles.description}>
            {feature} is available for Premium members only.
          </Text>

          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Premium Benefits:</Text>
            {premiumFeatures.map((benefit, index) => (
              <Text key={index} style={styles.benefit}>{benefit}</Text>
            ))}
          </View>

          <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>

          <Text style={styles.noteText}>
            Note: Please configure your Stripe payment link in the code
          </Text>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  benefitsContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  benefit: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 8,
    lineHeight: 20,
  },
  upgradeButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 14,
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
});
