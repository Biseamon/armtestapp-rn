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

  const getWorkoutsByType = (type: string) => {
    return filteredWorkouts.filter((w) => w.workout_type === type);
  };

  const getAverageIntensityByType = (type: string) => {
    const typeWorkouts = getWorkoutsByType(type);
    if (typeWorkouts.length === 0) return '0';
    const sum = typeWorkouts.reduce((acc, w) => acc + w.intensity, 0);
    return (sum / typeWorkouts.length).toFixed(1);
  };

  const getTotalDurationByType = (type: string) => {
    const typeWorkouts = getWorkoutsByType(type);
    return typeWorkouts.reduce((acc, w) => acc + w.duration_minutes, 0);
  };

  const getRecentTrend = (type: string) => {
    const typeWorkouts = getWorkoutsByType(type)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    if (typeWorkouts.length < 2) return [];
    return typeWorkouts.reverse();
  };

  return (
    <View style={styles.container}>
      <View style={styles.graphCard}>
        <Text style={styles.graphTitle}>Weekly Activity</Text>
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

      <View style={styles.graphCard}>
        <Text style={styles.graphTitle}>Training Volume by Type</Text>
        <Text style={styles.graphSubtitle}>Total minutes per category</Text>

        <View style={styles.volumeList}>
          {[
            { type: 'strength', color: '#E63946' },
            { type: 'table_practice', color: '#2A7DE1' },
            { type: 'technique', color: '#FFD700' },
            { type: 'endurance', color: '#4CAF50' },
            { type: 'sparring', color: '#FF6B6B' },
          ].map(({ type, color }) => {
            const duration = getTotalDurationByType(type);
            const total = ['strength', 'table_practice', 'technique', 'endurance', 'sparring']
              .reduce((sum, t) => sum + getTotalDurationByType(t), 0);
            const percentage = total > 0 ? (duration / total) * 100 : 0;

            return (
              <View key={type} style={styles.volumeItem}>
                <View style={styles.volumeHeader}>
                  <View style={[styles.legendColor, { backgroundColor: color }]} />
                  <Text style={styles.volumeLabel}>
                    {type.replace(/_/g, ' ')}
                  </Text>
                  <Text style={styles.volumeValue}>{duration}m</Text>
                </View>
                <View style={styles.volumeBarContainer}>
                  <View style={[styles.volumeBar, { width: `${percentage}%`, backgroundColor: color }]} />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.graphCard}>
        <Text style={styles.graphTitle}>Average Intensity by Type</Text>
        <Text style={styles.graphSubtitle}>How hard you train</Text>

        <View style={styles.intensityTypeList}>
          {['strength', 'table_practice', 'technique', 'endurance', 'sparring'].map((type) => {
            const avgIntensity = parseFloat(getAverageIntensityByType(type));
            const count = getWorkoutsByType(type).length;

            return (
              <View key={type} style={styles.intensityTypeItem}>
                <View style={styles.intensityTypeHeader}>
                  <Text style={styles.intensityTypeLabel}>
                    {type.replace(/_/g, ' ')}
                  </Text>
                  <Text style={styles.intensityTypeCount}>({count})</Text>
                </View>
                <View style={styles.intensityTypeBar}>
                  <View
                    style={[
                      styles.intensityTypeFill,
                      { width: `${(avgIntensity / 10) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.intensityTypeValue}>
                  {avgIntensity > 0 ? `${avgIntensity}/10` : 'N/A'}
                </Text>
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
          </View>
        )}

        <Text style={styles.graphTitle}>Strength Training Progress</Text>
        <Text style={styles.graphSubtitle}>Intensity over time</Text>

        {isPremium ? (
          getRecentTrend('strength').length > 0 ? (
            <View style={styles.trendList}>
              {getRecentTrend('strength').map((workout, index) => (
                <View key={workout.id} style={styles.trendItem}>
                  <Text style={styles.trendIndex}>#{index + 1}</Text>
                  <View style={styles.trendInfo}>
                    <Text style={styles.trendDate}>
                      {new Date(workout.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                    <View style={styles.trendProgressBar}>
                      <View style={[styles.trendProgressFill, { width: `${(workout.intensity / 10) * 100}%`, backgroundColor: '#E63946' }]} />
                    </View>
                    <Text style={styles.trendValue}>Intensity: {workout.intensity}/10</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noDataText}>No strength workouts yet</Text>
          )
        ) : (
          <View style={styles.blurredChart}>
            <Text style={styles.blurredText}>Premium analytics locked</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.graphCard}>
        <Text style={styles.graphTitle}>Technique Training Progress</Text>
        <Text style={styles.graphSubtitle}>Duration over time</Text>

        {getRecentTrend('technique').length > 0 ? (
          <View style={styles.trendList}>
            {getRecentTrend('technique').map((workout, index) => (
              <View key={workout.id} style={styles.trendItem}>
                <Text style={styles.trendIndex}>#{index + 1}</Text>
                <View style={styles.trendInfo}>
                  <Text style={styles.trendDate}>
                    {new Date(workout.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <View style={styles.trendProgressBar}>
                    <View style={[styles.trendProgressFill, { width: `${Math.min((workout.duration_minutes / 60) * 100, 100)}%`, backgroundColor: '#FFD700' }]} />
                  </View>
                  <Text style={styles.trendValue}>{workout.duration_minutes}min</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noDataText}>No technique workouts yet</Text>
        )}
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
          </View>
        )}

        <Text style={styles.graphTitle}>Endurance Training Progress</Text>
        <Text style={styles.graphSubtitle}>Duration over time</Text>

        {isPremium ? (
          getRecentTrend('endurance').length > 0 ? (
            <View style={styles.trendList}>
              {getRecentTrend('endurance').map((workout, index) => (
                <View key={workout.id} style={styles.trendItem}>
                  <Text style={styles.trendIndex}>#{index + 1}</Text>
                  <View style={styles.trendInfo}>
                    <Text style={styles.trendDate}>
                      {new Date(workout.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                    <View style={styles.trendProgressBar}>
                      <View style={[styles.trendProgressFill, { width: `${Math.min((workout.duration_minutes / 60) * 100, 100)}%`, backgroundColor: '#4CAF50' }]} />
                    </View>
                    <Text style={styles.trendValue}>{workout.duration_minutes}min</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noDataText}>No endurance workouts yet</Text>
          )
        ) : (
          <View style={styles.blurredChart}>
            <Text style={styles.blurredText}>Premium analytics locked</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.graphCard}>
        <Text style={styles.graphTitle}>Table Practice Progress</Text>
        <Text style={styles.graphSubtitle}>Intensity over time</Text>

        {getRecentTrend('table_practice').length > 0 ? (
          <View style={styles.trendList}>
            {getRecentTrend('table_practice').map((workout, index) => (
              <View key={workout.id} style={styles.trendItem}>
                <Text style={styles.trendIndex}>#{index + 1}</Text>
                <View style={styles.trendInfo}>
                  <Text style={styles.trendDate}>
                    {new Date(workout.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <View style={styles.trendProgressBar}>
                    <View style={[styles.trendProgressFill, { width: `${(workout.intensity / 10) * 100}%`, backgroundColor: '#2A7DE1' }]} />
                  </View>
                  <Text style={styles.trendValue}>Intensity: {workout.intensity}/10</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noDataText}>No table practice workouts yet</Text>
        )}
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
          </View>
        )}

        <Text style={styles.graphTitle}>Overall Intensity Trend</Text>
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
  volumeList: {
    gap: 16,
  },
  volumeItem: {
    gap: 8,
  },
  volumeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  volumeLabel: {
    fontSize: 14,
    color: '#CCC',
    textTransform: 'capitalize',
    flex: 1,
  },
  volumeBarContainer: {
    height: 24,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  volumeBar: {
    height: '100%',
  },
  volumeValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  intensityTypeList: {
    gap: 16,
  },
  intensityTypeItem: {
    gap: 6,
  },
  intensityTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  intensityTypeLabel: {
    fontSize: 14,
    color: '#CCC',
    textTransform: 'capitalize',
  },
  intensityTypeCount: {
    fontSize: 12,
    color: '#666',
  },
  intensityTypeBar: {
    height: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  intensityTypeFill: {
    height: '100%',
    backgroundColor: '#E63946',
  },
  intensityTypeValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  trendList: {
    gap: 12,
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 8,
  },
  trendIndex: {
    fontSize: 12,
    color: '#999',
    width: 30,
  },
  trendInfo: {
    flex: 1,
    gap: 8,
  },
  trendDate: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
  trendProgressBar: {
    height: 20,
    backgroundColor: '#0A0A0A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  trendProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  trendValue: {
    fontSize: 12,
    color: '#CCC',
    fontWeight: '600',
  },
  trendStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendStat: {
    fontSize: 12,
    color: '#CCC',
  },
  trendDivider: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  legendContainer: {
    gap: 8,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendLabel: {
    fontSize: 14,
    color: '#CCC',
    textTransform: 'capitalize',
  },
});
