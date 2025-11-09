import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { X, Save } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getCircumferenceUnit } from '@/lib/weightUtils';

interface AddMeasurementModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  weight: string;
  setWeight: (value: string) => void;
  armCircumference: string;
  setArmCircumference: (value: string) => void;
  forearmCircumference: string;
  setForearmCircumference: (value: string) => void;
  wristCircumference: string;
  setWristCircumference: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  weightUnit: 'kg' | 'lbs';
  isEditing?: boolean;
}

export function AddMeasurementModal({
  visible,
  onClose,
  onSave,
  weight,
  setWeight,
  armCircumference,
  setArmCircumference,
  forearmCircumference,
  setForearmCircumference,
  wristCircumference,
  setWristCircumference,
  notes,
  setNotes,
  weightUnit,
  isEditing = false,
}: AddMeasurementModalProps) {
  const { colors } = useTheme();
  const circumferenceUnit = getCircumferenceUnit(weightUnit);

  const handleValidateAndSave = () => {
    // All fields required
    if (
      !weight.trim() ||
      !armCircumference.trim() ||
      !forearmCircumference.trim() ||
      !wristCircumference.trim()
    ) {
      alert('Please fill in all measurement fields.');
      return;
    }
    if (isNaN(Number(weight)) || Number(weight) <= 0) {
      alert('Weight must be a positive number.');
      return;
    }
    if (isNaN(Number(armCircumference)) || Number(armCircumference) <= 0) {
      alert('Arm circumference must be a positive number.');
      return;
    }
    if (isNaN(Number(forearmCircumference)) || Number(forearmCircumference) <= 0) {
      alert('Forearm circumference must be a positive number.');
      return;
    }
    if (isNaN(Number(wristCircumference)) || Number(wristCircumference) <= 0) {
      alert('Wrist circumference must be a positive number.');
      return;
    }
    onSave();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {isEditing ? 'Edit Measurement' : 'Add Measurement'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            All fields are optional. {weightUnit === 'lbs' ? 'Circumferences will be stored in cm (enter in inches, we\'ll convert).' : 'Enter measurements to track your progress.'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Weight ({weightUnit})</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={weight}
              onChangeText={setWeight}
              placeholder={`e.g., ${weightUnit === 'lbs' ? '180' : '80'}`}
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Arm Circumference ({circumferenceUnit})</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={armCircumference}
              onChangeText={setArmCircumference}
              placeholder={circumferenceUnit === 'in' ? 'e.g., 14' : 'e.g., 35'}
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Forearm Circumference ({circumferenceUnit})</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={forearmCircumference}
              onChangeText={setForearmCircumference}
              placeholder={circumferenceUnit === 'in' ? 'e.g., 11' : 'e.g., 28'}
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Wrist Circumference ({circumferenceUnit})</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={wristCircumference}
              onChangeText={setWristCircumference}
              placeholder={circumferenceUnit === 'in' ? 'e.g., 7' : 'e.g., 17'}
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about this measurement..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleValidateAndSave}
          >
            <Save size={20} color="#FFF" />
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Update Measurement' : 'Save Measurement'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    color: '#FFF',
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E63946',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 40,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
