import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ShareableProgressCardProps {
  totalWorkouts: number;
  totalHours: number;
  recentWorkouts: number;
  avgIntensity: number;
  userName?: string;
  latestPRs?: Array<{ type: string; value: string }>;
}

export function ShareableProgressCard({
  totalWorkouts,
  totalHours,
  recentWorkouts,
  avgIntensity,
  userName,
  latestPRs,
}: ShareableProgressCardProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d1b1b', '#1a1a1a']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>💪</Text>
          <Text style={styles.title}>My Arm Wrestling Progress</Text>
          {userName && <Text style={styles.userName}>{userName}</Text>}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalWorkouts}</Text>
            <Text style={styles.statLabel}>Total Workouts</Text>
          </View>
          
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalHours}h</Text>
            <Text style={styles.statLabel}>Training Time</Text>
          </View>
          
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{recentWorkouts}</Text>
            <Text style={styles.statLabel}>Last 30 Days</Text>
          </View>
          
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{avgIntensity.toFixed(1)}/10</Text>
            <Text style={styles.statLabel}>Avg Intensity</Text>
          </View>
        </View>

        {/* PRs Section */}
        {latestPRs && latestPRs.length > 0 && (
          <View style={styles.prsSection}>
            <Text style={styles.prTitle}>🏆 Latest PRs</Text>
            {latestPRs.slice(0, 3).map((pr, index) => (
              <View key={index} style={styles.prItem}>
                <Text style={styles.prType}>{pr.type}</Text>
                <Text style={styles.prValue}>{pr.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Track your journey</Text>
          <Text style={styles.appName}>ArmWrestling Pro</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 1080,
    height: 1920,
    backgroundColor: '#1a1a1a',
  },
  gradient: {
    flex: 1,
    padding: 60,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#E63946',
    textAlign: 'center',
    marginBottom: 10,
  },
  userName: {
    fontSize: 48,
    color: '#fff',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 30,
    justifyContent: 'center',
    marginVertical: 60,
  },
  statBox: {
    width: '45%',
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(230, 57, 70, 0.3)',
  },
  statValue: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#E63946',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 32,
    color: '#999',
    textAlign: 'center',
  },
  prsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 40,
    marginVertical: 40,
  },
  prTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 30,
    textAlign: 'center',
  },
  prItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  prType: {
    fontSize: 36,
    color: '#fff',
    textTransform: 'uppercase',
  },
  prValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#E63946',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 40,
    borderTopWidth: 2,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    fontSize: 36,
    color: '#999',
    marginBottom: 15,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#E63946',
  },
});
