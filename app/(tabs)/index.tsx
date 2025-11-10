// This is the home screen for Arm Wrestling Pro.

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  useColorScheme, // Add this import
  Image,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase, Workout, Cycle } from '@/lib/supabase';
import { AdBanner } from '@/components/AdBanner';
import { Calendar, TrendingUp, Target, Clock, Minus } from 'lucide-react-native';

export default function Home() {
  const { profile, isPremium } = useAuth();
  const { colors } = useTheme();
  const colorScheme = useColorScheme(); // Add this line
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [completedGoals, setCompletedGoals] = useState<any[]>([]);
  const [activeGoals, setActiveGoals] = useState<any[]>([]); // Add this line
  const [scheduledTrainings, setScheduledTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    thisWeek: 0,
    totalMinutes: 0,
    avgIntensity: 0,
    viewAll: {
      fontSize: 14,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
  });

  // Add this useEffect to log theme changes (optional, for debugging)
  useEffect(() => {
    console.log('Current theme:', colorScheme);
  }, [colorScheme]);

  const fetchWorkouts = async () => {
    if (!profile) return;

    try {
      const [recentWorkouts, allWorkouts, cyclesData, completedGoalsData, activeGoalsData, scheduledTrainingsData] = await Promise.all([
        supabase
          .from('workouts')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(10), // Changed from 5 to 10
        supabase
          .from('workouts')
          .select('*')
          .eq('user_id', profile.id),
        supabase
          .from('cycles')
          .select('*')
          .eq('user_id', profile.id)
          .order('is_active', { ascending: false })
          .order('start_date', { ascending: false })
          .limit(3),
        supabase
          .from('goals')
          .select('*')
          .eq('user_id', profile.id)
          .eq('is_completed', true)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('goals')
          .select('*')
          .eq('user_id', profile.id)
          .eq('is_completed', false)
          .order('deadline', { ascending: true })
          .limit(5), // Add this query for active goals
        supabase
          .from('scheduled_trainings')
          .select('*')
          .eq('user_id', profile.id)
          .eq('completed', false)
          .gte('scheduled_date', new Date().toISOString().split('T')[0])
          .order('scheduled_date', { ascending: true })
          .order('scheduled_time', { ascending: true })
          .limit(5),
      ]);

      console.log('Cycles fetched:', cyclesData); // Add this debug log
      console.log('Scheduled trainings fetched:', scheduledTrainingsData);
      console.log('Active goals fetched:', activeGoalsData);

      if (recentWorkouts.data) {
        setWorkouts(recentWorkouts.data);
      }

      if (allWorkouts.data) {
        calculateStats(allWorkouts.data);
      }

      if (cyclesData.data) {
        setCycles(cyclesData.data);
        console.log('Cycles set:', cyclesData.data); // Add this debug log
      }

      if (completedGoalsData.data) {
        setCompletedGoals(completedGoalsData.data);
      }

      if (activeGoalsData.data) {
        setActiveGoals(activeGoalsData.data);
        console.log('Active goals set:', activeGoalsData.data);
      }

      if (scheduledTrainingsData.data) {
        setScheduledTrainings(scheduledTrainingsData.data);
        console.log('Scheduled trainings set:', scheduledTrainingsData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const calculateStats = (workoutData: Workout[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const thisWeekWorkouts = workoutData.filter(
      (w) => new Date(w.created_at) > weekAgo
    );

    const totalMinutes = workoutData.reduce(
      (sum, w) => sum + w.duration_minutes,
      0
    );

    const avgIntensity =
      workoutData.length > 0
        ? workoutData.reduce((sum, w) => sum + w.intensity, 0) / workoutData.length
        : 0;

    setStats({
      totalWorkouts: workoutData.length,
      thisWeek: thisWeekWorkouts.length,
      totalMinutes,
      avgIntensity: Math.round(avgIntensity * 10) / 10,
      viewAll: {
        fontSize: 14,
        fontWeight: '600',
        textDecorationLine: 'underline',
      },
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWorkouts();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchWorkouts().finally(() => setLoading(false));
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      if (profile) {
        fetchWorkouts();
      }
    }, [profile])
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCycleDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCycleProgress = (cycle: Cycle) => {
    const now = new Date();
    const start = new Date(cycle.start_date);
    const end = new Date(cycle.end_date);
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  const getProgressPercentage = (goal: any) => {
    return Math.min((goal.current_value / goal.target_value) * 100, 100);
  };

  const handleIncrementGoal = async (goal: any) => {
    const newValue = goal.current_value + 1;
    const isCompleted = newValue >= goal.target_value;

    await supabase
      .from('goals')
      .update({
        current_value: newValue,
        is_completed: isCompleted,
      })
      .eq('id', goal.id);

    // Refresh data to update the UI
    fetchWorkouts();
  };

  const handleDecrementGoal = async (goal: any) => {
    const newValue = Math.max(goal.current_value - 1, 0);
    const isCompleted = newValue >= goal.target_value;

    await supabase
      .from('goals')
      .update({
        current_value: newValue,
        is_completed: isCompleted,
      })
      .eq('id', goal.id);

    fetchWorkouts();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoPlaceholder}>
            {profile?.avatar_url ? (
              <Image 
                source={{ uri: `${profile.avatar_url}?t=${Date.now()}` }} 
                style={styles.avatarImage}
                key={`home-avatar-${profile.avatar_url}`}
                onError={(e) => {
                  console.log('Home avatar load error:', e.nativeEvent.error);
                }}
              />
            ) : (
              <Text style={styles.logoText}>💪</Text>
            )}
          </View>
          <View>
            <Text style={[styles.greeting, { color: colors.textTertiary }]}>Welcome back,</Text>
            <Text style={[styles.name, { color: colors.text }]}>{profile?.full_name || 'Athlete'}</Text>
          </View>
        </View>
        {isPremium && (
          <View style={[styles.premiumBadge, { backgroundColor: colors.premium }]}>
            <Text style={styles.premiumText}>PRO</Text>
          </View>
        )}
      </View>

      <AdBanner />

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Target size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalWorkouts}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Total Workouts</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Calendar size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.thisWeek}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>This Week</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Clock size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalMinutes}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Total Minutes</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <TrendingUp size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.avgIntensity}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Avg Intensity</Text>
        </View>
      </View>

      {/* AdMob Banner Placeholder - Medium Rectangle */}
      {!isPremium && (
        <View style={[styles.adBannerContainer, { backgroundColor: colors.surface }]}>
          <View style={[styles.adBannerPlaceholder, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.adBannerText, { color: colors.textSecondary }]}>
              📱 Ad Space
            </Text>
            <Text style={[styles.adBannerSubtext, { color: colors.textTertiary }]}>
              300x250
            </Text>
          </View>
        </View>
      )}

      {/* Active Goals Section */}
      {activeGoals.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Goals</Text>
            <TouchableOpacity onPress={() => router.push('/progress')}>
              <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          {activeGoals.map((goal) => (
            <View
              key={goal.id}
              style={[styles.goalCard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.goalHeader}>
                <View style={styles.goalInfo}>
                  <Target size={20} color={colors.primary} />
                  <Text style={[styles.goalType, { color: colors.text }]}>
                    {goal.goal_type}
                  </Text>
                </View>
                {goal.deadline && (
                  <Text style={[styles.goalDeadline, { color: colors.textSecondary }]}>
                    Due: {new Date(goal.deadline).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                )}
              </View>
              <View style={styles.goalProgressRow}>
                <Text style={[styles.goalProgress, { color: colors.textSecondary }]}>
                  {goal.current_value} / {goal.target_value}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {goal.current_value > 0 && (
                    <TouchableOpacity
                      style={[styles.decrementButton, { backgroundColor: '#999', marginLeft: 4 }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDecrementGoal(goal);
                      }}
                    >
                      <Minus size={16} color="#FFF" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.incrementButton, { backgroundColor: colors.primary }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleIncrementGoal(goal);
                    }}
                  >
                    <Text style={styles.incrementText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[styles.progressBarContainer, { backgroundColor: colors.background }]}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${getProgressPercentage(goal)}%`, backgroundColor: colors.secondary }
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.secondary }]}>
                {Math.round(getProgressPercentage(goal))}% complete
              </Text>
            </View>
          ))}
        </View>
      )}

      {scheduledTrainings.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Trainings</Text>
          {scheduledTrainings.map((training) => (
            <TouchableOpacity
              key={training.id}
              style={[styles.trainingCard, { backgroundColor: colors.surface }]}
              onPress={() => {
                router.push('/(tabs)/training');
                setTimeout(() => router.push('/(tabs)/training/schedule'), 100);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.trainingHeader}>
                <Text style={[styles.trainingTitle, { color: colors.text }]}>
                  {training.title}
                </Text>
                <Text style={[styles.trainingDate, { color: colors.primary }]}>
                  {new Date(training.scheduled_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.trainingDetails}>
                <Text style={[styles.trainingTime, { color: colors.textSecondary }]}>
                  ⏰ {training.scheduled_time.slice(0, 5)}
                </Text>
                {training.notification_enabled && (
                  <Text style={[styles.trainingNotif, { color: colors.secondary }]}>
                    🔔 {training.notification_minutes_before}m before
                  </Text>
                )}
              </View>
              {training.description && (
                <Text style={[styles.trainingDescription, { color: colors.textTertiary }]} numberOfLines={2}>
                  {training.description}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {cycles.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Training Cycles</Text>
          {cycles.map((cycle) => (
            <TouchableOpacity
              key={cycle.id}
              style={[styles.cycleCard, { backgroundColor: colors.surface, borderColor: cycle.is_active ? colors.secondary : 'transparent' }]}
              onPress={() => router.push({
                pathname: '/(tabs)/training/cycle-details',
                params: { cycleId: cycle.id }
              })}
              activeOpacity={0.7}
            >
              <View style={styles.cycleHeader}>
                <Text style={[styles.cycleName, { color: colors.text }]}>{cycle.name}</Text>
              </View>
              <Text style={[styles.cycleType, { color: colors.secondary }]}>
                {cycle.cycle_type.replace(/_/g, ' ').toUpperCase()}
              </Text>
              <Text style={[styles.cycleDates, { color: colors.textTertiary }]}>
                {formatCycleDate(cycle.start_date)} - {formatCycleDate(cycle.end_date)}
              </Text>
              {cycle.description && (
                <Text style={[styles.cycleDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                  {cycle.description}
                </Text>
              )}
              <View style={[styles.progressBarContainer, { backgroundColor: colors.background }]}>
                <View style={[styles.progressBar, { width: `${getCycleProgress(cycle)}%`, backgroundColor: colors.secondary }]} />
              </View>
              <Text style={[styles.progressText, { color: colors.secondary }]}>
                {Math.round(getCycleProgress(cycle))}% complete
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recently Completed</Text>
          <TouchableOpacity onPress={() => router.push('/progress')}>
            <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>
        {completedGoals.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No completed goals yet
            </Text>
          </View>
        ) : (
          completedGoals.map((goal) => (
            <View
              key={goal.id}
              style={[styles.completedGoalCard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.completedGoalHeader}>
                <Text style={[styles.completedGoalEmoji]}>🎯</Text>
                <Text style={[styles.completedGoalType, { color: colors.primary }]}>
                  {goal.goal_type}
                </Text>
              </View>
              <Text style={[styles.completedGoalText, { color: colors.success }]}>
                ✓ Completed
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Workouts</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/training')}>
            <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>

        {workouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No workouts yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Start tracking your arm wrestling training!
            </Text>
          </View>
        ) : (
          workouts.map((workout) => (
            <View key={workout.id} style={[styles.workoutCard, { backgroundColor: colors.surface }]}>
              <View style={styles.workoutHeader}>
                <Text style={[styles.workoutType, { color: colors.primary }]}>
                  {workout.workout_type.replace(/_/g, ' ').toUpperCase()}
                </Text>
                <Text style={[styles.workoutDate, { color: colors.textTertiary }]}>{formatDate(workout.created_at)}</Text>
              </View>
              <View style={styles.workoutDetails}>
                <Text style={[styles.workoutDetail, { color: colors.textSecondary }]}>
                  {workout.duration_minutes} min
                </Text>
                <Text style={[styles.workoutDivider, { color: colors.border }]}>•</Text>
                <Text style={[styles.workoutDetail, { color: colors.textSecondary }]}>
                  Intensity: {workout.intensity}/10
                </Text>
              </View>
              {workout.notes && (
                <Text style={[styles.workoutNotes, { color: colors.textTertiary }]} numberOfLines={2}>
                  {workout.notes}
                </Text>
              )}
            </View>
          ))
        )}
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E63946',
  },
  logoText: {
    fontSize: 30,
  },
  greeting: {
    fontSize: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  premiumBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  premiumText: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 12,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  workoutCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutType: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  workoutDate: {
    fontSize: 12,
  },
  workoutDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutDetail: {
    fontSize: 14,
  },
  workoutDivider: {
    fontSize: 14,
    marginHorizontal: 8,
  },
  workoutNotes: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: 20,
  },
  cycleCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
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
    flex: 1,
  },
  activeBadge: {
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
    fontWeight: '600',
    marginBottom: 4,
  },
  cycleDates: {
    fontSize: 12,
    marginBottom: 8,
  },
  cycleDescription: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  goalCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  goalDeadline: {
    fontSize: 12,
    color: '#999',
  },
  goalProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalProgress: {
    fontSize: 14,
    color: '#999',
  },
  incrementButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E63946',
    justifyContent: 'center',
    alignItems: 'center',
  },
  decrementButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  incrementText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  completedGoalCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  completedGoalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  completedGoalEmoji: {
    fontSize: 20,
  },
  completedGoalType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  completedGoalText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  trainingCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2A7DE1',
  },
  trainingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trainingTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  trainingDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  trainingDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  trainingTime: {
    fontSize: 14,
  },
  trainingNotif: {
    fontSize: 14,
  },
  trainingDescription: {
    fontSize: 14,
  },
  adBannerContainer: {
    marginHorizontal: 12,
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adBannerPlaceholder: {
    width: 300,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  adBannerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  adBannerSubtext: {
    fontSize: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
});
