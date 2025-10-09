import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Workout, StrengthTest } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PaywallModal } from './PaywallModal';
import { useState } from 'react';
import { Lock } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const GRAPH_WIDTH = width - 80;
const GRAPH_HEIGHT = 200;

type ProgressGraphsProps = {
  workouts: Workout[];
  strengthTests: StrengthTest[];
};

export function ProgressGraphs({ workouts, strengthTests }: ProgressGraphsProps) {
  const { isPremium } = useAuth();
  const [showPaywall, setShowPaywall] = useState(false);

  console.log('ProgressGraphs rendering with', workouts.length, 'workouts');

  const getLast7DaysWorkouts = () => {
    const last7Days = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayWorkouts = workouts.filter(
        (w) =>
          new Date(w.created_at).toDateString() === date.toDateString()
      );
      last7Days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count: dayWorkouts.length,
        totalMinutes: dayWorkouts.reduce((sum, w) => sum + w.duration_minutes, 0),
      });
    }

    return last7Days;
  };

  const getWorkoutTypeDistribution = () => {
    const distribution: Record<string, number> = {};
    workouts.forEach((w) => {
      distribution[w.workout_type] = (distribution[w.workout_type] || 0) + 1;
    });
    return distribution;
  };

  const getIntensityTrend = () => {
    return workouts
      .slice(0, 10)
      .reverse()
      .map((w, index) => ({
        index: index + 1,
        intensity: w.intensity,
      }));
  };

  const getStrengthProgress = () => {
    const byType: Record<string, StrengthTest[]> = {};
    strengthTests.forEach((test) => {
      if (!byType[test.test_type]) {
        byType[test.test_type] = [];
      }
      byType[test.test_type].push(test);
    });
    return byType;
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
            const barHeight = (day.count / maxWorkouts) * GRAPH_HEIGHT;
            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View style={[styles.bar, { height: barHeight || 4 }]}>
                    {day.count > 0 && (
                      <Text style={styles.barLabel}>{day.count}</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.dayLabel}>{day.day}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={[styles.graphCard, !isPremium && styles.lockedCard]}>
        {!isPremium && (
          <View style={styles.lockOverlay}>
            <Lock size={40} color="#FFD700" />
            <Text style={styles.lockText}>Premium Feature</Text>
            <Text style={styles.lockSubtext}>Upgrade to unlock detailed analytics</Text>
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
                    style={[styles.pieColor, { backgroundColor: colors[index % colors.length] }]}
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
            <View style={styles.pieItem}>
              <View style={[styles.pieColor, { backgroundColor: '#666' }]} />
              <Text style={styles.pieLabel}>Workout type data</Text>
            </View>
            <View style={styles.pieItem}>
              <View style={[styles.pieColor, { backgroundColor: '#555' }]} />
              <Text style={styles.pieLabel}>Distribution info</Text>
            </View>
          </View>
        )}
      </View>

      <View style={[styles.graphCard, !isPremium && styles.lockedCard]}>
        {!isPremium && (
          <View style={styles.lockOverlay}>
            <Lock size={40} color="#FFD700" />
            <Text style={styles.lockText}>Premium Feature</Text>
          </View>
        )}

        <Text style={styles.graphTitle}>Intensity Trend</Text>
        <Text style={styles.graphSubtitle}>Last 10 workouts</Text>

        {isPremium ? (
          <View style={styles.lineChart}>
            {getIntensityTrend().map((point, index, arr) => {
              const x = (index / (arr.length - 1 || 1)) * GRAPH_WIDTH;
              const y = GRAPH_HEIGHT - (point.intensity / 10) * GRAPH_HEIGHT;

              return (
                <View
                  key={index}
                  style={[
                    styles.dataPoint,
                    { left: x - 4, top: y - 4 },
                  ]}
                >
                  <View style={styles.point} />
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.blurredChart}>
            <Text style={styles.blurredText}>Intensity trend graph</Text>
          </View>
        )}
      </View>

      <View style={[styles.graphCard, !isPremium && styles.lockedCard]}>
        {!isPremium && (
          <View style={styles.lockOverlay}>
            <Lock size={40} color="#FFD700" />
            <Text style={styles.lockText}>Premium Feature</Text>
          </View>
        )}

        <Text style={styles.graphTitle}>Strength Progress</Text>
        <Text style={styles.graphSubtitle}>Track your improvements</Text>

        {isPremium ? (
          <View style={styles.strengthList}>
            {Object.entries(getStrengthProgress()).map(([type, tests]) => {
              const latest = tests[0];
              const previous = tests[1];
              const change = previous
                ? ((latest.result_value - previous.result_value) / previous.result_value) * 100
                : 0;

              return (
                <View key={type} style={styles.strengthItem}>
                  <Text style={styles.strengthType}>
                    {type.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                  <View style={styles.strengthValues}>
                    <Text style={styles.strengthValue}>{latest.result_value} lbs</Text>
                    {previous && (
                      <Text
                        style={[
                          styles.strengthChange,
                          change > 0 ? styles.positive : styles.negative,
                        ]}
                      >
                        {change > 0 ? '+' : ''}
                        {change.toFixed(1)}%
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.blurredChart}>
            <Text style={styles.blurredText}>Strength progress data</Text>
          </View>
        )}
      </View>

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
    position: 'relative' as const,
  },
  lockedCard: {
    opacity: 0.7,
  },
  lockOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 16,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
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
    flexDirection: 'row' as const,
    height: GRAPH_HEIGHT,
    alignItems: 'flex-end' as const,
    justifyContent: 'space-around' as const,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'flex-end' as const,
  },
  barWrapper: {
    width: '80%',
    height: GRAPH_HEIGHT,
    justifyContent: 'flex-end' as const,
    alignItems: 'center' as const,
  },
  bar: {
    width: '100%',
    backgroundColor: '#E63946',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 4,
    justifyContent: 'flex-start' as const,
    alignItems: 'center' as const,
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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
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
  lineChart: {
    height: GRAPH_HEIGHT,
    width: GRAPH_WIDTH,
    position: 'relative' as const,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
  },
  dataPoint: {
    position: 'absolute' as const,
    width: 8,
    height: 8,
  },
  point: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E63946',
  },
  strengthList: {
    gap: 12,
  },
  strengthItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  strengthType: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },
  strengthValues: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  strengthValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  strengthChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  positive: {
    color: '#4CAF50',
  },
  negative: {
    color: '#FF6B6B',
  },
  blurredChart: {
    height: 120,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
  },
  blurredText: {
    fontSize: 14,
    color: '#666',
  },
});
