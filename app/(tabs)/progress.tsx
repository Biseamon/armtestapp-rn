import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase, Goal, StrengthTest, Workout } from '@/lib/supabase';
import { AdBanner } from '@/components/AdBanner';
import { PaywallModal } from '@/components/PaywallModal';
import { EnhancedProgressGraphs } from '@/components/EnhancedProgressGraphs';
import { Plus, Target, X, Save, Trophy, TrendingUp, Calendar, Edit2, Trash2 } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatWeight, convertToLbs } from '@/lib/weightUtils';

const { width } = Dimensions.get('window');

export default function Progress() {
  const { profile, isPremium } = useAuth();
  const { colors } = useTheme();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [strengthTests, setStrengthTests] = useState<StrengthTest[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [loading, setLoading] = useState(true);

  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalType, setGoalType] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);

  const [editingTest, setEditingTest] = useState<StrengthTest | null>(null);
  const [testType, setTestType] = useState('max_wrist_curl');
  const [testResult, setTestResult] = useState('');
  const [testNotes, setTestNotes] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (profile) {
        fetchData();
      }
    }, [profile])
  );

  const fetchData = async () => {
    if (!profile) return;

    const [goalsResponse, testsResponse, workoutsResponse] = await Promise.all([
      supabase
        .from('goals')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('strength_tests')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('workouts')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false }),
    ]);

    if (goalsResponse.data) setGoals(goalsResponse.data);
    if (testsResponse.data) setStrengthTests(testsResponse.data);
    if (workoutsResponse.data) setWorkouts(workoutsResponse.data);

    setLoading(false);
  };

  const handleAddGoal = () => {
    if (!isPremium && goals.length >= 3) {
      setShowPaywall(true);
      return;
    }
    setShowGoalModal(true);
  };

  const handleSaveGoal = async () => {
    if (!profile || !goalType || !targetValue) return;

    if (editingGoal) {
      await supabase
        .from('goals')
        .update({
          goal_type: goalType,
          target_value: parseInt(targetValue),
          deadline: deadline.toISOString().split('T')[0],
        })
        .eq('id', editingGoal.id);
    } else {
      await supabase.from('goals').insert({
        user_id: profile.id,
        goal_type: goalType,
        target_value: parseInt(targetValue),
        deadline: deadline.toISOString().split('T')[0],
        current_value: 0,
        is_completed: false,
      });
    }

    setGoalType('');
    setTargetValue('');
    setDeadline(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    setEditingGoal(null);
    setShowGoalModal(false);
    fetchData();
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalType(goal.goal_type);
    setTargetValue(goal.target_value.toString());
    setDeadline(new Date(goal.deadline));
    setShowGoalModal(true);
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this goal?')) {
        await supabase.from('goals').delete().eq('id', goalId);
        fetchData();
      }
    } else {
      Alert.alert('Delete Goal', 'Are you sure you want to delete this goal?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('goals').delete().eq('id', goalId);
            fetchData();
          },
        },
      ]);
    }
  };

  const handleToggleGoal = async (goal: Goal) => {
    await supabase
      .from('goals')
      .update({ is_completed: !goal.is_completed })
      .eq('id', goal.id);

    fetchData();
  };

  const handleSaveTest = async () => {
    if (!profile || !testResult) return;

    const resultInLbs = convertToLbs(parseFloat(testResult), profile.weight_unit || 'lbs');

    if (editingTest) {
      await supabase
        .from('strength_tests')
        .update({
          test_type: testType,
          result_value: resultInLbs,
          notes: testNotes,
        })
        .eq('id', editingTest.id);
    } else {
      await supabase.from('strength_tests').insert({
        user_id: profile.id,
        test_type: testType,
        result_value: resultInLbs,
        notes: testNotes,
      });
    }

    setTestType('max_wrist_curl');
    setTestResult('');
    setTestNotes('');
    setEditingTest(null);
    setShowTestModal(false);
    fetchData();
  };

  const handleEditTest = (test: StrengthTest) => {
    setEditingTest(test);
    setTestType(test.test_type);
    setTestResult(test.result_value.toString());
    setTestNotes(test.notes || '');
    setShowTestModal(true);
  };

  const handleDeleteTest = async (testId: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this test?')) {
        await supabase.from('strength_tests').delete().eq('id', testId);
        fetchData();
      }
    } else {
      Alert.alert('Delete Test', 'Are you sure you want to delete this test?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('strength_tests').delete().eq('id', testId);
            fetchData();
          },
        },
      ]);
    }
  };

  const testTypes = [
    { value: 'max_wrist_curl', label: 'Max Wrist Curl' },
    { value: 'max_grip_strength', label: 'Max Grip Strength' },
    { value: 'pronation_strength', label: 'Pronation Strength' },
    { value: 'supination_strength', label: 'Supination Strength' },
    { value: 'endurance_test', label: 'Endurance Test' },
  ];

  const getProgressPercentage = (goal: Goal) => {
    return Math.min((goal.current_value / goal.target_value) * 100, 100);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Progress</Text>
      </View>

      <ScrollView style={styles.content}>
        <AdBanner />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analytics</Text>
          <EnhancedProgressGraphs
            workouts={workouts}
            strengthTests={strengthTests}
            weightUnit={profile?.weight_unit || 'lbs'}
            isPremium={isPremium}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Goals</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddGoal}>
              <Plus size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {!isPremium && (
            <Text style={styles.limitText}>Free: {goals.length}/3 goals</Text>
          )}

          {goals.length === 0 ? (
            <View style={styles.emptyState}>
              <Target size={40} color="#666" />
              <Text style={styles.emptyText}>No goals yet</Text>
              <Text style={styles.emptySubtext}>Set your first training goal!</Text>
            </View>
          ) : (
            goals.map((goal) => (
              <View
                key={goal.id}
                style={[
                  styles.goalCard,
                  goal.is_completed && styles.goalCardCompleted,
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleToggleGoal(goal)}
                  style={{ flex: 1 }}
                >
                  <View style={styles.goalHeader}>
                    <View style={styles.goalInfo}>
                      {goal.is_completed && (
                        <Trophy size={20} color="#FFD700" style={styles.goalIcon} />
                      )}
                      <Text
                        style={[
                          styles.goalType,
                          goal.is_completed && styles.goalTypeCompleted,
                        ]}
                      >
                        {goal.goal_type}
                      </Text>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditGoal(goal)}
                      >
                        <Edit2 size={16} color="#2A7DE1" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteGoal(goal.id)}
                      >
                        <Trash2 size={16} color="#E63946" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {goal.deadline && (
                    <Text style={styles.goalDeadline}>
                      {new Date(goal.deadline).toLocaleDateString()}
                    </Text>
                  )}
                  <Text style={styles.goalProgress}>
                    {goal.current_value} / {goal.target_value}
                  </Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${getProgressPercentage(goal)}%` },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Strength Tests</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowTestModal(true)}
            >
              <Plus size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {strengthTests.length === 0 ? (
            <View style={styles.emptyState}>
              <TrendingUp size={40} color="#666" />
              <Text style={styles.emptyText}>No tests recorded</Text>
              <Text style={styles.emptySubtext}>Track your strength progress!</Text>
            </View>
          ) : (
            strengthTests.map((test) => (
              <View key={test.id} style={styles.testCard}>
                <View style={styles.testHeader}>
                  <Text style={styles.testType}>
                    {test.test_type.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditTest(test)}
                    >
                      <Edit2 size={16} color="#2A7DE1" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteTest(test.id)}
                    >
                      <Trash2 size={16} color="#E63946" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.testDate}>
                  {new Date(test.created_at).toLocaleDateString()}
                </Text>
                <Text style={styles.testResult}>
                  {formatWeight(test.result_value, profile?.weight_unit || 'lbs')}
                </Text>
                {test.notes && (
                  <Text style={styles.testNotes}>{test.notes}</Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showGoalModal}
        animationType="slide"
        onRequestClose={() => setShowGoalModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingGoal ? 'Edit Goal' : 'New Goal'}</Text>
            <TouchableOpacity onPress={() => {
              setShowGoalModal(false);
              setEditingGoal(null);
              setGoalType('');
              setTargetValue('');
            }}>
              <X size={24} color="#999" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Goal Description</Text>
            <TextInput
              style={styles.input}
              value={goalType}
              onChangeText={setGoalType}
              placeholder="e.g., Win 10 matches"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Target Value</Text>
            <TextInput
              style={styles.input}
              value={targetValue}
              onChangeText={setTargetValue}
              keyboardType="number-pad"
              placeholder="10"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Deadline</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDeadlinePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {deadline.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <Calendar size={20} color="#999" />
            </TouchableOpacity>
            {showDeadlinePicker && (
              <DateTimePicker
                value={deadline}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDeadlinePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setDeadline(selectedDate);
                  }
                }}
              />
            )}

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveGoal}>
              <Save size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>Save Goal</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showTestModal}
        animationType="slide"
        onRequestClose={() => setShowTestModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingTest ? 'Edit Test' : 'Record Test'}</Text>
            <TouchableOpacity onPress={() => {
              setShowTestModal(false);
              setEditingTest(null);
              setTestType('max_wrist_curl');
              setTestResult('');
              setTestNotes('');
            }}>
              <X size={24} color="#999" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Test Type</Text>
            <View style={styles.typeContainer}>
              {testTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    testType === type.value && styles.typeButtonActive,
                  ]}
                  onPress={() => setTestType(type.value)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      testType === type.value && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Result ({profile?.weight_unit || 'lbs'})</Text>
            <TextInput
              style={styles.input}
              value={testResult}
              onChangeText={setTestResult}
              keyboardType="decimal-pad"
              placeholder="100"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={testNotes}
              onChangeText={setTestNotes}
              multiline
              numberOfLines={3}
              placeholder="How did it feel?"
              placeholderTextColor="#666"
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveTest}>
              <Save size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>Save Test</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgrade={() => setShowPaywall(false)}
        feature="Unlimited goals tracking"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  addButton: {
    backgroundColor: '#E63946',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  limitText: {
    fontSize: 12,
    color: '#999',
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
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  goalCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  goalCardCompleted: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalIcon: {
    marginRight: 8,
  },
  goalType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  goalTypeCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  goalDeadline: {
    fontSize: 12,
    color: '#999',
  },
  goalProgress: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E63946',
    borderRadius: 4,
  },
  testCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E63946',
  },
  testDate: {
    fontSize: 12,
    color: '#999',
  },
  testResult: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  testNotes: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#2A7DE144',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#E6394644',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
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
