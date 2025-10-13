import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { StrengthTest, Workout } from '@/lib/supabase';
import { formatWeight, convertToLbs } from '@/lib/weightUtils';

interface Props {
  strengthTests: StrengthTest[];
  workouts: Workout[];
  weightUnit: 'lbs' | 'kg';
  isPremium?: boolean;
}

type TimeRange = 'week' | 'month' | 'year';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 60;

export function EnhancedProgressGraphs({ strengthTests, workouts, weightUnit, isPremium = false }: Props) {
  const [strengthTimeRange, setStrengthTimeRange] = useState<TimeRange>('month');
  const [workoutTimeRange, setWorkoutTimeRange] = useState<TimeRange>('month');
  const [enduranceTimeRange, setEnduranceTimeRange] = useState<TimeRange>('month');
  const [techniqueTimeRange, setTechniqueTimeRange] = useState<TimeRange>('month');

  const filterDataByTimeRange = <T extends { created_at: string }>(
    data: T[],
    range: TimeRange
  ): T[] => {
    const now = new Date();
    const cutoff = new Date();

    switch (range) {
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
    }

    return data.filter((item) => new Date(item.created_at) >= cutoff);
  };

  const strengthChartData = useMemo(() => {
    const filteredTests = filterDataByTimeRange(strengthTests, strengthTimeRange);

    if (filteredTests.length === 0) {
      return [];
    }

    return filteredTests
      .reverse()
      .map((test) => {
        const value = weightUnit === 'lbs' ? convertToLbs(test.result_kg) : test.result_kg;
        return {
          value: Math.round(value * 10) / 10,
          label: new Date(test.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          dataPointText: `${Math.round(value)}`,
        };
      });
  }, [strengthTests, strengthTimeRange, weightUnit]);

  const workoutChartData = useMemo(() => {
    const filteredWorkouts = filterDataByTimeRange(workouts, workoutTimeRange);

    if (filteredWorkouts.length === 0) {
      return [];
    }

    const workoutsByDate = filteredWorkouts.reduce((acc, workout) => {
      const date = workout.created_at.split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(workoutsByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        value: count,
        label: new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        dataPointText: `${count}`,
      }));
  }, [workouts, workoutTimeRange]);

  const enduranceChartData = useMemo(() => {
    const filteredWorkouts = filterDataByTimeRange(workouts, enduranceTimeRange);

    if (filteredWorkouts.length === 0) {
      return [];
    }

    return filteredWorkouts
      .reverse()
      .map((workout) => ({
        value: workout.duration_minutes || 0,
        label: new Date(workout.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        dataPointText: `${workout.duration_minutes || 0}m`,
      }));
  }, [workouts, enduranceTimeRange]);

  const techniqueChartData = useMemo(() => {
    const filteredTests = filterDataByTimeRange(strengthTests, techniqueTimeRange);

    if (filteredTests.length === 0) {
      return [];
    }

    return filteredTests
      .reverse()
      .map((test) => {
        const score = Math.round(test.result_kg * 10) / 10;
        return {
          value: score,
          label: new Date(test.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          dataPointText: `${score}`,
        };
      });
  }, [strengthTests, techniqueTimeRange]);

  const renderTimeRangeSelector = (
    currentRange: TimeRange,
    onSelect: (range: TimeRange) => void
  ) => (
    <View style={styles.timeRangeSelector}>
      {(['week', 'month', 'year'] as TimeRange[]).map((range) => (
        <TouchableOpacity
          key={range}
          style={[
            styles.timeRangeButton,
            currentRange === range && styles.timeRangeButtonActive,
          ]}
          onPress={() => onSelect(range)}
        >
          <Text
            style={[
              styles.timeRangeText,
              currentRange === range && styles.timeRangeTextActive,
            ]}
          >
            {range === 'week' ? '7D' : range === 'month' ? '1M' : '1Y'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (strengthChartData.length === 0 && workoutChartData.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No data available yet</Text>
        <Text style={styles.emptySubtext}>
          Start tracking your workouts and strength tests to see your progress
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {strengthChartData.length > 0 && (
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Strength Progress</Text>
            {renderTimeRangeSelector(strengthTimeRange, setStrengthTimeRange)}
          </View>
          <LineChart
            data={strengthChartData}
            width={CHART_WIDTH}
            height={220}
            spacing={Math.max(40, CHART_WIDTH / strengthChartData.length)}
            initialSpacing={20}
            endSpacing={20}
            color="#E63946"
            thickness={3}
            curved
            hideRules
            yAxisTextStyle={styles.yAxisText}
            xAxisLabelTextStyle={styles.xAxisText}
            showVerticalLines
            verticalLinesColor="rgba(255,255,255,0.1)"
            noOfSections={4}
            maxValue={Math.ceil(Math.max(...strengthChartData.map((d) => d.value)) * 1.1)}
            yAxisColor="#333"
            xAxisColor="#333"
            dataPointsColor="#E63946"
            dataPointsRadius={4}
            textShiftY={-8}
            textShiftX={-5}
            textFontSize={10}
            textColor="#FFF"
            showDataPointOnPress
            focusEnabled
            showStripOnFocus
            stripColor="rgba(230, 57, 70, 0.3)"
            stripWidth={2}
            stripHeight={220}
            isAnimated
            animationDuration={800}
            animateOnDataChange
          />
        </View>
      )}

      {workoutChartData.length > 0 && (
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Workout Frequency</Text>
            {renderTimeRangeSelector(workoutTimeRange, setWorkoutTimeRange)}
          </View>
          <LineChart
            data={workoutChartData}
            width={CHART_WIDTH}
            height={220}
            spacing={Math.max(40, CHART_WIDTH / workoutChartData.length)}
            initialSpacing={20}
            endSpacing={20}
            color="#2A7DE1"
            thickness={3}
            curved
            hideRules
            yAxisTextStyle={styles.yAxisText}
            xAxisLabelTextStyle={styles.xAxisText}
            showVerticalLines
            verticalLinesColor="rgba(255,255,255,0.1)"
            noOfSections={4}
            maxValue={Math.ceil(Math.max(...workoutChartData.map((d) => d.value)) * 1.1)}
            yAxisColor="#333"
            xAxisColor="#333"
            dataPointsColor="#2A7DE1"
            dataPointsRadius={4}
            textShiftY={-8}
            textShiftX={-5}
            textFontSize={10}
            textColor="#FFF"
            showDataPointOnPress
            focusEnabled
            showStripOnFocus
            stripColor="rgba(42, 125, 225, 0.3)"
            stripWidth={2}
            stripHeight={220}
            isAnimated
            animationDuration={800}
            animateOnDataChange
          />
        </View>
      )}

      {isPremium && enduranceChartData.length > 0 && (
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Endurance (Duration)</Text>
            {renderTimeRangeSelector(enduranceTimeRange, setEnduranceTimeRange)}
          </View>
          <LineChart
            data={enduranceChartData}
            width={CHART_WIDTH}
            height={220}
            spacing={Math.max(40, CHART_WIDTH / enduranceChartData.length)}
            initialSpacing={20}
            endSpacing={20}
            color="#10B981"
            thickness={3}
            curved
            hideRules
            yAxisTextStyle={styles.yAxisText}
            xAxisLabelTextStyle={styles.xAxisText}
            showVerticalLines
            verticalLinesColor="rgba(255,255,255,0.1)"
            noOfSections={4}
            maxValue={Math.ceil(Math.max(...enduranceChartData.map((d) => d.value)) * 1.1)}
            yAxisColor="#333"
            xAxisColor="#333"
            dataPointsColor="#10B981"
            dataPointsRadius={4}
            textShiftY={-8}
            textShiftX={-5}
            textFontSize={10}
            textColor="#FFF"
            showDataPointOnPress
            focusEnabled
            showStripOnFocus
            stripColor="rgba(16, 185, 129, 0.3)"
            stripWidth={2}
            stripHeight={220}
            isAnimated
            animationDuration={800}
            animateOnDataChange
          />
        </View>
      )}

      {isPremium && techniqueChartData.length > 0 && (
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Technique Score</Text>
            {renderTimeRangeSelector(techniqueTimeRange, setTechniqueTimeRange)}
          </View>
          <LineChart
            data={techniqueChartData}
            width={CHART_WIDTH}
            height={220}
            spacing={Math.max(40, CHART_WIDTH / techniqueChartData.length)}
            initialSpacing={20}
            endSpacing={20}
            color="#F59E0B"
            thickness={3}
            curved
            hideRules
            yAxisTextStyle={styles.yAxisText}
            xAxisLabelTextStyle={styles.xAxisText}
            showVerticalLines
            verticalLinesColor="rgba(255,255,255,0.1)"
            noOfSections={4}
            maxValue={Math.ceil(Math.max(...techniqueChartData.map((d) => d.value)) * 1.1)}
            yAxisColor="#333"
            xAxisColor="#333"
            dataPointsColor="#F59E0B"
            dataPointsRadius={4}
            textShiftY={-8}
            textShiftX={-5}
            textFontSize={10}
            textColor="#FFF"
            showDataPointOnPress
            focusEnabled
            showStripOnFocus
            stripColor="rgba(245, 158, 11, 0.3)"
            stripWidth={2}
            stripHeight={220}
            isAnimated
            animationDuration={800}
            animateOnDataChange
          />
        </View>
      )}

      {!isPremium && (
        <View style={styles.premiumLockContainer}>
          <Text style={styles.premiumLockTitle}>Unlock Premium Analytics</Text>
          <Text style={styles.premiumLockText}>
            Get access to Endurance and Technique tracking with premium membership
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  chartContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1A1A1A',
  },
  timeRangeButtonActive: {
    backgroundColor: '#E63946',
  },
  timeRangeText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  timeRangeTextActive: {
    color: '#FFF',
  },
  yAxisText: {
    color: '#999',
    fontSize: 10,
  },
  xAxisText: {
    color: '#999',
    fontSize: 10,
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginVertical: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  premiumLockContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  premiumLockTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  premiumLockText: {
    fontSize: 14,
    color: '#CCC',
    textAlign: 'center',
  },
});
