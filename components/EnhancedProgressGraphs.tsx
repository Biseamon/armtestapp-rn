import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Modal } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useTheme } from '@/contexts/ThemeContext';
import { Workout, StrengthTest, BodyMeasurement, Cycle } from '@/lib/supabase';
import { formatWeight } from '@/lib/weightUtils';
import { convertWeight } from '@/lib/weightUtils'
import { convertCircumference, getCircumferenceUnit } from '@/lib/weightUtils';
import { Lock, Info, X } from 'lucide-react-native';

interface EnhancedProgressGraphsProps {
  workouts: Workout[];
  strengthTests: StrengthTest[];
  measurements: BodyMeasurement[];
  cycles: Cycle[];
  weightUnit: 'kg' | 'lbs';
  isPremium: boolean;
  onUpgrade: () => void;
}

type GraphType = 'frequency' | 'duration' | 'intensity' | 'pr_timeline' | 'body_measurements' | 'training_logs';

export function EnhancedProgressGraphs({
  workouts,
  strengthTests,
  measurements,
  cycles,
  weightUnit,
  isPremium,
  onUpgrade,
}: EnhancedProgressGraphsProps) {
  const { colors } = useTheme();
  const [selectedGraph, setSelectedGraph] = useState<GraphType>('frequency');
  const [selectedMeasurement, setSelectedMeasurement] = useState<'weight' | 'arm' | 'forearm' | 'wrist'>('weight');
  const [showTooltip, setShowTooltip] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<typeof trainingLogsData[0] | null>(null);
  const [showCycleDetails, setShowCycleDetails] = useState(false);
  
  // New states for data point selection
  const [selectedDataPoint, setSelectedDataPoint] = useState<any>(null);
  const [showDataPointModal, setShowDataPointModal] = useState(false);

  const screenWidth = Dimensions.get('window').width - 40;

  // Training Frequency (workouts + PRs per week over last 12 weeks)
  const getFrequencyData = () => {
    const now = new Date();
    const weeks = [];
    
    // Get last 12 weeks for better visualization
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7 + 6));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - (i * 7));
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekWorkouts = workouts.filter(w => {
        const workoutDate = new Date(w.created_at);
        return workoutDate >= weekStart && workoutDate <= weekEnd;
      });

      const weekPRs = strengthTests.filter(t => {
        const testDate = new Date(t.created_at);
        return testDate >= weekStart && testDate <= weekEnd;
      });
      
      weeks.push({
        label: `W${12 - i}`,
        count: weekWorkouts.length + weekPRs.length
      });
    }
    
    return weeks;
  };

  const frequencyWeeks = getFrequencyData();
  const frequencyLabels = frequencyWeeks.map(w => w.label);
  const frequencyValues = frequencyWeeks.map(w => w.count);

  // Process duration data
  const durationData = workouts
    .filter((workout) => workout.duration_minutes > 0)
    .slice(0, 15)
    .reverse();

  const durationLabels = durationData.map((_, index) => `W${index + 1}`);
  const durationValues = durationData.map((workout) => workout.duration_minutes);

  // Process intensity data
  const intensityData = workouts
    .filter((workout) => workout.intensity > 0)
    .slice(0, 15)
    .reverse();

  const intensityLabels = intensityData.map((_, index) => `W${index + 1}`);
  const intensityValues = intensityData.map((workout) => workout.intensity);

  // PR Timeline - FIXED to show actual latest PR value
  // Around line 110 - update getPRTimeline:
  const getPRTimeline = () => {
    const testsByType: { [key: string]: Array<{ date: string; value: number; created_at: string; id: string }> } = {};
    
    const sortedTests = [...strengthTests].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    sortedTests.forEach(test => {
      const date = new Date(test.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      const storedUnit = test.result_unit || 'lbs';
      
      // Convert to user's current preference and round
      const displayValue = Math.round(convertWeight(test.result_value, storedUnit, weightUnit));
      
      if (!testsByType[test.test_type]) {
        testsByType[test.test_type] = [];
      }
      
      testsByType[test.test_type].push({ 
        date, 
        value: displayValue, // Already rounded
        created_at: test.created_at,
        id: test.id
      });
    });
    
    return testsByType;
  };

  const prDataByType = getPRTimeline();
  const prTypes = Object.keys(prDataByType);
  const [selectedPRType, setSelectedPRType] = useState(prTypes[0] || 'max_wrist_curl');

  // Effect to update selectedPRType when strengthTests change or isPremium becomes true
  useEffect(() => {
    if (isPremium && prTypes.length > 0 && !prTypes.includes(selectedPRType)) {
      setSelectedPRType(prTypes[0]);
    }
  }, [isPremium, strengthTests, prTypes.length]);

  const prData = prDataByType[selectedPRType] || [];

    // Get the absolute latest PR for the selected type - FIXED
    const getLatestPR = () => {
      if (prData.length === 0) return null;
      return prData[prData.length - 1].value;
    };

    // Calculate PR change considering updates
    const getPRChange = () => {
      if (prData.length < 2) return { value: 0, text: 'N/A' };
      
      const previousValue = prData[prData.length - 2].value;
      const latestValue = prData[prData.length - 1].value;
      const change = ((latestValue - previousValue) / previousValue) * 100;
      
      return {
        value: change,
        text: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
      };
    };

  // Training Logs Graph - FIXED to use is_active instead of status
  const getTrainingLogsData = () => {
    // Get cycles with their workouts - filter by is_active
    const cyclesWithWorkouts = cycles
      .map(cycle => {
        const cycleWorkouts = workouts.filter(w => w.cycle_id === cycle.id);
        const now = new Date();
        const endDate = new Date(cycle.end_date);
        const isCompleted = endDate < now;
        
        return {
          name: cycle.name.length > 10 ? cycle.name.substring(0, 10) + '...' : cycle.name,
          fullName: cycle.name,
          workoutCount: cycleWorkouts.length,
          avgIntensity: cycleWorkouts.length > 0 
            ? cycleWorkouts.reduce((sum, w) => sum + (w.intensity || 0), 0) / cycleWorkouts.length 
            : 0,
          totalDuration: cycleWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0),
          isActive: cycle.is_active,
          isCompleted: isCompleted,
          startDate: cycle.start_date,
          endDate: cycle.end_date
        };
      })
      .slice(-10); // Last 10 cycles

    return cyclesWithWorkouts;
  };

  const trainingLogsData = getTrainingLogsData();
  const trainingLogsLabels = trainingLogsData.map(c => c.name);
  const trainingLogsWorkoutCounts = trainingLogsData.map(c => c.workoutCount);

  // Body Measurements Data
  const getMeasurementData = (measurementType: 'weight' | 'arm' | 'forearm' | 'wrist') => {
    const sortedMeasurements = [...measurements]
      .filter(m => {
        if (measurementType === 'weight') return m.weight != null && m.weight > 0;
        if (measurementType === 'arm') return m.arm_circumference != null && m.arm_circumference > 0;
        if (measurementType === 'forearm') return m.forearm_circumference != null && m.forearm_circumference > 0;
        if (measurementType === 'wrist') return m.wrist_circumference != null && m.wrist_circumference > 0;
        return false;
      })
      .sort((a, b) => {
        const dateA = new Date(a.measured_at || a.created_at).getTime();
        const dateB = new Date(b.measured_at || b.created_at).getTime();
        return dateA - dateB;
      })
      .slice(-15);

    const labels = sortedMeasurements.map((_, index) => `M${index + 1}`);
    
    const values = sortedMeasurements.map(m => {
      if (measurementType === 'weight') {
        const weightValue = m.weight!;
        const storedUnit = m.weight_unit || 'lbs';
        return Math.round(convertWeight(weightValue, storedUnit, weightUnit));
      }
      // Circumferences - convert and round if in inches
      const circumferenceValue = measurementType === 'arm' ? m.arm_circumference! :
                                 measurementType === 'forearm' ? m.forearm_circumference! :
                                 m.wrist_circumference!;
      const converted = convertCircumference(circumferenceValue, weightUnit);
      return weightUnit === 'lbs' ? Math.round(converted) : converted;
    });

    return { labels, values, measurements: sortedMeasurements };
  };

  const measurementData = getMeasurementData(selectedMeasurement);

  const getChartWidth = (dataPoints: number) => {
    const minWidth = screenWidth;
    const pointSpacing = 60;
    const calculatedWidth = dataPoints * pointSpacing;
    return Math.max(minWidth, calculatedWidth);
  };

  const getChartConfig = (graphType: string) => ({
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: graphType === 'intensity' ? 1 : graphType === 'body_measurements' ? 1 : 0,
    color: (opacity = 1) => {
      switch (graphType) {
        case 'frequency':
          return `rgba(147, 51, 234, ${opacity})`;
        case 'duration':
          return `rgba(42, 125, 225, ${opacity})`;
        case 'intensity':
          return `rgba(255, 165, 0, ${opacity})`;
        case 'pr_timeline':
          return `rgba(236, 72, 153, ${opacity})`;
        case 'body_measurements':
          return `rgba(34, 197, 94, ${opacity})`;
        case 'training_logs':
          return `rgba(139, 92, 246, ${opacity})`;
        default:
          return `rgba(230, 57, 70, ${opacity})`;
      }
    },
    labelColor: (opacity = 1) => colors.textSecondary,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: graphType === 'frequency' ? '#9333EA' :
             graphType === 'duration' ? '#2A7DE1' :
             graphType === 'intensity' ? '#FFA500' :
             graphType === 'pr_timeline' ? '#EC4899' :
             graphType === 'training_logs' ? '#8B5CF6' : '#22C55E',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.border,
      strokeWidth: 1,
    },
  });

  const calculateAverage = (values: number[]) => {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const calculateTrend = (values: number[]) => {
    if (values.length < 2) return 0;
    const lastValue = values[values.length - 1];
    const firstValue = values[0];
    return ((lastValue - firstValue) / firstValue) * 100;
  };

  const graphOptions = [
    { id: 'frequency', label: '📊 Frequency', premium: true },
    { id: 'duration', label: '⏱️ Duration', premium: true },
    { id: 'intensity', label: '🔥 Intensity', premium: true },
    { id: 'pr_timeline', label: '🏆 PR History', premium: true },
    { id: 'body_measurements', label: '📏 Measurements', premium: true },
    { id: 'training_logs', label: '📝 Cycle Logs', premium: true },
  ];

  const getTooltipContent = () => {
    switch (selectedGraph) {
      case 'frequency':
        return {
          title: 'Training Frequency',
          description: 'Shows your weekly training activity over the last 12 weeks. Combines both workouts and strength tests. Labels W1-W12 represent Week 1 through Week 12, with W12 being the current week (centered for easy viewing).',
          tip: 'Aim for consistency! 3-5 sessions per week is optimal for most athletes.'
        };
      case 'duration':
        return {
          title: 'Workout Duration',
          description: 'Tracks how long your workouts last. Labels W1-W15 represent your last 15 workouts in chronological order. Helps monitor endurance and training volume.',
          tip: 'Quality over quantity - focus on intensity rather than just duration.'
        };
      case 'intensity':
        return {
          title: 'Training Intensity',
          description: 'Your self-rated workout intensity on a scale of 1-10. Labels W1-W15 show your last 15 workouts. Higher intensity means harder effort and greater fatigue.',
          tip: 'Mix high (8-10) and moderate (5-7) intensity days for optimal recovery.'
        };
      case 'pr_timeline':
        return {
          title: 'PR History',
          description: 'Complete history of all your strength tests. Each point represents a test result. You can update the same PR multiple times - each update creates a new point showing your progression. The "Latest" always shows your most recent test value (not necessarily your best). "Change" compares your latest test to your first test.',
          tip: 'Update PRs regularly to track improvements! Each update appears as a new point on the graph.'
        };
      case 'body_measurements':
        return {
          title: 'Body Measurements',
          description: `Tracks your ${selectedMeasurement} measurements over time. Labels M1-M15 represent Measurement 1 through Measurement 15 in chronological order. Each M represents one measurement entry.`,
          tip: selectedMeasurement === 'weight' 
            ? 'Measure at the same time of day for consistency.'
            : 'Measure the same spot on your body each time for accuracy.'
        };
      case 'training_logs':
        return {
          title: 'Training Cycle Logs',
          description: 'Shows workout volume across your training cycles. Each bar represents a completed or in-progress cycle, showing the total number of workouts logged. Helps you see which training programs you completed most consistently.',
          tip: 'Consistent logging within cycles helps you identify what training programs work best for you!'
        };
      default:
        return { title: '', description: '', tip: '' };
    }
  };

  const renderPremiumOverlay = () => (
    <View style={styles.premiumOverlay}>
      <Lock size={40} color="#FFD700" />
      <Text style={styles.premiumOverlayTitle}>Premium Feature</Text>
      <Text style={styles.premiumOverlayText}>
        Unlock advanced analytics and track your progress
      </Text>
      <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
        <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTooltipModal = () => {
    const content = getTooltipContent();
    
    return (
      <Modal
        visible={showTooltip}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTooltip(false)}
      >
        <TouchableOpacity 
          style={styles.tooltipModalOverlay}
          activeOpacity={1}
          onPress={() => setShowTooltip(false)}
        >
          <View style={[styles.tooltipModal, { backgroundColor: colors.surface }]}>
            <View style={styles.tooltipHeader}>
              <Text style={[styles.tooltipTitle, { color: colors.text }]}>
                {content.title}
              </Text>
              <TouchableOpacity onPress={() => setShowTooltip(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.tooltipDescription, { color: colors.textSecondary }]}>
              {content.description}
            </Text>
            
            {content.tip && (
              <View style={[styles.tooltipTip, { backgroundColor: colors.background }]}>
                <Text style={[styles.tooltipTipLabel, { color: colors.primary }]}>💡 Tip:</Text>
                <Text style={[styles.tooltipTipText, { color: colors.textSecondary }]}>
                  {content.tip}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderCycleDetailsModal = () => {
    if (!selectedCycle) return null;
    
    return (
      <Modal
        visible={showCycleDetails}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCycleDetails(false)}
      >
        <TouchableOpacity 
          style={styles.tooltipModalOverlay}
          activeOpacity={1}
          onPress={() => setShowCycleDetails(false)}
        >
          <View style={[styles.cycleDetailsModal, { backgroundColor: colors.surface }]}>
            <View style={styles.tooltipHeader}>
              <Text style={[styles.tooltipTitle, { color: colors.text }]}>
                {selectedCycle.fullName}
              </Text>
              <TouchableOpacity onPress={() => setShowCycleDetails(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.cycleDetailsContent}>
              <View style={styles.cycleDetailRow}>
                <Text style={[styles.cycleDetailLabel, { color: colors.textSecondary }]}>Status:</Text>
                <Text style={[styles.cycleDetailValue, { 
                  color: selectedCycle.isActive ? '#10B981' : selectedCycle.isCompleted ? '#999' : colors.text 
                }]}>
                  {selectedCycle.isActive ? '🟢 Active' : selectedCycle.isCompleted ? '✅ Completed' : '📅 Scheduled'}
                </Text>
              </View>
              
              <View style={styles.cycleDetailRow}>
                <Text style={[styles.cycleDetailLabel, { color: colors.textSecondary }]}>Dates:</Text>
                <Text style={[styles.cycleDetailValue, { color: colors.text }]}>
                  {new Date(selectedCycle.startDate).toLocaleDateString()} - {new Date(selectedCycle.endDate).toLocaleDateString()}
                </Text>
              </View>
              
              <View style={styles.cycleDetailRow}>
                <Text style={[styles.cycleDetailLabel, { color: colors.textSecondary }]}>Total Workouts:</Text>
                <Text style={[styles.cycleDetailValue, { color: colors.primary }]}>
                  {selectedCycle.workoutCount}
                </Text>
              </View>
              
              <View style={styles.cycleDetailRow}>
                <Text style={[styles.cycleDetailLabel, { color: colors.textSecondary }]}>Avg Intensity:</Text>
                <Text style={[styles.cycleDetailValue, { color: colors.text }]}>
                  {selectedCycle.avgIntensity.toFixed(1)}/10
                </Text>
              </View>
              
              <View style={styles.cycleDetailRow}>
                <Text style={[styles.cycleDetailLabel, { color: colors.textSecondary }]}>Total Duration:</Text>
                <Text style={[styles.cycleDetailValue, { color: colors.text }]}>
                  {selectedCycle.totalDuration} minutes
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.cycleDetailsCloseButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowCycleDetails(false)}
            >
              <Text style={styles.cycleDetailsCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Render data point detail modal
  const renderDataPointModal = () => {
    if (!selectedDataPoint) return null;

    return (
      <Modal
        visible={showDataPointModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDataPointModal(false)}
      >
        <TouchableOpacity 
          style={styles.tooltipModalOverlay}
          activeOpacity={1}
          onPress={() => setShowDataPointModal(false)}
        >
          <View style={[styles.dataPointModal, { backgroundColor: colors.surface }]}>
            <View style={styles.tooltipHeader}>
              <Text style={[styles.tooltipTitle, { color: colors.text }]}>
                {selectedDataPoint.title}
              </Text>
              <TouchableOpacity onPress={() => setShowDataPointModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dataPointContent}>
              {selectedDataPoint.details.map((detail: any, index: number) => (
                <View key={index} style={styles.dataPointRow}>
                  <Text style={[styles.dataPointLabel, { color: colors.textSecondary }]}>
                    {detail.label}:
                  </Text>
                  <Text style={[styles.dataPointValue, { color: colors.text }]}>
                    {detail.value}
                  </Text>
                </View>
              ))}
            </View>
            
            <TouchableOpacity 
              style={[styles.dataPointCloseButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowDataPointModal(false)}
            >
              <Text style={styles.dataPointCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  if (workouts.length === 0 && strengthTests.length === 0 && measurements.length === 0 && cycles.length === 0) {
    return (
      <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No data yet. Complete workouts and track measurements to see your progress!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderTooltipModal()}
      {renderCycleDetailsModal()}
      {renderDataPointModal()}
      
      {/* Graph Type Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.selectorScroll}
      >
        <View style={styles.selector}>
          {graphOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.selectorButton,
                selectedGraph === option.id && styles.selectorButtonActive,
                {
                  backgroundColor: selectedGraph === option.id && isPremium
                    ? option.id === 'frequency' ? '#9333EA'
                    : option.id === 'duration' ? '#2A7DE1'
                    : option.id === 'intensity' ? '#FFA500'
                    : option.id === 'pr_timeline' ? '#EC4899'
                    : option.id === 'training_logs' ? '#8B5CF6'
                    : '#22C55E'
                    : colors.surface
                }
              ]}
              onPress={() => {
                if (!isPremium) {
                  onUpgrade();
                } else {
                  setSelectedGraph(option.id as GraphType);
                }
              }}
            >
              <Text
                style={[
                  styles.selectorText,
                  { color: selectedGraph === option.id && isPremium ? '#FFF' : colors.textSecondary }
                ]}
              >
                {option.label}
              </Text>
              {!isPremium && (
                <Lock size={12} color={colors.textSecondary} style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Premium Overlay for all graphs */}
      {!isPremium && (
        <View style={styles.graphContainer}>
          <View style={styles.blurredGraph}>
            {renderPremiumOverlay()}
          </View>
        </View>
      )}

      {/* Frequency Graph (Premium) - Auto-scrolled to show current week */}
      {selectedGraph === 'frequency' && isPremium && frequencyValues.length > 0 && (
        <View style={styles.graphContainer}>
          <View style={styles.graphTitleRow}>
            <Text style={[styles.graphTitle, { color: colors.text }]}>
              Training Frequency (Workouts + PRs)
            </Text>
            <TouchableOpacity onPress={() => setShowTooltip(true)}>
              <Info size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.graphHint, { color: colors.textSecondary }]}>
            👆 Tap any bar to see details
          </Text>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            style={styles.scrollView}
            contentOffset={{ x: Math.max(0, (frequencyWeeks.length * 60) - screenWidth + 100), y: 0 }}
          >
            <View>
              <BarChart
                data={{
                  labels: frequencyLabels,
                  datasets: [{ data: frequencyValues.length > 0 ? frequencyValues : [0] }],
                }}
                width={getChartWidth(frequencyWeeks.length)}
                height={220}
                chartConfig={getChartConfig('frequency')}
                style={styles.chart}
                withInnerLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                fromZero={true}
                showBarTops={true}
                showValuesOnTopOfBars={true}
                yAxisLabel=""
                yAxisSuffix=""
              />
              
              <View style={styles.chartTouchableOverlay}>
                {frequencyWeeks.map((week, index) => {
                  const barWidth = getChartWidth(frequencyWeeks.length) / frequencyWeeks.length;
                  const leftOffset = index * barWidth;
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.barTouchArea, {
                        left: leftOffset,
                        width: barWidth,
                      }]}
                      onPress={() => {
                          const now = new Date();
                          const weekStart = new Date(now);
                          weekStart.setDate(now.getDate() - ((11 - index) * 7 + 6));
                          const weekEnd = new Date(now);
                          weekEnd.setDate(now.getDate() - ((11 - index) * 7));
                          
                          const weekWorkouts = workouts.filter(w => {
                            const workoutDate = new Date(w.created_at);
                            return workoutDate >= weekStart && workoutDate <= weekEnd;
                          });
                          
                          const weekPRs = strengthTests.filter(t => {
                            const testDate = new Date(t.created_at);
                            return testDate >= weekStart && testDate <= weekEnd;
                          });
                          
                          setSelectedDataPoint({
                            title: `${week.label} - Week Details`,
                            details: [
                              { label: 'Date Range', value: `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}` },
                              { label: 'Total Sessions', value: week.count },
                              { label: 'Workouts', value: weekWorkouts.length },
                              { label: 'PR Tests', value: weekPRs.length },
                              { label: 'Avg per Day', value: (week.count / 7).toFixed(1) }
                            ]
                          });
                          setShowDataPointModal(true);
                        }}
                    />
                  );
                })}
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>This Week</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {frequencyValues[frequencyValues.length - 1] || 0}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg/Week</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {calculateAverage(frequencyValues).toFixed(1)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Best Week</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {Math.max(...frequencyValues)}
              </Text>
            </View>
          </View>
          <Text style={[styles.graphNote, { color: colors.textSecondary }]}>
            W1-W12 = Last 12 weeks • W12 = Current week (centered)
          </Text>
        </View>
      )}

      {/* Duration Graph (Premium) */}
      {selectedGraph === 'duration' && isPremium && durationData.length > 0 && (
        <View style={styles.graphContainer}>
          <View style={styles.graphTitleRow}>
            <Text style={[styles.graphTitle, { color: colors.text }]}>
              Workout Duration Trend
            </Text>
            <TouchableOpacity onPress={() => setShowTooltip(true)}>
              <Info size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.graphHint, { color: colors.textSecondary }]}>
            👆 Tap any point to see workout details
          </Text>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
          >
            <View>
              <LineChart
                data={{
                  labels: durationLabels,
                  datasets: [{ data: durationValues.length > 0 ? durationValues : [0] }],
                }}
                width={getChartWidth(durationData.length)}
                height={220}
                chartConfig={getChartConfig('duration')}
                bezier
                style={styles.chart}
                withInnerLines={true}
                withOuterLines={true}
                withVerticalLines={true}
                withHorizontalLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                withDots={true}
                withShadow={false}
                fromZero={false}
                segments={4}
              />
              
              <View style={styles.chartTouchableOverlay}>
                {durationData.map((workout, index) => {
                  const pointWidth = getChartWidth(durationData.length) / durationData.length;
                  const leftOffset = index * pointWidth;
                  
                  return (
                    <TouchableOpacity
                      key={workout.id}
                      style={[styles.pointTouchArea, {
                        left: leftOffset,
                        width: pointWidth,
                      }]}
                      onPress={() => {
                        setSelectedDataPoint({
                          title: `Workout #${durationData.length - index}`,
                          details: [
                            { label: 'Date', value: new Date(workout.created_at).toLocaleDateString() },
                            { label: 'Duration', value: `${workout.duration_minutes} minutes` },
                            { label: 'Intensity', value: `${workout.intensity || 'N/A'}/10` },
                            { label: 'Type', value: workout.workout_type || 'General' },
                            { label: 'Notes', value: workout.notes || 'No notes' }
                          ]
                        });
                        setShowDataPointModal(true);
                      }}
                    />
                  );
                })}
              </View>
            </View>
          </ScrollView>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Latest</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {durationValues[durationValues.length - 1] || 0} min
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Average</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {Math.round(calculateAverage(durationValues))} min
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {durationValues.reduce((a, b) => a + b, 0)} min
              </Text>
            </View>
          </View>
          <Text style={[styles.graphNote, { color: colors.textSecondary }]}>
            W1-W{durationData.length} represent your last {durationData.length} workouts
          </Text>
        </View>
      )}

      {/* Intensity Graph (Premium) */}
      {selectedGraph === 'intensity' && isPremium && intensityData.length > 0 && (
        <View style={styles.graphContainer}>
          <View style={styles.graphTitleRow}>
            <Text style={[styles.graphTitle, { color: colors.text }]}>
              Training Intensity Trend
            </Text>
            <TouchableOpacity onPress={() => setShowTooltip(true)}>
              <Info size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.graphHint, { color: colors.textSecondary }]}>
            👆 Tap any point to see workout details
          </Text>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
          >
            <View>
              <LineChart
                data={{
                  labels: intensityLabels,
                  datasets: [{ data: intensityValues.length > 0 ? intensityValues : [0] }],
                }}
                width={getChartWidth(intensityData.length)}
                height={220}
                chartConfig={getChartConfig('intensity')}
                bezier
                style={styles.chart}
                withInnerLines={true}
                withOuterLines={true}
                withVerticalLines={true}
                withHorizontalLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                withDots={true}
                withShadow={false}
                fromZero={true}
                segments={4}
                yAxisSuffix="/10"
              />
              
              <View style={styles.chartTouchableOverlay}>
                {intensityData.map((workout, index) => {
                  const pointWidth = getChartWidth(intensityData.length) / intensityData.length;
                  const leftOffset = index * pointWidth;
                  
                  return (
                    <TouchableOpacity
                      key={workout.id}
                      style={[styles.pointTouchArea, {
                        left: leftOffset,
                        width: pointWidth,
                      }]}
                      onPress={() => {
                        setSelectedDataPoint({
                          title: `Workout #${intensityData.length - index}`,
                          details: [
                            { label: 'Date', value: new Date(workout.created_at).toLocaleDateString() },
                            { label: 'Intensity', value: `${workout.intensity}/10` },
                            { label: 'Duration', value: `${workout.duration_minutes || 'N/A'} min` },
                            { label: 'Type', value: workout.workout_type || 'General' },
                            { label: 'Notes', value: workout.notes || 'No notes' }
                          ]
                        });
                        setShowDataPointModal(true);
                      }}
                    />
                  );
                })}
              </View>
            </View>
          </ScrollView>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Latest</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {intensityValues[intensityValues.length - 1] || 0}/10
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Average</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {calculateAverage(intensityValues).toFixed(1)}/10
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Peak</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {Math.max(...intensityValues)}/10
              </Text>
            </View>
          </View>
          <Text style={[styles.graphNote, { color: colors.textSecondary }]}>
            W1-W{intensityData.length} represent your last {intensityData.length} workouts
          </Text>
        </View>
      )}

      {/* PR Timeline Graph (Premium) - FIXED */}
      {selectedGraph === 'pr_timeline' && isPremium && prData.length > 0 && (
        <View style={styles.graphContainer}>
          <View style={styles.graphTitleRow}>
            <Text style={[styles.graphTitle, { color: colors.text }]}>
              PR History - {selectedPRType.replace(/_/g, ' ').toUpperCase()}
            </Text>
            <TouchableOpacity onPress={() => setShowTooltip(true)}>
              <Info size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.graphHint, { color: colors.textSecondary }]}>
            👆 Tap any point to see PR details
          </Text>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
          >
            <View>
              <LineChart
                data={{
                  labels: prData.map(pr => pr.date),
                  datasets: [{ data: prData.map(pr => pr.value) }],
                }}
                width={getChartWidth(prData.length)}
                height={220}
                chartConfig={getChartConfig('pr_timeline')}
                bezier
                style={styles.chart}
                withInnerLines={true}
                withOuterLines={true}
                withVerticalLines={true}
                withHorizontalLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                withDots={true}
                withShadow={false}
                fromZero={false}
                segments={4}
              />
              
              <View style={styles.chartTouchableOverlay}>
                {prData.map((pr, index) => {
                  const pointWidth = getChartWidth(prData.length) / prData.length;
                  const leftOffset = index * pointWidth;
                  
                  const fullTest = strengthTests.find(t => t.id === pr.id);
                  
                  return (
                    <TouchableOpacity
                      key={pr.id}
                      style={[styles.pointTouchArea, {
                        left: leftOffset,
                        width: pointWidth,
                      }]}
                      onPress={() => {
                        const improvement = index > 0 
                          ? ((pr.value - prData[index - 1].value) / prData[index - 1].value * 100).toFixed(1)
                          : 'N/A';
                        
                        setSelectedDataPoint({
                          title: `PR Test #${index + 1}`,
                          details: [
                            { label: 'Date', value: pr.date },
                            { label: 'Result', value: `${pr.value} ${weightUnit}` },
                            { label: 'Type', value: selectedPRType.replace(/_/g, ' ').toUpperCase() },
                            { label: 'Improvement', value: improvement !== 'N/A' ? `${improvement}%` : 'First test' },
                            { label: 'Notes', value: fullTest?.notes || 'No notes' }
                          ]
                        });
                        setShowDataPointModal(true);
                      }}
                    />
                  );
                })}
              </View>
            </View>
          </ScrollView>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Tests</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {prData.length}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Latest</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatWeight(getLatestPR() || 0, weightUnit)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Change</Text>
              <Text style={[styles.statValue, { color: getPRChange().value >= 0 ? '#10B981' : '#EF4444' }]}>
                {getPRChange().text}
              </Text>
            </View>
          </View>
          {prTypes.length > 1 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.prTypeSelector}
            >
              <View style={styles.prTypeButtons}>
                {prTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.prTypeButton,
                      { backgroundColor: type === selectedPRType ? '#EC4899' : colors.surface }
                    ]}
                    onPress={() => setSelectedPRType(type)}
                  >
                    <Text style={[styles.prTypeButtonText, { color: type === selectedPRType ? '#FFF' : colors.textSecondary }]}>
                      {type.replace(/_/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
          <Text style={[styles.graphNote, { color: colors.textSecondary }]}>
            🏆 Update same PR multiple times • Latest = most recent test
          </Text>
        </View>
      )}

      {/* Body Measurements Graph (Premium) */}
      {selectedGraph === 'body_measurements' && isPremium && measurementData.values.length > 0 && (
        <View style={styles.graphContainer}>
          <View style={styles.graphTitleRow}>
            <Text style={[styles.graphTitle, { color: colors.text }]}>
              Body Measurements - {selectedMeasurement.charAt(0).toUpperCase() + selectedMeasurement.slice(1)}
            </Text>
            <TouchableOpacity onPress={() => setShowTooltip(true)}>
              <Info size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.graphHint, { color: colors.textSecondary }]}>
            👆 Tap any point to see measurement details
          </Text>
          
          {/* Measurement Type Selector */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.measurementSelector}
          >
            <View style={styles.measurementButtons}>
              {(['weight', 'arm', 'forearm', 'wrist'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.measurementButton,
                    { backgroundColor: type === selectedMeasurement ? '#22C55E' : colors.surface }
                  ]}
                  onPress={() => setSelectedMeasurement(type)}
                >
                  <Text style={[styles.measurementButtonText, { color: type === selectedMeasurement ? '#FFF' : colors.textSecondary }]}>
                    {type === 'weight' ? `⚖️ ${type.charAt(0).toUpperCase() + type.slice(1)}` :
                     type === 'arm' ? `💪 ${type.charAt(0).toUpperCase() + type.slice(1)}` :
                     type === 'forearm' ? `🦾 ${type.charAt(0).toUpperCase() + type.slice(1)}` :
                     `✋ ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
          >
            <View>
              <LineChart
                data={{
                  labels: measurementData.labels,
                  datasets: [{ data: measurementData.values.length > 0 ? measurementData.values : [0] }],
                }}
                width={getChartWidth(measurementData.values.length)}
                height={220}
                chartConfig={getChartConfig('body_measurements')}
                bezier
                style={styles.chart}
                withInnerLines={true}
                withOuterLines={true}
                withVerticalLines={true}
                withHorizontalLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                withDots={true}
                withShadow={false}
                fromZero={false}
                segments={4}
              />
              
              <View style={styles.chartTouchableOverlay}>
                {measurementData.measurements.map((measurement, index) => {
                  const pointWidth = getChartWidth(measurementData.values.length) / measurementData.values.length;
                  const leftOffset = index * pointWidth;
                  
                  return (
                    <TouchableOpacity
                      key={measurement.id}
                      style={[styles.pointTouchArea, {
                        left: leftOffset,
                        width: pointWidth,
                      }]}
                      onPress={() => {
                        const details: Array<{label: string; value: string}> = [
                          { label: 'Date', value: new Date(measurement.measured_at || measurement.created_at).toLocaleDateString() }
                        ];
                        
                        if (selectedMeasurement === 'weight' && measurement.weight) {
                          const displayWeight = Math.round(convertWeight(
                            measurement.weight,
                            measurement.weight_unit || 'lbs',
                            weightUnit
                          ));
                          details.push({ label: 'Weight', value: `${displayWeight} ${weightUnit}` });
                        } else if (selectedMeasurement === 'arm' && measurement.arm_circumference) {
                          const displayValue = convertCircumference(measurement.arm_circumference, weightUnit);
                          details.push({ 
                            label: 'Arm Circumference', 
                            value: `${weightUnit === 'lbs' ? Math.round(displayValue) : displayValue.toFixed(1)} ${getCircumferenceUnit(weightUnit)}` 
                          });
                        } else if (selectedMeasurement === 'forearm' && measurement.forearm_circumference) {
                          const displayValue = convertCircumference(measurement.forearm_circumference, weightUnit);
                          details.push({ 
                            label: 'Forearm Circumference', 
                            value: `${weightUnit === 'lbs' ? Math.round(displayValue) : displayValue.toFixed(1)} ${getCircumferenceUnit(weightUnit)}` 
                          });
                        } else if (selectedMeasurement === 'wrist' && measurement.wrist_circumference) {
                          const displayValue = convertCircumference(measurement.wrist_circumference, weightUnit);
                          details.push({ 
                            label: 'Wrist Circumference', 
                            value: `${weightUnit === 'lbs' ? Math.round(displayValue) : displayValue.toFixed(1)} ${getCircumferenceUnit(weightUnit)}` 
                          });
                        }
                        
                        // Add change from previous if exists
                        if (index > 0) {
                          const prevMeasurement = measurementData.measurements[index - 1];
                          let change = 0;
                          
                          if (selectedMeasurement === 'weight' && measurement.weight && prevMeasurement.weight) {
                            const currentWeight = convertWeight(measurement.weight, measurement.weight_unit || 'lbs', weightUnit);
                            const prevWeight = convertWeight(prevMeasurement.weight, prevMeasurement.weight_unit || 'lbs', weightUnit);
                            change = currentWeight - prevWeight;
                            details.push({ 
                              label: 'Change', 
                              value: `${change >= 0 ? '+' : ''}${change.toFixed(1)} ${weightUnit}` 
                            });
                          } else if (selectedMeasurement === 'arm' && measurement.arm_circumference && prevMeasurement.arm_circumference) {
                            change = convertCircumference(measurement.arm_circumference, weightUnit) - convertCircumference(prevMeasurement.arm_circumference, weightUnit);
                            const displayChange = weightUnit === 'lbs' ? Math.round(change) : change.toFixed(1);
                            details.push({ 
                              label: 'Change', 
                              value: `${change >= 0 ? '+' : ''}${displayChange} ${getCircumferenceUnit(weightUnit)}` 
                            });
                          } else if (selectedMeasurement === 'forearm' && measurement.forearm_circumference && prevMeasurement.forearm_circumference) {
                            change = convertCircumference(measurement.forearm_circumference, weightUnit) - convertCircumference(prevMeasurement.forearm_circumference, weightUnit);
                            const displayChange = weightUnit === 'lbs' ? Math.round(change) : change.toFixed(1);
                            details.push({ 
                              label: 'Change', 
                              value: `${change >= 0 ? '+' : ''}${displayChange} ${getCircumferenceUnit(weightUnit)}` 
                            });
                          } else if (selectedMeasurement === 'wrist' && measurement.wrist_circumference && prevMeasurement.wrist_circumference) {
                            change = convertCircumference(measurement.wrist_circumference, weightUnit) - convertCircumference(prevMeasurement.wrist_circumference, weightUnit);
                            const displayChange = weightUnit === 'lbs' ? Math.round(change) : change.toFixed(1);
                            details.push({ 
                              label: 'Change', 
                              value: `${change >= 0 ? '+' : ''}${displayChange} ${getCircumferenceUnit(weightUnit)}` 
                            });
                          }
                        }
                        
                        if (measurement.notes) {
                          details.push({ label: 'Notes', value: measurement.notes });
                        }
                        
                        setSelectedDataPoint({
                          title: `${selectedMeasurement.charAt(0).toUpperCase() + selectedMeasurement.slice(1)} Measurement #${index + 1}`,
                          details
                        });
                        setShowDataPointModal(true);
                      }}
                    />
                  );
                })}
              </View>
            </View>
          </ScrollView>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Previous</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {measurementData.values.length > 1
                  ? selectedMeasurement === 'weight' 
                    ? (measurementData.values[measurementData.values.length - 2]?.toFixed(1) || 'N/A')
                    : weightUnit === 'lbs' 
                      ? Math.round(measurementData.values[measurementData.values.length - 2] || 0)
                      : (measurementData.values[measurementData.values.length - 2]?.toFixed(1) || 'N/A')
                  : 'N/A'}
                {measurementData.values.length > 1 
                  ? (selectedMeasurement === 'weight' ? ` ${weightUnit}` : ` ${getCircumferenceUnit(weightUnit)}`)
                  : ''}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Latest</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {selectedMeasurement === 'weight' 
                  ? (measurementData.values[measurementData.values.length - 1]?.toFixed(1) || 0)
                  : weightUnit === 'lbs' 
                    ? Math.round(measurementData.values[measurementData.values.length - 1] || 0)
                    : (measurementData.values[measurementData.values.length - 1]?.toFixed(1) || 0)
                }
                {selectedMeasurement === 'weight' ? ` ${weightUnit}` : ` ${getCircumferenceUnit(weightUnit)}`}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Change</Text>
              <Text style={[styles.statValue, { 
                color: calculateTrend(measurementData.values) >= 0 
                  ? (selectedMeasurement === 'weight' ? '#EF4444' : '#10B981') 
                  : (selectedMeasurement === 'weight' ? '#10B981' : '#EF4444')
              }]}>
                {calculateTrend(measurementData.values) >= 0 ? '+' : ''}
                {calculateTrend(measurementData.values).toFixed(1)}%
              </Text>
            </View>
          </View>
          <Text style={[styles.graphNote, { color: colors.textSecondary }]}>
            M1-M{measurementData.values.length} = Measurement entries (M{measurementData.values.length} is latest)
          </Text>
        </View>
      )}

      {/* Training Logs Graph (Premium) - NEW */}
      {selectedGraph === 'training_logs' && isPremium && trainingLogsData.length > 0 && (
        <View style={styles.graphContainer}>
          <View style={styles.graphTitleRow}>
            <Text style={[styles.graphTitle, { color: colors.text }]}>
              Training Cycle Logs
            </Text>
            <TouchableOpacity onPress={() => setShowTooltip(true)}>
              <Info size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          {/* Tappable cycle labels */}
          <View style={styles.cycleLabelsContainer}>
            <Text style={[styles.cycleLabelsHint, { color: colors.textSecondary }]}>
              👆 Tap a bar to see full cycle details
            </Text>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
          >
            <View>
              <BarChart
                data={{
                  labels: trainingLogsLabels,
                  datasets: [{ data: trainingLogsWorkoutCounts.length > 0 ? trainingLogsWorkoutCounts : [0] }],
                }}
                width={getChartWidth(trainingLogsData.length)}
                height={220}
                chartConfig={getChartConfig('training_logs')}
                style={styles.chart}
                withInnerLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                fromZero={true}
                showBarTops={true}
                showValuesOnTopOfBars={true}
                yAxisLabel=""
                yAxisSuffix=" logs"
              />
              
              {/* Invisible touchable overlay for each bar */}
              <View style={styles.chartTouchableOverlay}>
                {trainingLogsData.map((cycle, index) => {
                  const barWidth = getChartWidth(trainingLogsData.length) / trainingLogsData.length;
                  const leftOffset = index * barWidth;
                  
                  return (
                    <TouchableOpacity
                      key={cycle.fullName}
                      style={[styles.barTouchArea, {
                        left: leftOffset,
                        width: barWidth,
                      }]}
                      onPress={() => {
                        setSelectedCycle(cycle);
                        setShowCycleDetails(true);
                      }}
                    />
                  );
                })}
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Cycles</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {trainingLogsData.length}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Logs/Cycle</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {calculateAverage(trainingLogsWorkoutCounts).toFixed(1)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Most Logs</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {Math.max(...trainingLogsWorkoutCounts)}
              </Text>
            </View>
          </View>
          <Text style={[styles.graphNote, { color: colors.textSecondary }]}>
            📝 Workout logs per cycle • Tap any bar for full details
          </Text>
        </View>
      )}

      {/* Empty states */}
      {isPremium && selectedGraph === 'frequency' && frequencyValues.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No training data yet. Log workouts and tests to track your frequency!
          </Text>
        </View>
      )}

      {isPremium && selectedGraph === 'duration' && durationData.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No workout duration data yet. Log workouts to see your endurance trends!
          </Text>
        </View>
      )}

      {isPremium && selectedGraph === 'intensity' && intensityData.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No intensity data yet. Rate your workout intensity to track training load!
          </Text>
        </View>
      )}

      {isPremium && selectedGraph === 'pr_timeline' && prData.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No PR tests yet. Complete strength tests to see your progress!
          </Text>
        </View>
      )}

      {isPremium && selectedGraph === 'body_measurements' && measurementData.values.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No {selectedMeasurement} measurements yet. Add measurements to track your progress!
          </Text>
        </View>
      )}

      {isPremium && selectedGraph === 'training_logs' && trainingLogsData.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No training cycles yet. Create cycles and log workouts to see your training patterns!
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  selectorScroll: {
    marginBottom: 16,
  },
  selector: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  selectorButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
    flexDirection: 'row',
  },
  selectorButtonActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  graphContainer: {
    marginBottom: 16,
  },
  graphTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  graphHint: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  scrollView: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  scrollContent: {
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  graphNote: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  prTypeSelector: {
    marginTop: 12,
    marginBottom: 8,
  },
  prTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  prTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  prTypeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  measurementSelector: {
    marginBottom: 12,
  },
  measurementButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  measurementButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  measurementButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  blurredGraph: {
    height: 300,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.6,
  },
  premiumOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 16,
    zIndex: 10,
  },
  premiumOverlayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 12,
  },
  premiumOverlayText: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  upgradeButton: {
    backgroundColor: '#E63946',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  upgradeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tooltipModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tooltipModal: {
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tooltipDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  tooltipTip: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  tooltipTipLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tooltipTipText: {
    fontSize: 13,
    lineHeight: 18,
  },
  cycleDetailsModal: {
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cycleDetailsContent: {
    marginTop: 16,
  },
  cycleDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  cycleDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  cycleDetailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  cycleDetailsCloseButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cycleDetailsCloseButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cycleLabelsContainer: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  cycleLabelsHint: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  chartTouchableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  barTouchArea: {
    position: 'absolute',
    top: 0,
    bottom: 40,
    backgroundColor: 'transparent',
  },
  pointTouchArea: {
    position: 'absolute',
    top: 0,
    bottom: 40,
    backgroundColor: 'transparent',
  },
  dataPointModal: {
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dataPointContent: {
    marginTop: 16,
  },
  dataPointRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  dataPointLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  dataPointValue: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  dataPointCloseButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dataPointCloseButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});