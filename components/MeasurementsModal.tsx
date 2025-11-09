import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { X, Plus, TrendingUp, TrendingDown, Pencil, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { convertWeight } from '@/lib/weightUtils';
import { convertCircumference, getCircumferenceUnit } from '@/lib/weightUtils';

type Measurement = {
  id: string;
  weight: number | null;
  weight_unit?: string;
  arm_circumference: number | null;
  forearm_circumference: number | null;
  wrist_circumference: number | null;
  notes: string | null;
  measured_at: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  measurements: Measurement[];
  onAddNew: () => void;
  onEdit?: (measurement: Measurement) => void;
  onDelete?: (measurementId: string) => void;
  weightUnit: 'kg' | 'lbs';
};

export function MeasurementsModal({ 
  visible, 
  onClose, 
  measurements, 
  onAddNew, 
  onEdit,
  onDelete,
  weightUnit 
}: Props) {
  const { colors } = useTheme();
  const circumferenceUnit = getCircumferenceUnit(weightUnit);

  const calculateChange = (current: number | null, previous: number | null) => {
    if (!current || !previous) return null;
    const change = current - previous;
    return {
      value: Math.abs(change).toFixed(1),
      isIncrease: change > 0,
    };
  };

  const getMeasurementChange = (index: number, field: 'weight' | 'arm_circumference' | 'forearm_circumference' | 'wrist_circumference') => {
    if (index >= measurements.length - 1) return null;
    const current = measurements[index][field];
    const previous = measurements[index + 1][field];
    return calculateChange(current, previous);
  };

  const handleEdit = (measurement: Measurement) => {
    // Validation before allowing edit (optional, but for consistency)
    if (
      (measurement.weight !== null && (isNaN(Number(measurement.weight)) || Number(measurement.weight) <= 0)) ||
      (measurement.arm_circumference !== null && (isNaN(Number(measurement.arm_circumference)) || Number(measurement.arm_circumference) <= 0)) ||
      (measurement.forearm_circumference !== null && (isNaN(Number(measurement.forearm_circumference)) || Number(measurement.forearm_circumference) <= 0)) ||
      (measurement.wrist_circumference !== null && (isNaN(Number(measurement.wrist_circumference)) || Number(measurement.wrist_circumference) <= 0))
    ) {
      alert('All measurement values must be positive numbers.');
      return;
    }
    onEdit?.(measurement);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Body Measurements</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.addButton} onPress={onAddNew}>
              <Plus size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content}>
          {measurements.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No measurements yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>Track your progress by adding measurements</Text>
            </View>
          ) : (
            measurements.map((measurement, index) => (
              <View key={measurement.id} style={[styles.measurementCard, { backgroundColor: colors.surface }]}>
                <View style={styles.measurementHeader}>
                  <View style={styles.measurementHeaderLeft}>
                    <Text style={[styles.measurementDate, { color: colors.primary }]}>
                      {new Date(measurement.measured_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                    {index === 0 && <Text style={styles.latestBadge}>Latest</Text>}
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEdit(measurement)}
                    >
                      <Pencil size={16} color="#2A7DE1" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => onDelete?.(measurement.id)}
                    >
                      <Trash2 size={16} color="#E63946" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.measurementGrid}>
                  {measurement.weight && (
                    <View style={styles.measurementItem}>
                      <Text style={[styles.measurementLabel, { color: colors.textTertiary }]}>Weight</Text>
                      <View style={styles.measurementValueRow}>
                        <Text style={[styles.measurementValue, { color: colors.text }]}>
                          {Math.round(convertWeight(
                            measurement.weight,
                            (measurement.weight_unit || 'lbs') as 'kg' | 'lbs',
                            weightUnit
                          ))} {weightUnit}
                        </Text>
                        {getMeasurementChange(index, 'weight') && (
                          <View style={[styles.changeIndicator, getMeasurementChange(index, 'weight')!.isIncrease ? styles.changeUp : styles.changeDown]}>
                            {getMeasurementChange(index, 'weight')!.isIncrease ? (
                              <TrendingUp size={12} color="#10B981" />
                            ) : (
                              <TrendingDown size={12} color="#E63946" />
                            )}
                            <Text style={[styles.changeText, getMeasurementChange(index, 'weight')!.isIncrease ? styles.changeTextUp : styles.changeTextDown]}>
                              {getMeasurementChange(index, 'weight')!.value}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {measurement.arm_circumference && (
                    <View style={styles.measurementItem}>
                      <Text style={[styles.measurementLabel, { color: colors.textTertiary }]}>Arm</Text>
                      <View style={styles.measurementValueRow}>
                        <Text style={[styles.measurementValue, { color: colors.text }]}>
                          {circumferenceUnit === 'in' 
                            ? Math.round(convertCircumference(measurement.arm_circumference, weightUnit))
                            : convertCircumference(measurement.arm_circumference, weightUnit).toFixed(1)
                          } {circumferenceUnit}
                        </Text>
                        {getMeasurementChange(index, 'arm_circumference') && (
                          <View style={[styles.changeIndicator, getMeasurementChange(index, 'arm_circumference')!.isIncrease ? styles.changeUp : styles.changeDown]}>
                            {getMeasurementChange(index, 'arm_circumference')!.isIncrease ? (
                              <TrendingUp size={12} color="#10B981" />
                            ) : (
                              <TrendingDown size={12} color="#E63946" />
                            )}
                            <Text style={[styles.changeText, getMeasurementChange(index, 'arm_circumference')!.isIncrease ? styles.changeTextUp : styles.changeTextDown]}>
                              {getMeasurementChange(index, 'arm_circumference')!.value}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {measurement.forearm_circumference && (
                    <View style={styles.measurementItem}>
                      <Text style={[styles.measurementLabel, { color: colors.textTertiary }]}>Forearm</Text>
                      <View style={styles.measurementValueRow}>
                        <Text style={[styles.measurementValue, { color: colors.text }]}>
                          {circumferenceUnit === 'in' 
                            ? Math.round(convertCircumference(measurement.forearm_circumference, weightUnit))
                            : convertCircumference(measurement.forearm_circumference, weightUnit).toFixed(1)
                          } {circumferenceUnit}
                        </Text>
                        {getMeasurementChange(index, 'forearm_circumference') && (
                          <View style={[styles.changeIndicator, getMeasurementChange(index, 'forearm_circumference')!.isIncrease ? styles.changeUp : styles.changeDown]}>
                            {getMeasurementChange(index, 'forearm_circumference')!.isIncrease ? (
                              <TrendingUp size={12} color="#10B981" />
                            ) : (
                              <TrendingDown size={12} color="#E63946" />
                            )}
                            <Text style={[styles.changeText, getMeasurementChange(index, 'forearm_circumference')!.isIncrease ? styles.changeTextUp : styles.changeTextDown]}>
                              {getMeasurementChange(index, 'forearm_circumference')!.value}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {measurement.wrist_circumference && (
                    <View style={styles.measurementItem}>
                      <Text style={[styles.measurementLabel, { color: colors.textTertiary }]}>Wrist</Text>
                      <View style={styles.measurementValueRow}>
                        <Text style={[styles.measurementValue, { color: colors.text }]}>
                          {circumferenceUnit === 'in' 
                            ? Math.round(convertCircumference(measurement.wrist_circumference, weightUnit))
                            : convertCircumference(measurement.wrist_circumference, weightUnit).toFixed(1)
                          } {circumferenceUnit}
                        </Text>
                        {getMeasurementChange(index, 'wrist_circumference') && (
                          <View style={[styles.changeIndicator, getMeasurementChange(index, 'wrist_circumference')!.isIncrease ? styles.changeUp : styles.changeDown]}>
                            {getMeasurementChange(index, 'wrist_circumference')!.isIncrease ? (
                              <TrendingUp size={12} color="#10B981" />
                            ) : (
                              <TrendingDown size={12} color="#E63946" />
                            )}
                            <Text style={[styles.changeText, getMeasurementChange(index, 'wrist_circumference')!.isIncrease ? styles.changeTextUp : styles.changeTextDown]}>
                              {getMeasurementChange(index, 'wrist_circumference')!.value}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>

                {measurement.notes && (
                  <Text style={[styles.measurementNotes, { color: colors.textSecondary }]}>{measurement.notes}</Text>
                )}
              </View>
            ))
          )}
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#E63946',
    borderRadius: 20,
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#CCC',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  measurementCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  measurementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  measurementHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#2A7DE144',
    borderRadius: 8,
    padding: 8,
  },
  deleteButton: {
    backgroundColor: '#E6394644',
    borderRadius: 8,
    padding: 8,
  },
  measurementDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  latestBadge: {
    backgroundColor: '#E63946',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  measurementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  measurementItem: {
    flex: 1,
    minWidth: '45%',
  },
  measurementLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  measurementValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  measurementValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  changeUp: {
    backgroundColor: '#10B98122',
  },
  changeDown: {
    backgroundColor: '#E6394622',
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  changeTextUp: {
    color: '#10B981',
  },
  changeTextDown: {
    color: '#E63946',
  },
  measurementNotes: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
});
