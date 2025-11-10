/**
 * Guide Modal Component
 *
 * Interactive step-by-step guide to help users learn the app.
 * Shows key features and how to use them.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { X, ChevronLeft, ChevronRight, Dumbbell, Target, Calendar, TrendingUp, Award, Trophy, Activity, Plus, Play } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

type GuideStep = {
  title: string;
  description: string;
  icon: any;
  iconColor: string;
  tips: string[];
  visualDemo?: {
    title: string;
    items: { icon: any; label: string; color: string }[];
  };
};

const guideSteps: GuideStep[] = [
  {
    title: 'Welcome to Arm Wrestling Pro! 💪',
    description: 'Your complete training companion for arm wrestling. Track workouts, monitor progress, set goals, and become the champion you\'re meant to be.',
    icon: Trophy,
    iconColor: '#E63946',
    tips: [
      '📊 Track every workout with detailed logging',
      '💪 Record your personal records and strength tests',
      '🎯 Set and achieve training goals',
      '📅 Plan your training with cycles and schedules',
      '📈 Monitor progress with visual analytics',
    ],
    visualDemo: {
      title: 'Main Features:',
      items: [
        { icon: Dumbbell, label: 'Training', color: '#E63946' },
        { icon: TrendingUp, label: 'Progress', color: '#2A7DE1' },
        { icon: Calendar, label: 'Calendar', color: '#4CAF50' },
        { icon: Award, label: 'Profile', color: '#FFD700' },
      ],
    },
  },
  {
    title: 'Log Your Workouts 🏋️',
    description: 'The Training tab is your workout journal. Record every session with type, duration, intensity, and specific exercises. All your hard work, documented.',
    icon: Dumbbell,
    iconColor: '#E63946',
    tips: [
      '🎯 Choose workout type (Strength, Table Practice, etc.)',
      '⏱️ Track duration and intensity (1-10 scale)',
      '💪 Add exercises with sets, reps, and weight',
      '📝 Include notes about how the session felt',
      '🔄 Link workouts to training cycles (optional)',
    ],
    visualDemo: {
      title: 'How to Log:',
      items: [
        { icon: Plus, label: 'Tap + Button', color: '#E63946' },
        { icon: Dumbbell, label: 'Select Type', color: '#2A7DE1' },
        { icon: Target, label: 'Add Details', color: '#4CAF50' },
        { icon: Trophy, label: 'Save!', color: '#FFD700' },
      ],
    },
  },
  {
    title: 'Training Cycles 🔄',
    description: 'Organize training into cycles for strategic periodization. Each cycle has a focus (Competition Prep, Strength Building, etc.) and timeline to help you peak perfectly.',
    icon: Calendar,
    iconColor: '#2A7DE1',
    tips: [
      '📅 Set start and end dates for structure',
      '🎯 Choose cycle type based on goals',
      '💪 Track all workouts within the cycle',
      '📊 Monitor cycle progress percentage',
      '✅ Multiple cycle can be active at a time',
    ],
    visualDemo: {
      title: 'Cycle Types:',
      items: [
        { icon: Trophy, label: 'Competition Prep', color: '#E63946' },
        { icon: Dumbbell, label: 'Strength Building', color: '#2A7DE1' },
        { icon: Target, label: 'Technique Focus', color: '#4CAF50' },
        { icon: Activity, label: 'Rehabilitation', color: '#FFD700' },
      ],
    },
  },
  {
    title: 'Personal Records 💪',
    description: 'Track your strength milestones! Log PRs for standard lifts or create custom tests. Every entry is saved with date and value for complete history tracking.',
    icon: TrendingUp,
    iconColor: '#10B981',
    tips: [
      '🏆 Use predefined PR types (Max Grip, Wrist Curl, etc.)',
      '✨ Create custom PRs for any exercise',
      '📈 Every update creates a new timestamped entry',
      '📊 All history preserved for graphs and calendar',
      '💪 See your progress over time visually',
    ],
    visualDemo: {
      title: 'How PRs Work:',
      items: [
        { icon: Plus, label: 'Record New PR', color: '#E63946' },
        { icon: TrendingUp, label: 'View Latest', color: '#2A7DE1' },
        { icon: Calendar, label: 'Track History', color: '#4CAF50' },
        { icon: Activity, label: 'See Graphs', color: '#10B981' },
      ],
    },
  },
  {
    title: 'Set Training Goals 🎯',
    description: 'Define specific, measurable goals with deadlines. Track progress manually with the + button. When you hit your target, celebrate with confetti! 🎉',
    icon: Target,
    iconColor: '#FFD700',
    tips: [
      '🎯 Set clear target values (e.g., "20 workouts")',
      '📅 Add deadline for accountability',
      '➕ Increment progress with + button',
      '✅ Auto-completion when target is reached',
      '🏆 Goals turn gold when completed',
      '🆓 Unlimited goals',
    ],
    visualDemo: {
      title: 'Goal Examples:',
      items: [
        { icon: Dumbbell, label: '20 Workouts', color: '#E63946' },
        { icon: Trophy, label: 'Win 5 Matches', color: '#2A7DE1' },
        { icon: Calendar, label: '12 Week Cycle', color: '#4CAF50' },
        { icon: TrendingUp, label: 'Max 150 lbs', color: '#FFD700' },
      ],
    },
  },
  {
    title: 'Schedule Training 📅',
    description: 'Plan ahead! Schedule training sessions with date, time, and optional notifications. Mark complete when done, and it auto-logs to your workout history.',
    icon: Calendar,
    iconColor: '#FF9500',
    tips: [
      '📅 Schedule sessions in advance',
      '🔔 Set notification reminders (X minutes before)',
      '✅ Mark complete to auto-log workout',
      '📝 Add description and details',
      '🔄 Edit or delete scheduled sessions anytime',
    ],
    visualDemo: {
      title: 'Scheduling Flow:',
      items: [
        { icon: Plus, label: 'Create Event', color: '#E63946' },
        { icon: Calendar, label: 'Set Date/Time', color: '#2A7DE1' },
        { icon: Activity, label: 'Get Reminder', color: '#FF9500' },
        { icon: Trophy, label: 'Complete!', color: '#10B981' },
      ],
    },
  },
  {
    title: 'Body Measurements 📏',
    description: 'Track physical changes! Log weight, arm/forearm/wrist circumference. See trends over time with change indicators. All measurements support both lbs/kg and in/cm.',
    icon: Activity,
    iconColor: '#E63946',
    tips: [
      '⚖️ Log weight in your preferred unit',
      '💪 Track arm, forearm, wrist circumference',
      '📈 View change trends (up/down arrows)',
      '📊 See historical data in graphs',
      '🔄 Auto-converts between units',
    ],
    visualDemo: {
      title: 'What to Track:',
      items: [
        { icon: Activity, label: 'Body Weight', color: '#E63946' },
        { icon: Dumbbell, label: 'Arm Size', color: '#2A7DE1' },
        { icon: Target, label: 'Forearm', color: '#4CAF50' },
        { icon: Trophy, label: 'Wrist', color: '#FFD700' },
      ],
    },
  },
  {
    title: 'Calendar View 📆',
    description: 'Visualize your entire training history! Color-coded days show workouts, PRs, goals, and scheduled sessions. Tap any day for full details.',
    icon: Calendar,
    iconColor: '#4CAF50',
    tips: [
      '🔴 Red intensity = More workouts that day',
      '🔵 Blue border = Active training cycle',
      '💪 Muscle emoji = PR recorded',
      '🎯 Target emoji = Goal deadline',
      '📅 Calendar emoji = Scheduled session',
      '🎛️ Filter view with top buttons',
    ],
    visualDemo: {
      title: 'Calendar Colors:',
      items: [
        { icon: Dumbbell, label: 'Workouts (Red)', color: '#E63946' },
        { icon: Calendar, label: 'Cycles (Blue)', color: '#2A7DE1' },
        { icon: TrendingUp, label: 'PRs (Green)', color: '#10B981' },
        { icon: Target, label: 'Goals (Gold)', color: '#FFD700' },
      ],
    },
  },
  {
    title: 'Analytics & Reports 📊',
    description: 'Premium feature! View detailed graphs of workouts, strength progress, and measurements. Generate shareable progress reports for social media or PDF export.',
    icon: Activity,
    iconColor: '#2A7DE1',
    tips: [
      '📈 Interactive graphs with zoom/pan',
      '📊 Workout frequency and intensity trends',
      '💪 Strength progress over time',
      '⚖️ Body measurement changes',
      '🔄 Cycle performance analysis',
      '📱 Share reports as images or PDF',
    ],
    visualDemo: {
      title: 'Premium Analytics:',
      items: [
        { icon: TrendingUp, label: 'Trend Lines', color: '#E63946' },
        { icon: Activity, label: 'Comparisons', color: '#2A7DE1' },
        { icon: Calendar, label: 'Cycle Stats', color: '#4CAF50' },
        { icon: Trophy, label: 'Share Reports', color: '#FFD700' },
      ],
    },
  },
  {
    title: 'Profile & Settings ⚙️',
    description: 'Customize your experience! Switch units (lbs/kg), toggle theme (light/dark), update your avatar, and manage premium subscription. Make the app yours!',
    icon: Award,
    iconColor: '#FFD700',
    tips: [
      '⚖️ Switch between lbs and kg (all data converts)',
      '🌓 Toggle light/dark theme for comfort',
      '🖼️ Upload custom avatar photo',
      '⭐ Upgrade to Premium for unlimited features and no ads',
      '❓ Access this guide anytime from here',
    ],
    visualDemo: {
      title: 'Customization:',
      items: [
        { icon: Activity, label: 'Units', color: '#E63946' },
        { icon: Target, label: 'Theme', color: '#2A7DE1' },
        { icon: Award, label: 'Avatar', color: '#4CAF50' },
        { icon: Trophy, label: 'Premium', color: '#FFD700' },
      ],
    },
  },
];

type GuideModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function GuideModal({ visible, onClose }: GuideModalProps) {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  const step = guideSteps[currentStep];
  const IconComponent = step.icon;
  const isLastStep = currentStep === guideSteps.length - 1;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              App Guide
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {guideSteps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor:
                      index === currentStep
                        ? colors.primary
                        : index < currentStep
                        ? colors.success
                        : colors.border,
                  },
                ]}
              />
            ))}
          </View>

          {/* Content */}
          <ScrollView
            style={[styles.content, { flexGrow: 1, minHeight: 0 }]}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: `${step.iconColor}20` }]}>
              <IconComponent size={64} color={step.iconColor} />
            </View>

            {/* Step Number */}
            <Text style={[styles.stepNumber, { color: colors.textSecondary }]}>
              Step {currentStep + 1} of {guideSteps.length}
            </Text>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text }]}>
              {step.title}
            </Text>

            {/* Description */}
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {step.description}
            </Text>

            {/* Visual Demo */}
            {step.visualDemo && (
              <View style={[styles.visualDemo, { backgroundColor: colors.surface }]}>
                <Text style={[styles.visualDemoTitle, { color: colors.text }]}>
                  {step.visualDemo.title}
                </Text>
                <View style={styles.visualDemoGrid}>
                  {step.visualDemo.items.map((item, index) => {
                    const ItemIcon = item.icon;
                    return (
                      <View key={index} style={[styles.visualDemoItem, { backgroundColor: `${item.color}15` }]}>
                        <View style={[styles.visualDemoIconCircle, { backgroundColor: `${item.color}30` }]}>
                          <ItemIcon size={24} color={item.color} />
                        </View>
                        <Text style={[styles.visualDemoLabel, { color: colors.text }]}>
                          {item.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Tips */}
            <View style={styles.tipsContainer}>
              <Text style={[styles.tipsTitle, { color: colors.text }]}>
                Key Points:
              </Text>
              {step.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <View style={[styles.tipBullet, { backgroundColor: step.iconColor }]} />
                  <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                    {tip}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Navigation */}
          <View style={styles.navigation}>
            <TouchableOpacity
              onPress={handlePrevious}
              disabled={currentStep === 0}
              style={[
                styles.navButton,
                styles.previousButton,
                { borderColor: colors.border },
                currentStep === 0 && styles.navButtonDisabled,
              ]}
            >
              <ChevronLeft
                size={20}
                color={currentStep === 0 ? colors.border : colors.primary}
              />
              <Text
                style={[
                  styles.navButtonText,
                  { color: currentStep === 0 ? colors.border : colors.primary },
                ]}
              >
                Previous
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNext}
              style={[styles.navButton, styles.nextButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.nextButtonText}>
                {isLastStep ? '🎉 Get Started!' : 'Next'}
              </Text>
              {!isLastStep && <ChevronRight size={20} color="#FFF" />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 20,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flexGrow: 1,
    minHeight: 0,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  stepNumber: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  visualDemo: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  visualDemoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  visualDemoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  visualDemoItem: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  visualDemoIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  visualDemoLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tipsContainer: {
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  navigation: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  previousButton: {
    borderWidth: 2,
  },
  nextButton: {
    flex: 1.5,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
