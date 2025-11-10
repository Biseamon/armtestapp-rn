import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase, Workout, Cycle } from '@/lib/supabase';
import { AdBanner } from '@/components/AdBanner';
import { PaywallModal } from '@/components/PaywallModal';
import { Plus, X, Save, Pencil, Trash2, ArrowLeft } from 'lucide-react-native';
import { formatWeight, convertToLbs, convertFromLbs } from '@/lib/weightUtils';

type Exercise = {
  exercise_name: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  notes: string;
};

type CycleWorkoutCount = {
  cycle_id: string;
  workout_count: number;
};

export default function CycleDetails() {
  const { cycleId } = useLocalSearchParams();
  const { profile, isPremium } = useAuth();
  const { colors } = useTheme();
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  const [workoutType, setWorkoutType] = useState('table_practice');
  const [duration, setDuration] = useState('30');
  const [intensity, setIntensity] = useState('5');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (profile && cycleId) {
        fetchCycleData();
      }
    }, [profile, cycleId])
  );

  const fetchCycleData = async () => {
    if (!profile || !cycleId) return;

    try {
      // Fetch cycle details
      const { data: cycleData, error: cycleError } = await supabase
        .from('cycles')
        .select('*')
        .eq('id', cycleId)
        .maybeSingle();

      if (cycleError) {
        console.error('Error fetching cycle:', cycleError);
        return;
      }

      // Fetch workouts for this cycle
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .eq('cycle_id', cycleId)
        .order('created_at', { ascending: false });

      if (workoutsError) {
        console.error('Error fetching workouts:', workoutsError);
      }

      // Get workout count
      const { count, error: countError } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('cycle_id', cycleId);

      if (countError) {
        console.error('Error counting workouts:', countError);
      }

      console.log('Cycle data:', cycleData);
      console.log('Workouts data:', workoutsData);
      console.log('Workout count:', count);

      if (cycleData) setCycle(cycleData);
      if (workoutsData) setWorkouts(workoutsData);
      setWorkoutCount(count || 0);
    } catch (error) {
      console.error('Error in fetchCycleData:', error);
    }
  };

  const handleStartWorkout = () => {
    if (!isPremium && workoutCount >= 3) {
      setShowPaywall(true);
      return;
    }
    setEditingWorkout(null);
    resetForm();
    setShowWorkoutModal(true);
  };

  const handleEditWorkout = async (workout: Workout) => {
    setEditingWorkout(workout);
    setWorkoutType(workout.workout_type);
    setDuration(String(workout.duration_minutes));
    setIntensity(String(workout.intensity));
    setNotes(workout.notes);

    const { data: exercisesData } = await supabase
      .from('exercises')
      .select('*')
      .eq('workout_id', workout.id);

    if (exercisesData) {
      setExercises(exercisesData);
    }

    setShowWorkoutModal(true);
  };

  const handleDeleteWorkout = (workout: Workout) => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('workouts').delete().eq('id', workout.id);
            fetchCycleData();
          },
        },
      ]
    );
  };

  const handleAddExercise = () => {
    setExercises([
      ...exercises,
      { exercise_name: '', sets: 3, reps: 10, weight_lbs: 0, notes: '' },
    ]);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleUpdateExercise = (
    index: number,
    field: keyof Exercise,
    value: any
  ) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleSaveWorkout = async () => {
    if (!profile || !cycleId) {
      console.log('Missing profile or cycleId');
      return;
    }
  
    setSaving(true);
  
    try {
      if (editingWorkout) {
        // Update existing workout
        const { error: updateError } = await supabase
          .from('workouts')
          .update({
            workout_type: workoutType,
            duration_minutes: parseInt(duration) || 0,
            intensity: parseInt(intensity) || 5,
            notes,
          })
          .eq('id', editingWorkout.id);
  
        if (updateError) {
          console.error('Error updating workout:', updateError);
          throw updateError;
        }
  
        // Delete old exercises
        await supabase.from('exercises').delete().eq('workout_id', editingWorkout.id);
  
        // Insert new exercises if any
        if (exercises.length > 0) {
          const exercisesData = exercises.map((ex) => ({
            workout_id: editingWorkout.id,
            exercise_name: ex.exercise_name,
            sets: ex.sets,
            reps: ex.reps,
            weight_lbs: ex.weight_lbs,
            notes: ex.notes || '',
          }));
          
          const { error: exercisesError } = await supabase
            .from('exercises')
            .insert(exercisesData);
            
          if (exercisesError) {
            console.error('Error inserting exercises:', exercisesError);
          }
        }
      } else {
        // Create new workout
        console.log('Creating workout with cycle_id:', cycleId);
        
        const { data: workout, error: workoutError } = await supabase
          .from('workouts')
          .insert({
            user_id: profile.id,
            workout_type: workoutType,
            duration_minutes: parseInt(duration) || 0,
            intensity: parseInt(intensity) || 5,
            notes,
            cycle_id: cycleId as string,
          })
          .select()
          .single();
  
        console.log('Workout created:', workout);
        console.log('Workout error:', workoutError);
  
        if (workoutError) {
          console.error('Error creating workout:', workoutError);
          throw workoutError;
        }
  
        // Insert exercises if workout was created successfully
        if (workout && exercises.length > 0) {
          const exercisesData = exercises.map((ex) => ({
            workout_id: workout.id,
            exercise_name: ex.exercise_name,
            sets: ex.sets,
            reps: ex.reps,
            weight_lbs: ex.weight_lbs,
            notes: ex.notes || '',
          }));
          
          const { error: exercisesError } = await supabase
            .from('exercises')
            .insert(exercisesData);
            
          if (exercisesError) {
            console.error('Error inserting exercises:', exercisesError);
          }
        }
      }
  
      setSaving(false);
      setShowWorkoutModal(false);
      resetForm();
      await fetchCycleData(); // Refresh the data
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout');
      setSaving(false);
    }
  };
  

  const resetForm = () => {
    setWorkoutType('table_practice');
    setDuration('30');
    setIntensity('5');
    setNotes('');
    setExercises([]);
    setEditingWorkout(null);
  };

  const workoutTypes = [
    { value: 'table_practice', label: 'Table Practice' },
    { value: 'strength', label: 'Strength Training' },
    { value: 'technique', label: 'Technique' },
    { value: 'endurance', label: 'Endurance' },
    { value: 'sparring', label: 'Sparring' },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!cycle) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/training')}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/training')} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {cycle.name}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleStartWorkout}>
          <Plus size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
        <AdBanner />

        <View style={[styles.cycleInfoCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
          <Text style={[styles.cycleType, { color: colors.primary }]}>
            {cycle.cycle_type.replace(/_/g, ' ').toUpperCase()}
          </Text>
          <Text style={[styles.cycleDates, { color: colors.textSecondary }]}>
            {formatDate(cycle.start_date)} - {formatDate(cycle.end_date)}
          </Text>
          {cycle.description && (
            <Text style={[styles.cycleDescription, { color: colors.textSecondary }]}>{cycle.description}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Trainings ({workoutCount})
          </Text>
          {workouts.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No trainings yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>Add your first training!</Text>
            </View>
          ) : (
            workouts.map((workout) => (
              <View key={workout.id} style={[styles.workoutCard, { backgroundColor: colors.surface }]}>
                <View style={styles.workoutHeader}>
                  <View style={styles.workoutInfo}>
                    <Text style={[styles.workoutType, { color: colors.primary }]}>
                      {workout.workout_type.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                    <Text style={[styles.workoutDate, { color: colors.textSecondary }]}>
                      {formatDate(workout.created_at)}
                    </Text>
                  </View>
                  <View style={styles.workoutActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleEditWorkout(workout)}
                    >
                      <Pencil size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleDeleteWorkout(workout)}
                    >
                      <Trash2 size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.workoutDetails}>
                  <Text style={[styles.workoutDetail, { color: colors.textSecondary }]}>
                    {workout.duration_minutes} min
                  </Text>
                  <Text style={[styles.workoutDivider, { color: colors.textTertiary }]}>•</Text>
                  <Text style={[styles.workoutDetail, { color: colors.textSecondary }]}>
                    Intensity: {workout.intensity}/10
                  </Text>
                </View>
                {workout.notes && (
                  <Text style={[styles.workoutNotes, { color: colors.textSecondary }]} numberOfLines={2}>
                    {workout.notes}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showWorkoutModal}
        animationType="slide"
        onRequestClose={() => setShowWorkoutModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingWorkout ? 'Edit Training' : 'Log Training'}
            </Text>
            <TouchableOpacity onPress={() => setShowWorkoutModal(false)}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[styles.label, { color: colors.text }]}>Workout Type</Text>
            <View style={styles.typeContainer}>
              {workoutTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    workoutType === type.value && [styles.typeButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                  ]}
                  onPress={() => setWorkoutType(type.value)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      { color: colors.textSecondary },
                      workoutType === type.value && [styles.typeButtonTextActive, { color: '#FFF' }],
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Duration (minutes)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              placeholder="30"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.label, { color: colors.text }]}>Intensity (1-10)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={intensity}
              onChangeText={setIntensity}
              keyboardType="number-pad"
              placeholder="5"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholder="How did it go?"
              placeholderTextColor={colors.textTertiary}
            />

            <View style={styles.exercisesSection}>
              <View style={styles.exercisesHeader}>
                <Text style={[styles.label, { color: colors.text }]}>Exercises (Optional)</Text>
                <TouchableOpacity
                  style={styles.addExerciseButton}
                  onPress={handleAddExercise}
                >
                  <Plus size={20} color={colors.primary} />
                  <Text style={[styles.addExerciseText, { color: colors.primary }]}>Add Exercise</Text>
                </TouchableOpacity>
              </View>

              {exercises.map((exercise, index) => (
                <View key={index} style={[styles.exerciseCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.exerciseCardHeader}>
                    <Text style={[styles.exerciseCardTitle, { color: colors.text }]}>Exercise {index + 1}</Text>
                    <TouchableOpacity onPress={() => handleRemoveExercise(index)}>
                      <X size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    value={exercise.exercise_name}
                    onChangeText={(val) =>
                      handleUpdateExercise(index, 'exercise_name', val)
                    }
                    placeholder="Exercise name"
                    placeholderTextColor={colors.textTertiary}
                  />

                  <View style={styles.exerciseRow}>
                    <View style={styles.exerciseInputGroup}>
                      <Text style={[styles.smallLabel, { color: colors.textSecondary }]}>Sets</Text>
                      <TextInput
                        style={[styles.smallInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        value={String(exercise.sets)}
                        onChangeText={(val) =>
                          handleUpdateExercise(index, 'sets', parseInt(val) || 0)
                        }
                        keyboardType="number-pad"
                      />
                    </View>

                    <View style={styles.exerciseInputGroup}>
                      <Text style={[styles.smallLabel, { color: colors.textSecondary }]}>Reps</Text>
                      <TextInput
                        style={[styles.smallInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        value={String(exercise.reps)}
                        onChangeText={(val) =>
                          handleUpdateExercise(index, 'reps', parseInt(val) || 0)
                        }
                        keyboardType="number-pad"
                      />
                    </View>

                    <View style={styles.exerciseInputGroup}>
                      <Text style={[styles.smallLabel, { color: colors.textSecondary }]}>Weight ({profile?.weight_unit || 'lbs'})</Text>
                      <TextInput
                        style={[styles.smallInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        value={String(Math.round(convertFromLbs(exercise.weight_lbs, profile?.weight_unit || 'lbs')))}
                        onChangeText={(val) => {
                          const inputValue = parseInt(val) || 0;
                          const lbsValue = convertToLbs(inputValue, profile?.weight_unit || 'lbs');
                          handleUpdateExercise(index, 'weight_lbs', lbsValue);
                        }}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveWorkout}
              disabled={saving}
            >
              <Save size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : editingWorkout ? 'Update Training' : 'Save Training'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalBottomSpacing} />
          </ScrollView>
        </View>
      </Modal>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgrade={() => setShowPaywall(false)}
        feature="Unlimited trainings per cycle"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  addButton: {
    backgroundColor: '#E63946',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  cycleInfoCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2A7DE1',
  },
  cycleType: {
    fontSize: 14,
    color: '#2A7DE1',
    fontWeight: '600',
    marginBottom: 4,
  },
  cycleDates: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  cycleDescription: {
    fontSize: 14,
    color: '#CCC',
    fontStyle: 'italic',
  },
  limitCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  limitText: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 8,
  },
  upgradeButton: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  upgradeText: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  workoutCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E63946',
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 12,
    color: '#999',
  },
  workoutActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  workoutDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutDetail: {
    fontSize: 14,
    color: '#CCC',
  },
  workoutDivider: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
  workoutNotes: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  typeButtonActive: {
    backgroundColor: '#E63946',
    borderColor: '#E63946',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#999',
  },
  typeButtonTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  exercisesSection: {
    marginTop: 24,
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addExerciseText: {
    fontSize: 14,
    color: '#E63946',
    fontWeight: '600',
  },
  exerciseCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  exerciseRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  exerciseInputGroup: {
    flex: 1,
  },
  smallLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  smallInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#333',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#E63946',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalBottomSpacing: {
    height: 40,
  },
});
