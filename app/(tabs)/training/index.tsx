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
  Platform,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase, Workout, Cycle } from '@/lib/supabase';
import { AdBanner } from '@/components/AdBanner';
import { PaywallModal } from '@/components/PaywallModal';
import { Plus, X, Save, Edit2, Trash2, Calendar as CalendarIcon, Clock } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatWeight, convertToLbs, convertFromLbs } from '@/lib/weightUtils';

type Exercise = {
  exercise_name: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  notes: string;
};

export default function Training() {
  const { profile, isPremium } = useAuth();
  const { colors } = useTheme();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);

  const [workoutType, setWorkoutType] = useState('table_practice');
  const [duration, setDuration] = useState('30');
  const [intensity, setIntensity] = useState('5');
  const [notes, setNotes] = useState('');
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const [cycleName, setCycleName] = useState('');
  const [cycleType, setCycleType] = useState('competition_prep');
  const [cycleDescription, setCycleDescription] = useState('');
  const [cycleStartDate, setCycleStartDate] = useState(new Date());
  const [cycleEndDate, setCycleEndDate] = useState(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (profile) {
        fetchData();
      }
    }, [profile])
  );

  const fetchData = async () => {
    if (!profile) return;

    const [workoutsRes, cyclesRes, countRes] = await Promise.all([
      supabase
        .from('workouts')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('cycles')
        .select('*')
        .eq('user_id', profile.id)
        .order('start_date', { ascending: false }),
      supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id),
    ]);

    if (workoutsRes.data) setWorkouts(workoutsRes.data);
    if (cyclesRes.data) setCycles(cyclesRes.data);
    setWorkoutCount(countRes.count || 0);
  };

  const handleStartWorkout = () => {
    if (!isPremium && workoutCount >= 5) {
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
    setSelectedCycleId(workout.cycle_id);

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
            fetchData();
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

  const handleUpdateExercise = (index: number, field: keyof Exercise, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleSaveWorkout = async () => {
    if (!profile) return;

    setSaving(true);

    if (editingWorkout) {
      const { error: updateError } = await supabase
        .from('workouts')
        .update({
          workout_type: workoutType,
          duration_minutes: parseInt(duration) || 0,
          intensity: parseInt(intensity) || 5,
          notes,
          cycle_id: selectedCycleId,
        })
        .eq('id', editingWorkout.id);

      if (!updateError) {
        await supabase.from('exercises').delete().eq('workout_id', editingWorkout.id);

        if (exercises.length > 0) {
          const exercisesData = exercises.map((ex) => ({
            workout_id: editingWorkout.id,
            ...ex,
          }));
          await supabase.from('exercises').insert(exercisesData);
        }
      }
    } else {
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: profile.id,
          workout_type: workoutType,
          duration_minutes: parseInt(duration) || 0,
          intensity: parseInt(intensity) || 5,
          notes,
          cycle_id: selectedCycleId,
        })
        .select()
        .single();

      if (!workoutError && workout && exercises.length > 0) {
        const exercisesData = exercises.map((ex) => ({
          workout_id: workout.id,
          ...ex,
        }));
        await supabase.from('exercises').insert(exercisesData);
      }
    }

    setSaving(false);
    setShowWorkoutModal(false);
    resetForm();
    fetchData();
  };

  const handleAddCycle = () => {
    setEditingCycle(null);
    resetCycleForm();
    setShowCycleModal(true);
  };

  const handleEditCycle = (cycle: Cycle) => {
    setEditingCycle(cycle);
    setCycleName(cycle.name);
    setCycleType(cycle.cycle_type);
    setCycleDescription(cycle.description || '');
    setCycleStartDate(new Date(cycle.start_date));
    setCycleEndDate(new Date(cycle.end_date));
    setShowCycleModal(true);
  };

  const handleSaveCycle = async () => {
    if (!profile || !cycleName) return;

    if (editingCycle) {
      await supabase.from('cycles').update({
        name: cycleName,
        description: cycleDescription,
        cycle_type: cycleType,
        start_date: cycleStartDate.toISOString().split('T')[0],
        end_date: cycleEndDate.toISOString().split('T')[0],
      }).eq('id', editingCycle.id);
    } else {
      await supabase.from('cycles').insert({
        user_id: profile.id,
        name: cycleName,
        description: cycleDescription,
        cycle_type: cycleType,
        start_date: cycleStartDate.toISOString().split('T')[0],
        end_date: cycleEndDate.toISOString().split('T')[0],
        is_active: false,
      });
    }

    setShowCycleModal(false);
    resetCycleForm();
    setEditingCycle(null);
    fetchData();
  };

  const handleDeleteCycle = async (cycle: Cycle) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this cycle?')) {
        await supabase.from('cycles').delete().eq('id', cycle.id);
        fetchData();
      }
    } else {
      Alert.alert('Delete Cycle', 'Are you sure you want to delete this cycle?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('cycles').delete().eq('id', cycle.id);
            fetchData();
          },
        },
      ]);
    }
  };

  const handleToggleActiveCycle = async (cycle: Cycle) => {
    await supabase.from('cycles').update({ is_active: false }).eq('user_id', profile!.id);

    await supabase
      .from('cycles')
      .update({ is_active: !cycle.is_active })
      .eq('id', cycle.id);

    fetchData();
  };

  const resetForm = () => {
    setWorkoutType('table_practice');
    setDuration('30');
    setIntensity('5');
    setNotes('');
    setSelectedCycleId(null);
    setExercises([]);
    setEditingWorkout(null);
  };

  const resetCycleForm = () => {
    setCycleName('');
    setCycleType('competition_prep');
    setCycleDescription('');
    setCycleStartDate(new Date());
    setCycleEndDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
    setEditingCycle(null);
  };

  const workoutTypes = [
    { value: 'table_practice', label: 'Table Practice' },
    { value: 'strength', label: 'Strength Training' },
    { value: 'technique', label: 'Technique' },
    { value: 'endurance', label: 'Endurance' },
    { value: 'sparring', label: 'Sparring' },
  ];

  const cycleTypes = [
    { value: 'competition_prep', label: 'Competition Prep' },
    { value: 'rehab', label: 'Rehabilitation' },
    { value: 'strength_building', label: 'Strength Building' },
    { value: 'technique_focus', label: 'Technique Focus' },
    { value: 'off_season', label: 'Off Season' },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Training</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.addButton, styles.cycleButton]}
            onPress={handleAddCycle}
          >
            <CalendarIcon size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { marginRight: 8 }]}
            onPress={() => router.push('/(tabs)/training/schedule')}
          >
            <Clock size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={handleStartWorkout}>
            <Plus size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
        <AdBanner />

        {cycles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Training Cycles</Text>
            {cycles.map((cycle) => (
              <View key={cycle.id} style={[styles.cycleCard, cycle.is_active && styles.cycleCardActive]}>
                <TouchableOpacity
                  onPress={() => router.push({
                    pathname: '/(tabs)/training/cycle-details',
                    params: { cycleId: cycle.id }
                  })}
                  style={styles.cycleMainContent}
                >
                  <View style={styles.cycleHeader}>
                    <Text style={styles.cycleName}>{cycle.name}</Text>
                    {cycle.is_active && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>ACTIVE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cycleType}>
                    {cycle.cycle_type.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                  <Text style={styles.cycleDates}>
                    {formatDate(cycle.start_date)} - {formatDate(cycle.end_date)}
                  </Text>
                  {cycle.description && (
                    <Text style={styles.cycleDescription} numberOfLines={2}>
                      {cycle.description}
                    </Text>
                  )}
                </TouchableOpacity>
                <View style={styles.cycleActions}>
                  <TouchableOpacity
                    style={styles.cycleActionButton}
                    onPress={() => handleEditCycle(cycle)}
                  >
                    <Edit2 size={18} color="#2A7DE1" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cycleActionButton}
                    onPress={() => handleDeleteCycle(cycle)}
                  >
                    <Trash2 size={18} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {!isPremium && (
          <View style={styles.limitCard}>
            <Text style={styles.limitText}>Free: {workoutCount}/5 workouts tracked</Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => setShowPaywall(true)}
            >
              <Text style={styles.upgradeText}>Upgrade for Unlimited</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Workouts</Text>
          {workouts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No workouts yet</Text>
              <Text style={styles.emptySubtext}>Start tracking your training!</Text>
            </View>
          ) : (
            workouts.map((workout) => (
              <View key={workout.id} style={styles.workoutCard}>
                <View style={styles.workoutHeader}>
                  <View style={styles.workoutInfo}>
                    <Text style={styles.workoutType}>
                      {workout.workout_type.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.workoutDate}>
                      {formatDate(workout.created_at)}
                    </Text>
                  </View>
                  <View style={styles.workoutActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleEditWorkout(workout)}
                    >
                      <Edit2 size={18} color="#E63946" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleDeleteWorkout(workout)}
                    >
                      <Trash2 size={18} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.workoutDetails}>
                  <Text style={styles.workoutDetail}>
                    {workout.duration_minutes} min
                  </Text>
                  <Text style={styles.workoutDivider}>•</Text>
                  <Text style={styles.workoutDetail}>
                    Intensity: {workout.intensity}/10
                  </Text>
                </View>
                {workout.notes && (
                  <Text style={styles.workoutNotes} numberOfLines={2}>
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
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingWorkout ? 'Edit Workout' : 'Log Workout'}
            </Text>
            <TouchableOpacity onPress={() => setShowWorkoutModal(false)}>
              <X size={24} color="#999" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {cycles.length > 0 && (
              <>
                <Text style={styles.label}>Training Cycle (Optional)</Text>
                <View style={styles.typeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      selectedCycleId === null && styles.typeButtonActive,
                    ]}
                    onPress={() => setSelectedCycleId(null)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        selectedCycleId === null && styles.typeButtonTextActive,
                      ]}
                    >
                      None
                    </Text>
                  </TouchableOpacity>
                  {cycles.map((cycle) => (
                    <TouchableOpacity
                      key={cycle.id}
                      style={[
                        styles.typeButton,
                        selectedCycleId === cycle.id && styles.typeButtonActive,
                      ]}
                      onPress={() => setSelectedCycleId(cycle.id)}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          selectedCycleId === cycle.id && styles.typeButtonTextActive,
                        ]}
                      >
                        {cycle.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.label}>Workout Type</Text>
            <View style={styles.typeContainer}>
              {workoutTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    workoutType === type.value && styles.typeButtonActive,
                  ]}
                  onPress={() => setWorkoutType(type.value)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      workoutType === type.value && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              placeholder="30"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Intensity (1-10)</Text>
            <TextInput
              style={styles.input}
              value={intensity}
              onChangeText={setIntensity}
              keyboardType="number-pad"
              placeholder="5"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholder="How did it go?"
              placeholderTextColor="#666"
            />

            <View style={styles.exercisesSection}>
              <View style={styles.exercisesHeader}>
                <Text style={styles.label}>Exercises (Optional)</Text>
                <TouchableOpacity
                  style={styles.addExerciseButton}
                  onPress={handleAddExercise}
                >
                  <Plus size={20} color="#E63946" />
                  <Text style={styles.addExerciseText}>Add Exercise</Text>
                </TouchableOpacity>
              </View>

              {exercises.map((exercise, index) => (
                <View key={index} style={styles.exerciseCard}>
                  <View style={styles.exerciseCardHeader}>
                    <Text style={styles.exerciseCardTitle}>Exercise {index + 1}</Text>
                    <TouchableOpacity onPress={() => handleRemoveExercise(index)}>
                      <X size={20} color="#999" />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.input}
                    value={exercise.exercise_name}
                    onChangeText={(val) =>
                      handleUpdateExercise(index, 'exercise_name', val)
                    }
                    placeholder="Exercise name"
                    placeholderTextColor="#666"
                  />

                  <View style={styles.exerciseRow}>
                    <View style={styles.exerciseInputGroup}>
                      <Text style={styles.smallLabel}>Sets</Text>
                      <TextInput
                        style={styles.smallInput}
                        value={String(exercise.sets)}
                        onChangeText={(val) =>
                          handleUpdateExercise(index, 'sets', parseInt(val) || 0)
                        }
                        keyboardType="number-pad"
                      />
                    </View>

                    <View style={styles.exerciseInputGroup}>
                      <Text style={styles.smallLabel}>Reps</Text>
                      <TextInput
                        style={styles.smallInput}
                        value={String(exercise.reps)}
                        onChangeText={(val) =>
                          handleUpdateExercise(index, 'reps', parseInt(val) || 0)
                        }
                        keyboardType="number-pad"
                      />
                    </View>

                    <View style={styles.exerciseInputGroup}>
                      <Text style={styles.smallLabel}>Weight ({profile?.weight_unit || 'lbs'})</Text>
                      <TextInput
                        style={styles.smallInput}
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
                {saving ? 'Saving...' : editingWorkout ? 'Update Workout' : 'Save Workout'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalBottomSpacing} />
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showCycleModal}
        animationType="slide"
        onRequestClose={() => setShowCycleModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingCycle ? 'Edit Training Cycle' : 'New Training Cycle'}
            </Text>
            <TouchableOpacity onPress={() => setShowCycleModal(false)}>
              <X size={24} color="#999" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Cycle Name</Text>
            <TextInput
              style={styles.input}
              value={cycleName}
              onChangeText={setCycleName}
              placeholder="e.g., Competition Prep 2025"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Cycle Type</Text>
            <View style={styles.typeContainer}>
              {cycleTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    cycleType === type.value && styles.typeButtonActive,
                  ]}
                  onPress={() => setCycleType(type.value)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      cycleType === type.value && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {cycleStartDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <CalendarIcon size={20} color="#999" />
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker
                value={cycleStartDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowStartDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setCycleStartDate(selectedDate);
                  }
                }}
              />
            )}

            <Text style={styles.label}>End Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {cycleEndDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <CalendarIcon size={20} color="#999" />
            </TouchableOpacity>
            {showEndDatePicker && (
              <DateTimePicker
                value={cycleEndDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowEndDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setCycleEndDate(selectedDate);
                  }
                }}
              />
            )}

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={cycleDescription}
              onChangeText={setCycleDescription}
              multiline
              numberOfLines={3}
              placeholder="Describe your training cycle..."
              placeholderTextColor="#666"
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveCycle}>
              <Save size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>
                {editingCycle ? 'Update Cycle' : 'Create Cycle'}
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
        feature="Unlimited workout tracking"
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    backgroundColor: '#E63946',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cycleButton: {
    backgroundColor: '#2A7DE1',
  },
  content: {
    flex: 1,
    padding: 20,
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
  cycleCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cycleCardActive: {
    borderColor: '#2A7DE1',
  },
  cycleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cycleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
  },
  activeBadge: {
    backgroundColor: '#2A7DE1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
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
  cycleMainContent: {
    flex: 1,
  },
  cycleActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cycleActionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
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
  dateButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#FFF',
  },
});
