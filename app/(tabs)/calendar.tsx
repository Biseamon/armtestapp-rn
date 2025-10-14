import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, X, Trash2 } from 'lucide-react-native';

interface Workout {
  id: string;
  created_at: string;
  duration_minutes: number;
  notes: string;
}

interface Cycle {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  cycle_type: string;
}

interface Goal {
  id: string;
  title: string;
  target_date: string;
  is_completed: boolean;
}

interface DayData {
  date: Date;
  workoutCount: number;
  isInCycle: boolean;
  cycleName?: string;
  goalCount: number;
}

export default function CalendarScreen() {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showWorkouts, setShowWorkouts] = useState(true);
  const [showCycles, setShowCycles] = useState(true);
  const [showGoals, setShowGoals] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (profile) {
        fetchData();
      }
    }, [profile, selectedYear])
  );

  const fetchData = async () => {
    if (!profile) return;

    const startDate = `${selectedYear}-01-01`;
    const endDate = `${selectedYear}-12-31`;

    const [workoutsRes, cyclesRes, goalsRes, profileRes] = await Promise.all([
      supabase
        .from('workouts')
        .select('*')
        .eq('user_id', profile.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true }),
      supabase
        .from('cycles')
        .select('*')
        .eq('user_id', profile.id),
      supabase
        .from('goals')
        .select('*')
        .eq('user_id', profile.id)
        .gte('target_date', startDate)
        .lte('target_date', endDate),
      supabase
        .from('profiles')
        .select('created_at')
        .eq('id', profile.id)
        .single(),
    ]);

    if (workoutsRes.data) setWorkouts(workoutsRes.data);
    if (cyclesRes.data) setCycles(cyclesRes.data);
    if (goalsRes.data) setGoals(goalsRes.data);

    if (profileRes.data) {
      const registrationYear = new Date(profileRes.data.created_at).getFullYear();
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let year = registrationYear; year <= currentYear; year++) {
        years.push(year);
      }
      setAvailableYears(years);
    }
  };

  const getWorkoutCountForDate = (date: Date): number => {
    const dateStr = date.toISOString().split('T')[0];
    return workouts.filter((w) => w.created_at.split('T')[0] === dateStr).length;
  };

  const getGoalCountForDate = (date: Date): number => {
    const dateStr = date.toISOString().split('T')[0];
    return goals.filter((g) => g.target_date === dateStr).length;
  };

  const getGoalsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return goals.filter((g) => g.target_date === dateStr);
  };

  const isDateInCycle = (date: Date): { isInCycle: boolean; cycleName?: string } => {
    const dateStr = date.toISOString().split('T')[0];
    for (const cycle of cycles) {
      if (dateStr >= cycle.start_date && dateStr <= cycle.end_date) {
        return { isInCycle: true, cycleName: cycle.name };
      }
    }
    return { isInCycle: false };
  };

  const getDayColor = (workoutCount: number, isInCycle: boolean): string => {
    if (!showWorkouts && !showCycles) return '#2A2A2A';
    if (!showWorkouts && isInCycle && showCycles) return '#2A7DE144';
    if (!showCycles && workoutCount > 0 && showWorkouts) {
      if (workoutCount === 1) return '#E6394655';
      if (workoutCount === 2) return '#E6394688';
      if (workoutCount >= 3) return '#E63946';
    }
    if (workoutCount === 0 && !isInCycle) return '#2A2A2A';
    if (isInCycle && workoutCount === 0 && showCycles) return '#2A7DE144';
    if (workoutCount === 1 && showWorkouts) return '#E6394655';
    if (workoutCount === 2 && showWorkouts) return '#E6394688';
    if (workoutCount >= 3 && showWorkouts) return '#E63946';
    return '#2A2A2A';
  };

  const handleDayPress = (date: Date) => {
    const workoutCount = getWorkoutCountForDate(date);
    const { isInCycle } = isDateInCycle(date);
    if (workoutCount > 0 || isInCycle) {
      setSelectedDate(date);
      setShowDayModal(true);
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this workout?')) {
        await supabase.from('workouts').delete().eq('id', workoutId);
        fetchData();
      }
    } else {
      if (window.confirm('Are you sure you want to delete this workout?')) {
        await supabase.from('workouts').delete().eq('id', workoutId);
        fetchData();
      }
    }
  };

  const renderCalendar = () => {
    const months = [];
    const screenWidth = Dimensions.get('window').width;
    const daySize = Math.floor((screenWidth - 60) / 7);

    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(selectedYear, month, 1);
      const lastDay = new Date(selectedYear, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const days = [];
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(
          <View
            key={`empty-${i}`}
            style={[styles.day, { width: daySize, height: daySize }]}
          />
        );
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(selectedYear, month, day);
        const workoutCount = getWorkoutCountForDate(date);
        const goalCount = getGoalCountForDate(date);
        const { isInCycle, cycleName } = isDateInCycle(date);
        const dayColor = getDayColor(workoutCount, isInCycle);

        days.push(
          <TouchableOpacity
            key={day}
            style={[
              styles.day,
              {
                width: daySize,
                height: daySize,
                backgroundColor: dayColor,
                borderWidth: isInCycle && showCycles ? 2 : 0,
                borderColor: '#2A7DE1',
              },
            ]}
            onPress={() => handleDayPress(date)}
          >
            <Text
              style={[
                styles.dayText,
                workoutCount > 0 && styles.dayTextActive,
              ]}
            >
              {day}
            </Text>
            {goalCount > 0 && showGoals && (
              <View style={styles.goalIndicator}>
                <Text style={styles.goalIndicatorText}>🎯</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      }

      months.push(
        <View key={month} style={styles.monthContainer}>
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {new Date(selectedYear, month).toLocaleString('default', {
              month: 'long',
            })}
          </Text>
          <View style={styles.daysContainer}>{days}</View>
        </View>
      );
    }

    return months;
  };

  const getWorkoutsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return workouts.filter((w) => w.created_at.split('T')[0] === dateStr);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Calendar</Text>
      </View>

      <View style={styles.yearSelector}>
        <TouchableOpacity
          onPress={() =>
            setSelectedYear((y) => Math.max(y - 1, availableYears[0] || 2020))
          }
          disabled={selectedYear <= (availableYears[0] || 2020)}
        >
          <ChevronLeft
            size={24}
            color={
              selectedYear <= (availableYears[0] || 2020) ? '#333' : '#FFF'
            }
          />
        </TouchableOpacity>
        <Text style={[styles.yearText, { color: colors.text }]}>
          {selectedYear}
        </Text>
        <TouchableOpacity
          onPress={() =>
            setSelectedYear((y) =>
              Math.min(y + 1, new Date().getFullYear())
            )
          }
          disabled={selectedYear >= new Date().getFullYear()}
        >
          <ChevronRight
            size={24}
            color={
              selectedYear >= new Date().getFullYear() ? '#333' : '#FFF'
            }
          />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            showWorkouts && styles.filterButtonActive,
          ]}
          onPress={() => setShowWorkouts(!showWorkouts)}
        >
          <Text
            style={[
              styles.filterText,
              showWorkouts && styles.filterTextActive,
            ]}
          >
            Workouts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            showCycles && styles.filterButtonActive,
          ]}
          onPress={() => setShowCycles(!showCycles)}
        >
          <Text
            style={[
              styles.filterText,
              showCycles && styles.filterTextActive,
            ]}
          >
            Cycles
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            showGoals && styles.filterButtonActive,
          ]}
          onPress={() => setShowGoals(!showGoals)}
        >
          <Text
            style={[
              styles.filterText,
              showGoals && styles.filterTextActive,
            ]}
          >
            Goals
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#2A2A2A' }]} />
          <Text style={styles.legendText}>No workout</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendBox, { backgroundColor: '#2A7DE144' }]}
          />
          <Text style={styles.legendText}>In cycle</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendBox, { backgroundColor: '#E6394655' }]}
          />
          <Text style={styles.legendText}>1 workout</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendBox, { backgroundColor: '#E63946' }]}
          />
          <Text style={styles.legendText}>3+ workouts</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {renderCalendar()}
      </ScrollView>

      <Modal
        visible={showDayModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDate?.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <TouchableOpacity onPress={() => setShowDayModal(false)}>
                <X size={24} color="#999" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedDate && (
                <>
                  <Text style={styles.modalSectionTitle}>
                    Workouts ({getWorkoutsForDate(selectedDate).length})
                  </Text>
                  {getWorkoutsForDate(selectedDate).map((workout) => (
                    <View key={workout.id} style={styles.workoutCard}>
                      <View style={styles.workoutHeader}>
                        <Text style={styles.workoutDuration}>
                          {workout.duration_minutes} minutes
                        </Text>
                        <TouchableOpacity onPress={() => handleDeleteWorkout(workout.id)}>
                          <Trash2 size={18} color="#E63946" />
                        </TouchableOpacity>
                      </View>
                      {workout.notes && (
                        <Text style={styles.workoutNotes}>{workout.notes}</Text>
                      )}
                    </View>
                  ))}

                  <Text style={styles.modalSectionTitle}>
                    Goals ({getGoalsForDate(selectedDate).length})
                  </Text>
                  {getGoalsForDate(selectedDate).length > 0 ? (
                    getGoalsForDate(selectedDate).map((goal) => (
                      <View key={goal.id} style={styles.goalCard}>
                        <View style={styles.goalContent}>
                          <Text style={styles.goalEmoji}>🎯</Text>
                          <View style={styles.goalInfo}>
                            <Text style={[styles.goalTitle, goal.is_completed && styles.goalCompleted]}>
                              {goal.title}
                            </Text>
                            {goal.is_completed && (
                              <Text style={styles.goalStatus}>✓ Completed</Text>
                            )}
                          </View>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No goals for this date</Text>
                  )}

                  {isDateInCycle(selectedDate).isInCycle && (
                    <>
                      <Text style={styles.modalSectionTitle}>Training Cycle</Text>
                      <View style={styles.cycleCard}>
                        <Text style={styles.cycleName}>
                          {isDateInCycle(selectedDate).cycleName}
                        </Text>
                      </View>
                    </>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 16,
  },
  yearText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    minWidth: 120,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#E63946',
  },
  filterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  filterTextActive: {
    color: '#FFF',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#999',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  monthContainer: {
    marginBottom: 24,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  day: {
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  dayText: {
    fontSize: 12,
    color: '#666',
  },
  dayTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
  },
  modalContent: {
    padding: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 12,
    marginBottom: 12,
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
    alignItems: 'center',
    marginBottom: 4,
  },
  workoutDuration: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E63946',
  },
  workoutNotes: {
    fontSize: 14,
    color: '#CCC',
  },
  cycleCard: {
    backgroundColor: '#2A7DE144',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2A7DE1',
  },
  cycleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A7DE1',
  },
  goalIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  goalIndicatorText: {
    fontSize: 10,
  },
  goalCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  goalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalEmoji: {
    fontSize: 24,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  goalCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  goalStatus: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
});
