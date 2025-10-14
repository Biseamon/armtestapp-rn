import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { X, TrendingUp, TrendingDown, Minus, Award } from 'lucide-react-native';

type ProgressReportProps = {
  visible: boolean;
  onClose: () => void;
  strengthTests: any[];
  workouts: any[];
  goals: any[];
  weightUnit: string;
};

export function ProgressReport({
  visible,
  onClose,
  strengthTests,
  workouts,
  goals,
  weightUnit,
}: ProgressReportProps) {
  const calculateStrengthTrend = () => {
    if (strengthTests.length < 2) return { trend: 'insufficient', change: 0 };

    const sorted = [...strengthTests].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const oldest = Number(sorted[0].result_value) || 0;
    const newest = Number(sorted[sorted.length - 1].result_value) || 0;
    const change = ((newest - oldest) / oldest) * 100;

    if (change > 5) return { trend: 'up', change };
    if (change < -5) return { trend: 'down', change };
    return { trend: 'stable', change };
  };

  const calculateWorkoutConsistency = () => {
    if (workouts.length === 0) return 0;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentWorkouts = workouts.filter(
      (w) => new Date(w.created_at) >= thirtyDaysAgo
    );

    return ((recentWorkouts.length / 30) * 100).toFixed(0);
  };

  const calculateGoalCompletion = () => {
    if (goals.length === 0) return 0;
    const completed = goals.filter((g) => g.is_completed).length;
    return ((completed / goals.length) * 100).toFixed(0);
  };

  const getAverageWorkoutDuration = () => {
    if (workouts.length === 0) return 0;
    const total = workouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
    return (total / workouts.length).toFixed(0);
  };

  const strengthTrend = calculateStrengthTrend();
  const consistency = calculateWorkoutConsistency();
  const goalCompletion = calculateGoalCompletion();
  const avgDuration = getAverageWorkoutDuration();

  const getTrendIcon = () => {
    if (strengthTrend.trend === 'up') return <TrendingUp size={24} color="#10B981" />;
    if (strengthTrend.trend === 'down') return <TrendingDown size={24} color="#E63946" />;
    return <Minus size={24} color="#FFD700" />;
  };

  const getTrendText = () => {
    if (strengthTrend.trend === 'insufficient') return 'Need more data';
    if (strengthTrend.trend === 'up') return `+${strengthTrend.change.toFixed(1)}%`;
    if (strengthTrend.trend === 'down') return `${strengthTrend.change.toFixed(1)}%`;
    return 'Stable';
  };

  const getOverallRating = () => {
    const score = (
      (consistency >= 70 ? 25 : consistency >= 50 ? 15 : 5) +
      (goalCompletion >= 70 ? 25 : goalCompletion >= 50 ? 15 : 5) +
      (strengthTrend.trend === 'up' ? 25 : strengthTrend.trend === 'stable' ? 15 : 5) +
      (workouts.length >= 20 ? 25 : workouts.length >= 10 ? 15 : 5)
    );

    if (score >= 80) return { rating: 'Excellent', color: '#10B981', emoji: '🔥' };
    if (score >= 60) return { rating: 'Good', color: '#FFD700', emoji: '⭐' };
    if (score >= 40) return { rating: 'Fair', color: '#F59E0B', emoji: '💪' };
    return { rating: 'Needs Improvement', color: '#E63946', emoji: '📈' };
  };

  const overall = getOverallRating();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Progress Report</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#999" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={[styles.overallCard, { backgroundColor: overall.color + '22' }]}>
              <Text style={styles.overallEmoji}>{overall.emoji}</Text>
              <Text style={[styles.overallRating, { color: overall.color }]}>
                {overall.rating}
              </Text>
              <Text style={styles.overallSubtext}>Overall Performance</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Strength Progress</Text>
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.cardLeft}>
                    {getTrendIcon()}
                    <Text style={styles.cardLabel}>Trend</Text>
                  </View>
                  <Text style={styles.cardValue}>{getTrendText()}</Text>
                </View>
                <Text style={styles.cardSubtext}>
                  {strengthTests.length} strength tests recorded
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Workout Consistency</Text>
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Last 30 Days</Text>
                  <Text style={styles.cardValue}>{consistency}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${consistency}%`,
                        backgroundColor: Number(consistency) >= 70 ? '#10B981' : Number(consistency) >= 50 ? '#FFD700' : '#E63946'
                      }
                    ]}
                  />
                </View>
                <Text style={styles.cardSubtext}>
                  {workouts.length} total workouts
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Goal Achievement</Text>
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <Award size={24} color="#FFD700" />
                  <Text style={styles.cardValue}>{goalCompletion}%</Text>
                </View>
                <Text style={styles.cardSubtext}>
                  {goals.filter((g) => g.is_completed).length} of {goals.length} goals completed
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Workout Metrics</Text>
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Avg Duration</Text>
                  <Text style={styles.cardValue}>{avgDuration} min</Text>
                </View>
                <Text style={styles.cardSubtext}>
                  Per workout session
                </Text>
              </View>
            </View>

            <View style={styles.recommendations}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              {Number(consistency) < 50 && (
                <View style={styles.recommendCard}>
                  <Text style={styles.recommendText}>
                    💡 Try to train more consistently. Aim for at least 3-4 sessions per week.
                  </Text>
                </View>
              )}
              {strengthTrend.trend === 'down' && (
                <View style={styles.recommendCard}>
                  <Text style={styles.recommendText}>
                    💡 Your strength appears to be declining. Consider reviewing your training intensity.
                  </Text>
                </View>
              )}
              {Number(goalCompletion) < 50 && (
                <View style={styles.recommendCard}>
                  <Text style={styles.recommendText}>
                    💡 Set more achievable short-term goals to build momentum.
                  </Text>
                </View>
              )}
              {Number(consistency) >= 70 && strengthTrend.trend === 'up' && (
                <View style={styles.recommendCard}>
                  <Text style={styles.recommendText}>
                    🎉 Excellent work! Keep up the consistency and progressive overload.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    padding: 20,
  },
  overallCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  overallEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  overallRating: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  overallSubtext: {
    fontSize: 14,
    color: '#999',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardLabel: {
    fontSize: 16,
    color: '#CCC',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  cardSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  recommendations: {
    marginTop: 8,
    marginBottom: 20,
  },
  recommendCard: {
    backgroundColor: '#2A7DE144',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2A7DE1',
  },
  recommendText: {
    fontSize: 14,
    color: '#CCC',
    lineHeight: 20,
  },
});
