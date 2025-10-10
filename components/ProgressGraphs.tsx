import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Workout, StrengthTest } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PaywallModal } from './PaywallModal';
import { useState } from 'react';
import { Lock } from 'lucide-react-native';

const { width } = Dimensions.get('window');

type ProgressGraphsProps = {
  workouts: Workout[];
  strengthTests: StrengthTest[];
  cycleId?: string;
};

export function ProgressGraphs({ workouts, strengthTests, cycleId }: ProgressGraphsProps) {
  const filteredWorkouts = cycleId
    ? workouts.filter((w) => w.cycle_id === cycleId)
    : workouts;
  const { isPremium } = useAuth();
  const [showPaywall, setShowPaywall] = useState(false);

  const getLast7DaysWorkouts = () => {
    const last7Days = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayWorkouts = filteredWorkouts.filter(
        (w) => new Date(w.created_at).toDateString() === date.toDateString()
      );
      last7Days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count: dayWorkouts.length,
      });
    }

    return last7Days;
  };

  const getWorkoutTypeDistribution = () => {
    const distribution: Record<string, number> = {};
    filteredWorkouts.forEach((w) => {
      distribution[w.workout_type] = (distribution[w.workout_type] || 0) + 1;
    });
    return distribution;
  };

  const weeklyData = getLast7DaysWorkouts();
  const maxWorkouts = Math.max(...weeklyData.map((d) => d.count), 1);

  return (
    <View style={styles.container}>
      <View style={styles.graphCard}>
        <Text style={styles.graphTitle}>Weekly Activity (Free)</Text>
        <Text style={styles.graphSubtitle}>Workouts per day</Text>

        <View style={styles.barChart}>
          {weeklyData.map((day, index) => {
            const barHeight = (day.count / maxWorkouts) * 180;
            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View style={[styles.bar, { height: Math.max(barHeight, 4) }]}>
                    {day.count > 0 && <Text style={styles.barLabel}>{day.count}</Text>}
                  </View>
                </View>
                <Text style={styles.dayLabel}>{day.day}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        style={styles.graphCard}
        onPress={() => !isPremium && setShowPaywall(true)}
        activeOpacity={isPremium ? 1 : 0.7}
      >
        {!isPremium && (
          <View style={styles.lockOverlay}>
            <Lock size={40} color="#FFD700" />
            <Text style={styles.lockText}>Premium Feature</Text>
            <Text style={styles.lockSubtext}>Unlock detailed analytics</Text>
          </View>
        )}

        <Text style={styles.graphTitle}>Workout Type Distribution</Text>
        <Text style={styles.graphSubtitle}>Types of training</Text>

        {isPremium ? (
          <View style={styles.pieChart}>
            {Object.entries(getWorkoutTypeDistribution()).map(([type, count], index) => {
              const total = workouts.length;
              const percentage = ((count / total) * 100).toFixed(0);
              const colors = ['#E63946', '#2A7DE1', '#FFD700', '#4CAF50', '#FF6B6B'];

              return (
                <View key={type} style={styles.pieItem}>
                  <View
                    style={[
                      styles.pieColor,
                      { backgroundColor: colors[index % colors.length] },
                    ]}
                  />
                  <Text style={styles.pieLabel}>
                    {type.replace(/_/g, ' ')}: {percentage}%
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.blurredChart}>
            <Text style={styles.blurredText}>Premium analytics locked</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.graphCard}
        onPress={() => !isPremium && setShowPaywall(true)}
        activeOpacity={isPremium ? 1 : 0.7}
      >
        {!isPremium && (
          <View style={styles.lockOverlay}>
            <Lock size={40} color="#FFD700" />
            <Text style={styles.lockText}>Premium Feature</Text>
          </View>
        )}

        <Text style={styles.graphTitle}>Intensity Trend</Text>
        <Text style={styles.graphSubtitle}>Last 10 workouts</Text>

        {isPremium ? (
          <View style={styles.intensityList}>
            {filteredWorkouts.slice(0, 10).map((workout, index) => (
              <View key={workout.id} style={styles.intensityItem}>
                <Text style={styles.intensityIndex}>#{index + 1}</Text>
                <View style={styles.intensityBar}>
                  <View
                    style={[
                      styles.intensityFill,
                      { width: `${(workout.intensity / 10) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.intensityValue}>{workout.intensity}/10</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.blurredChart}>
            <Text style={styles.blurredText}>Premium analytics locked</Text>
          </View>
        )}
      </TouchableOpacity>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgrade={() => setShowPaywall(false)}
        feature="Advanced analytics and progress tracking"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  graphCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    position: 'relative',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  lockText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 12,
  },
  lockSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  graphSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
  },
  barChart: {
    flexDirection: 'row',
    height: 200,
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    width: '80%',
    height: 200,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    backgroundColor: '#E63946',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  dayLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 8,
  },
  pieChart: {
    gap: 12,
  },
  pieItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pieColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  pieLabel: {
    fontSize: 14,
    color: '#CCC',
  },
  intensityList: {
    gap: 12,
  },
  intensityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  intensityIndex: {
    fontSize: 12,
    color: '#999',
    width: 30,
  },
  intensityBar: {
    flex: 1,
    height: 24,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  intensityFill: {
    height: '100%',
    backgroundColor: '#E63946',
  },
  intensityValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
    width: 40,
    textAlign: 'right',
  },
  blurredChart: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
  },
  blurredText: {
    fontSize: 14,
    color: '#666',
  },
});
