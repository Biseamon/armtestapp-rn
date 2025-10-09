import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Workout, Cycle } from '@/lib/supabase';
import { AdBanner } from '@/components/AdBanner';
import { Calendar, TrendingUp, Target, Clock } from 'lucide-react-native';

export default function Home() {
  const { profile, isPremium } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    thisWeek: 0,
    totalMinutes: 0,
    avgIntensity: 0,
  });

  const fetchWorkouts = async () => {
    if (!profile) return;

    const [recentWorkouts, allWorkouts, cyclesData] = await Promise.all([
      supabase
        .from('workouts')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5),
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
    ]);

    if (recentWorkouts.data) {
      setWorkouts(recentWorkouts.data);
    }

    if (allWorkouts.data) {
      calculateStats(allWorkouts.data);
    }

    if (cyclesData.data) {
      setCycles(cyclesData.data);
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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E63946" />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{profile?.full_name || 'Athlete'}</Text>
        </View>
        {isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>PRO</Text>
          </View>
        )}
      </View>

      <AdBanner />

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Target size={24} color="#E63946" />
          <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
          <Text style={styles.statLabel}>Total Workouts</Text>
        </View>

        <View style={styles.statCard}>
          <Calendar size={24} color="#E63946" />
          <Text style={styles.statValue}>{stats.thisWeek}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>

        <View style={styles.statCard}>
          <Clock size={24} color="#E63946" />
          <Text style={styles.statValue}>{stats.totalMinutes}</Text>
          <Text style={styles.statLabel}>Total Minutes</Text>
        </View>

        <View style={styles.statCard}>
          <TrendingUp size={24} color="#E63946" />
          <Text style={styles.statValue}>{stats.avgIntensity}</Text>
          <Text style={styles.statLabel}>Avg Intensity</Text>
        </View>
      </View>

      {cycles.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Training Cycles</Text>
          {cycles.map((cycle) => (
            <View key={cycle.id} style={[styles.cycleCard, cycle.is_active && styles.cycleCardActive]}>
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
                {formatCycleDate(cycle.start_date)} - {formatCycleDate(cycle.end_date)}
              </Text>
              {cycle.description && (
                <Text style={styles.cycleDescription} numberOfLines={2}>
                  {cycle.description}
                </Text>
              )}
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${getCycleProgress(cycle)}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {Math.round(getCycleProgress(cycle))}% complete
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Workouts</Text>

        {workouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No workouts yet</Text>
            <Text style={styles.emptySubtext}>
              Start tracking your arm wrestling training!
            </Text>
          </View>
        ) : (
          workouts.map((workout) => (
            <View key={workout.id} style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutType}>
                  {workout.workout_type.replace(/_/g, ' ').toUpperCase()}
                </Text>
                <Text style={styles.workoutDate}>{formatDate(workout.created_at)}</Text>
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

      <View style={styles.bottomSpacing} />
    </ScrollView>
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
  },
  greeting: {
    fontSize: 16,
    color: '#999',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
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
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
    textAlign: 'center',
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
    marginBottom: 8,
  },
  workoutType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E63946',
  },
  workoutDate: {
    fontSize: 12,
    color: '#999',
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
  bottomSpacing: {
    height: 20,
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
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2A7DE1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#2A7DE1',
    marginTop: 4,
    fontWeight: '600',
  },
});
