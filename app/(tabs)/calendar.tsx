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
  Alert,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Workout, StrengthTest } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, X, TrendingUp, Pencil, Trash2 } from 'lucide-react-native';
import { convertWeight, formatWeight } from '@/lib/weightUtils';

interface Cycle {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  cycle_type: string;
}

interface Goal {
  id: string;
  goal_type: string;
  deadline: string;
  is_completed: boolean;
}

interface DayData {
  date: Date;
  workoutCount: number;
  isInCycle: boolean;
  cycleName?: string;
  goalCount: number;
  strengthTestCount: number;
}

export default function CalendarScreen() {
  const { colors } = useTheme();
  const { profile, isPremium } = useAuth(); // Add isPremium here
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [strengthTests, setStrengthTests] = useState<StrengthTest[]>([]);
  const [scheduledTrainings, setScheduledTrainings] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showWorkouts, setShowWorkouts] = useState(true);
  const [showCycles, setShowCycles] = useState(true);
  const [showGoals, setShowGoals] = useState(true);
  const [showStrengthTests, setShowStrengthTests] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (profile) {
        fetchData();
      }
      return () => {};
    }, [profile, currentYear])
  );

  const fetchData = async () => {
    if (!profile) return;

    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-12-31`;

    const [workoutsRes, cyclesRes, goalsRes, strengthTestsRes, scheduledTrainingsRes, profileRes] = await Promise.all([
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
        .gte('deadline', startDate)
        .lte('deadline', endDate),
      supabase
        .from('strength_tests')
        .select('*')
        .eq('user_id', profile.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true }),
      supabase
        .from('scheduled_trainings')
        .select('*')
        .eq('user_id', profile.id)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate),
      supabase
        .from('profiles')
        .select('created_at')
        .eq('id', profile.id)
        .single(),
    ]);

    if (workoutsRes.data) setWorkouts(workoutsRes.data);
    if (cyclesRes.data) setCycles(cyclesRes.data);
    if (goalsRes.data) setGoals(goalsRes.data);
    if (strengthTestsRes.data) setStrengthTests(strengthTestsRes.data);
    if (scheduledTrainingsRes.data) setScheduledTrainings(scheduledTrainingsRes.data);

    if (profileRes.data) {
      const registrationYear = new Date(profileRes.data.created_at).getFullYear();
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let year = registrationYear; year <= currentYear + 2; year++) {
        years.push(year);
      }
      setAvailableYears(years);
    }
  };

  const getWorkoutCountForDate = (date: Date): number => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return workouts.filter((w) => w.created_at.split('T')[0] === dateStr).length;
  };

  const getGoalCountForDate = (date: Date): number => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return goals.filter((g) => g.deadline === dateStr).length;
  };

  const getStrengthTestCountForDate = (date: Date): number => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return strengthTests.filter((st) => st.created_at.split('T')[0] === dateStr).length;
  };

  const getGoalsForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return goals.filter((g) => g.deadline === dateStr);
  };

  const getStrengthTestsForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return strengthTests.filter((st) => st.created_at.split('T')[0] === dateStr);
  };

  const getScheduledTrainingsForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return scheduledTrainings.filter((t) => t.scheduled_date === dateStr);
  };

  const isDateInCycle = (date: Date): { isInCycle: boolean; cycleName?: string; cycleCount?: number; allCycles?: Cycle[] } => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const activeCycles = cycles.filter(cycle => 
      dateStr >= cycle.start_date && dateStr <= cycle.end_date
    );
    
    if (activeCycles.length > 0) {
      return { 
        isInCycle: true, 
        cycleName: activeCycles[0].name,
        cycleCount: activeCycles.length,
        allCycles: activeCycles
      };
    }
    
    return { isInCycle: false, cycleCount: 0 };
  };

  const getDayColor = (workoutCount: number, isInCycle: boolean, scheduledCount: number, strengthTestCount: number, isFuture: boolean): string => {
    if (!showWorkouts && !showCycles && !showStrengthTests) return colors.surface;
    if (!showWorkouts && isInCycle && showCycles) return '#2A7DE144';
    if (!showCycles && workoutCount > 0 && showWorkouts) {
      if (workoutCount === 1) return '#E6394655';
      if (workoutCount === 2) return '#E6394688';
      if (workoutCount >= 3) return '#E63946';
    }

    if (isFuture && scheduledCount > 0) return '#FFA50055';

    // Priority for strength tests
    if (strengthTestCount > 0 && showStrengthTests) return '#10B98155';

    if (workoutCount === 0 && !isInCycle && scheduledCount === 0 && strengthTestCount === 0) return colors.surface;
    if (isInCycle && workoutCount === 0 && showCycles) return '#2A7DE144';
    if (workoutCount === 1 && showWorkouts) return '#E6394655';
    if (workoutCount === 2 && showWorkouts) return '#E6394688';
    if (workoutCount >= 3 && showWorkouts) return '#E63946';
    return colors.surface;
  };

  const handleDayPress = (date: Date) => {
    const workoutCount = getWorkoutCountForDate(date);
    const scheduledCount = getScheduledTrainingsForDate(date).length;
    const strengthTestCount = getStrengthTestCountForDate(date);
    const cycleInfo = isDateInCycle(date);
    const goalCount = getGoalCountForDate(date);

    if (workoutCount > 0 || cycleInfo.isInCycle || goalCount > 0 || scheduledCount > 0 || strengthTestCount > 0) {
      setSelectedDate(date);
      setShowDayModal(true);
    }
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const canGoForward = () => {
    const today = new Date();
    const maxYear = today.getFullYear() + 2;
    const maxMonth = today.getMonth();

    if (currentYear > maxYear) return false;
    if (currentYear === maxYear && currentMonth >= maxMonth) return false;

    return true;
  };

  const renderCalendar = () => {
    const screenWidth = Dimensions.get('window').width;
    const availableWidth = screenWidth - 40 - 24;
    const daySize = Math.floor(availableWidth / 7);
  
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
  
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const headers = dayHeaders.map((dayName, index) => (
      <View
        key={`header-${index}`}
        style={[styles.dayHeader, { width: daySize }]}
      >
        <Text style={[styles.dayHeaderText, { color: colors.textSecondary }]}>
          {dayName}
        </Text>
      </View>
    ));
  
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <View
          key={`empty-${i}`}
          style={[styles.day, { width: daySize, height: daySize }]}
        />
      );
    }
  
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      date.setHours(0, 0, 0, 0);
  
      const workoutCount = getWorkoutCountForDate(date);
      const scheduledCount = getScheduledTrainingsForDate(date).length;
      const goalCount = getGoalCountForDate(date);
      const strengthTestCount = getStrengthTestCountForDate(date);
      const cycleInfo = isDateInCycle(date);
      const isFuture = date > today;
      const dayColor = getDayColor(workoutCount, cycleInfo.isInCycle, scheduledCount, strengthTestCount, isFuture);
  
      const isToday = date.getDate() === today.getDate() &&
                      date.getMonth() === today.getMonth() &&
                      date.getFullYear() === today.getFullYear();
  
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.day,
            {
              width: daySize,
              height: daySize,
              backgroundColor: dayColor,
              borderWidth: cycleInfo.isInCycle && showCycles ? 2 : isToday ? 2 : 0,
              borderColor: isToday ? colors.primary : '#2A7DE1',
            },
          ]}
          onPress={() => handleDayPress(date)}
        >
          <Text
            style={[
              styles.dayText,
              { color: (workoutCount > 0 || scheduledCount > 0 || strengthTestCount > 0) ? '#FFF' : colors.text },
              (workoutCount > 0 || scheduledCount > 0 || strengthTestCount > 0) && styles.dayTextActive,
              isToday && !workoutCount && !strengthTestCount && { color: colors.primary, fontWeight: 'bold' },
            ]}
          >
            {day}
          </Text>
          {cycleInfo.isInCycle && cycleInfo.cycleCount && cycleInfo.cycleCount > 1 && showCycles && (
            <View style={styles.multipleCyclesIndicator}>
              <Text style={styles.multipleCyclesText}>{cycleInfo.cycleCount}</Text>
            </View>
          )}
          {goalCount > 0 && showGoals && (
            <View style={styles.goalIndicator}>
              <Text style={styles.goalIndicatorText}>🎯</Text>
            </View>
          )}
          {strengthTestCount > 0 && showStrengthTests && (
            <View style={styles.strengthTestIndicator}>
              <Text style={styles.strengthTestIndicatorText}>💪</Text>
            </View>
          )}
          {scheduledCount > 0 && isFuture && (
            <View style={styles.scheduledIndicator}>
              <Text style={styles.scheduledIndicatorText}>📅</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }
  
    return (
      <View style={styles.calendarContainer}>
        <View style={styles.monthHeader}>
          <TouchableOpacity
            onPress={handlePreviousMonth}
            style={styles.monthNavButton}
          >
            <ChevronLeft size={28} color={colors.text} />
          </TouchableOpacity>
  
          <Text style={[styles.monthYearTitle, { color: colors.text }]}>
            {new Date(currentYear, currentMonth).toLocaleString('default', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
  
          <TouchableOpacity
            onPress={handleNextMonth}
            disabled={!canGoForward()}
            style={styles.monthNavButton}
          >
            <ChevronRight
              size={28}
              color={canGoForward() ? colors.text : colors.border}
            />
          </TouchableOpacity>
        </View>
  
        <View style={styles.dayHeadersContainer}>{headers}</View>
        <View style={styles.daysContainer}>{days}</View>
      </View>
    );
  };

  const getWorkoutsForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return workouts.filter((w) => w.created_at.split('T')[0] === dateStr);
  };

  const handleEditWorkout = (workout: Workout) => {
    setShowDayModal(false);
    // Navigate to training screen and trigger edit
    router.push('/(tabs)/training');
    // The edit will be handled by the training screen
    // We'll pass the workout ID as a query parameter
    setTimeout(() => {
      router.push({
        pathname: '/(tabs)/training',
        params: { editWorkoutId: workout.id }
      });
    }, 100);
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
            // Refresh data
            fetchData();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Calendar</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
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
          <TouchableOpacity
            style={[
              styles.filterButton,
              showStrengthTests && styles.filterButtonActive,
            ]}
            onPress={() => setShowStrengthTests(!showStrengthTests)}
          >
            <Text
              style={[
                styles.filterText,
                showStrengthTests && styles.filterTextActive,
              ]}
            >
              PR's
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.legendScrollView}>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#2A2A2A' }]} />
            <Text style={styles.legendText}>No activity</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendBox, { backgroundColor: '#2A7DE144', borderWidth: 2, borderColor: '#2A7DE1' }]}
            />
            <Text style={styles.legendText}>In cycle</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendBox}>
              <View style={[styles.legendBox, { backgroundColor: '#2A7DE144', borderWidth: 2, borderColor: '#2A7DE1', position: 'absolute' }]} />
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#2A7DE1', zIndex: 1 }}>2</Text>
            </View>
            <Text style={styles.legendText}>Multiple cycles</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendBox, { backgroundColor: '#FFA50055' }]}
            />
            <Text style={styles.legendText}>Scheduled</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendBox, { backgroundColor: '#10B98155' }]}
            />
            <Text style={styles.legendText}>Test</Text>
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
      </ScrollView>

      {/* AdMob Banner Placeholder - Standard Banner */}
      {!isPremium && (
        <View style={[styles.adBannerContainer, { backgroundColor: colors.surface }]}>
          <View style={[styles.adBannerPlaceholder, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.adBannerText, { color: colors.textSecondary }]}>
              📱 Ad Space
            </Text>
            <Text style={[styles.adBannerSubtext, { color: colors.textTertiary }]}>
              320x50
            </Text>
          </View>
        </View>
      )}

      <View style={styles.content}>
        {renderCalendar()}
      </View>

      <Modal
        visible={showDayModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
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
                  {getScheduledTrainingsForDate(selectedDate).length > 0 && (
                    <>
                      <Text style={[styles.modalSectionTitle, { color: colors.text }]}>
                        Scheduled Trainings ({getScheduledTrainingsForDate(selectedDate).length})
                      </Text>
                      {getScheduledTrainingsForDate(selectedDate).map((training) => (
                        <View key={training.id} style={[styles.scheduledCard, { backgroundColor: colors.surface }]}>
                          <View style={styles.scheduledHeader}>
                            <Text style={[styles.scheduledTitle, { color: colors.primary }]}>
                              {training.title}
                            </Text>
                            <Text style={[styles.scheduledTime, { color: colors.textSecondary }]}>
                              {new Date(`2000-01-01T${training.scheduled_time}`).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Text>
                          </View>
                          {training.description && (
                            <Text style={[styles.scheduledDescription, { color: colors.textSecondary }]}>
                              {training.description}
                            </Text>
                          )}
                        </View>
                      ))}
                    </>
                  )}

                  {getStrengthTestsForDate(selectedDate).length > 0 && (
                    <>
                      <Text style={[styles.modalSectionTitle, { color: colors.text }]}>
                        Personal Records ({getStrengthTestsForDate(selectedDate).length})
                      </Text>
                      {getStrengthTestsForDate(selectedDate).map((test) => {
                        const userUnit = profile?.weight_unit || 'lbs';
                        const storedUnit = test.result_unit || 'lbs';
                        const displayValue = convertWeight(test.result_value, storedUnit, userUnit);
                        
                        return (
                          <View key={test.id} style={[styles.strengthTestCard, { backgroundColor: colors.surface }]}>
                            <View style={styles.strengthTestHeader}>
                              <TrendingUp size={20} color="#10B981" />
                              <Text style={[styles.strengthTestType, { color: colors.text }]}>
                                {test.test_type.replace(/_/g, ' ').toUpperCase()}
                              </Text>
                            </View>
                            <Text style={[styles.strengthTestResult, { color: '#10B981' }]}>
                              {formatWeight(displayValue, userUnit)}
                            </Text>
                            {test.notes && (
                              <Text style={[styles.strengthTestNotes, { color: colors.textSecondary }]}>
                                {test.notes}
                              </Text>
                            )}
                            <Text style={[styles.strengthTestTime, { color: colors.textSecondary }]}>
                              {new Date(test.created_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Text>
                          </View>
                        );
                      })}
                    </>
                  )}

                  <Text style={[styles.modalSectionTitle, { color: colors.text }]}>
                    Workouts ({getWorkoutsForDate(selectedDate).length})
                  </Text>
                  {getWorkoutsForDate(selectedDate).map((workout) => (
                    <View key={workout.id} style={[styles.workoutCard, { backgroundColor: colors.surface }]}>
                      <View style={styles.workoutCardHeader}>
                        <Text style={[styles.workoutType, { color: colors.primary }]}>
                          {workout.workout_type?.replace(/_/g, ' ').toUpperCase() || 'WORKOUT'}
                        </Text>
                        <View style={styles.workoutActions}>
                          <TouchableOpacity
                            style={styles.workoutActionButton}
                            onPress={() => handleEditWorkout(workout)}
                          >
                            <Pencil size={18} color={colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.workoutActionButton}
                            onPress={() => handleDeleteWorkout(workout)}
                          >
                            <Trash2 size={18} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.workoutStats}>
                        <View style={styles.workoutStat}>
                          <Text style={[styles.workoutStatLabel, { color: colors.textTertiary }]}>Duration</Text>
                          <Text style={[styles.workoutStatValue, { color: colors.text }]}>{workout.duration_minutes} min</Text>
                        </View>
                        <View style={styles.workoutStat}>
                          <Text style={[styles.workoutStatLabel, { color: colors.textTertiary }]}>Intensity</Text>
                          <Text style={[styles.workoutStatValue, { color: colors.text }]}>{workout.intensity}/10</Text>
                        </View>
                        <View style={styles.workoutStat}>
                          <Text style={[styles.workoutStatLabel, { color: colors.textTertiary }]}>Time</Text>
                          <Text style={[styles.workoutStatValue, { color: colors.text }]}>
                            {new Date(workout.created_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </View>
                      </View>
                      {workout.notes && (
                        <Text style={[styles.workoutNotes, { color: colors.textSecondary }]}>{workout.notes}</Text>
                      )}
                    </View>
                  ))}

                  <Text style={[styles.modalSectionTitle, { color: colors.text }]}>
                    Goals ({getGoalsForDate(selectedDate).length})
                  </Text>
                  {getGoalsForDate(selectedDate).length > 0 ? (
                    getGoalsForDate(selectedDate).map((goal) => (
                      <View key={goal.id} style={[styles.goalCard, { backgroundColor: colors.surface }]}>
                        <View style={styles.goalContent}>
                          <Text style={styles.goalEmoji}>🎯</Text>
                          <View style={styles.goalInfo}>
                            <Text style={[styles.goalTitle, { color: colors.primary }, goal.is_completed && styles.goalCompleted]}>
                              {goal.goal_type}
                            </Text>
                            {goal.is_completed && (
                              <Text style={[styles.goalStatus, { color: '#10B981' }]}>✓ Completed</Text>
                            )}
                          </View>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No goals for this date</Text>
                  )}

                  {isDateInCycle(selectedDate).isInCycle && (
                    <>
                      <Text style={[styles.modalSectionTitle, { color: colors.text }]}>
                        Training Cycles ({isDateInCycle(selectedDate).cycleCount || 0})
                      </Text>
                      {isDateInCycle(selectedDate).allCycles?.map((cycle) => (
                        <View key={cycle.id} style={[styles.cycleCard, { backgroundColor: colors.surface }]}>
                          <Text style={[styles.cycleName, { color: colors.primary }]}>
                            {cycle.name}
                          </Text>
                          <Text style={[styles.cycleType, { color: colors.textSecondary }]}>
                            {cycle.cycle_type.replace(/_/g, ' ').toUpperCase()}
                          </Text>
                          <Text style={[styles.cycleDates, { color: colors.textTertiary }]}>
                            {new Date(cycle.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(cycle.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Text>
                        </View>
                      ))}
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
  workoutType: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  filterScrollView: {
    flexGrow: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    minWidth: 100,
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
  legendScrollView: {
    flexGrow: 0,
  },
  legend: {
    flexDirection: 'row',
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
    justifyContent: 'center',
  },
  calendarContainer: {
    paddingVertical: 20,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  monthNavButton: {
    padding: 8,
    borderRadius: 8,
  },
  monthYearTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  dayHeadersContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 4,
  },
  dayHeader: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
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
    maxHeight: '70%',
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
  workoutCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutActions: {
    flexDirection: 'row',
    gap: 8,
  },
  workoutActionButton: {
    padding: 8,
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  workoutStat: {
    flex: 1,
    alignItems: 'center',
  },
  workoutStatLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  workoutStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  workoutNotes: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
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
  multipleCyclesIndicator: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: '#2A7DE1',
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  multipleCyclesText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFF',
  },
  goalIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  goalIndicatorText: {
    fontSize: 10,
  },
  strengthTestIndicator: {
    position: 'absolute',
    bottom: 2,
    left: 2,
  },
  strengthTestIndicatorText: {
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
  scheduledIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  scheduledIndicatorText: {
    fontSize: 8,
  },
  scheduledCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
  },
  scheduledHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduledTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  scheduledTime: {
    fontSize: 14,
    color: '#999',
  },
  scheduledDescription: {
    fontSize: 14,
    color: '#CCC',
  },
  strengthTestCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  strengthTestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  strengthTestType: {
    fontSize: 14,
    fontWeight: '600',
  },
  strengthTestResult: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  strengthTestNotes: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  strengthTestTime: {
    fontSize: 12,
  },
  cycleType: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  cycleDates: {
    fontSize: 11,
    marginTop: 2,
  },
  adBannerContainer: {
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adBannerPlaceholder: {
    width: 320,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  adBannerText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  adBannerSubtext: {
    fontSize: 10,
  },
});
