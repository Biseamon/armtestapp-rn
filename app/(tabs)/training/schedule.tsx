import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Plus, X, Calendar, Clock, Bell, BellOff, Trash2, CheckCircle } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface ScheduledTraining {
  id: string;
  title: string;
  description: string;
  scheduled_date: string;
  scheduled_time: string;
  notification_enabled: boolean;
  notification_minutes_before: number;
  completed: boolean;
  created_at: string;
}

export default function ScheduleScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const [trainings, setTrainings] = useState<ScheduledTraining[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [minutesBefore, setMinutesBefore] = useState('30');

  useFocusEffect(
    useCallback(() => {
      if (profile) {
        fetchTrainings();
      }
    }, [profile])
  );

  const fetchTrainings = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('scheduled_trainings')
      .select('*')
      .eq('user_id', profile.id)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true });

    if (data) setTrainings(data);
  };

  const handleSave = async () => {
    if (!profile || !title) return;

    const timeString = `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`;

    const newTraining = {
      user_id: profile.id,
      title,
      description,
      scheduled_date: selectedDate.toISOString().split('T')[0],
      scheduled_time: timeString,
      notification_enabled: notificationEnabled,
      notification_minutes_before: parseInt(minutesBefore),
      completed: false,
    };

    await supabase
      .from('scheduled_trainings')
      .insert(newTraining);

    setTitle('');
    setDescription('');
    setSelectedDate(new Date());
    setSelectedTime(new Date());
    setNotificationEnabled(true);
    setMinutesBefore('30');
    setShowModal(false);
    fetchTrainings();
  };

  const handleToggleComplete = async (training: ScheduledTraining) => {
    await supabase
      .from('scheduled_trainings')
      .update({ completed: !training.completed })
      .eq('id', training.id);

    fetchTrainings();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('scheduled_trainings').delete().eq('id', id);
    fetchTrainings();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Training Schedule</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
          <Plus size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {trainings.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#666" />
            <Text style={styles.emptyText}>No scheduled trainings</Text>
            <Text style={styles.emptySubtext}>Create your first training schedule!</Text>
          </View>
        ) : (
          trainings.map((training) => (
            <View key={training.id} style={styles.trainingCard}>
              <View style={styles.trainingHeader}>
                <View style={styles.trainingInfo}>
                  <Text
                    style={[
                      styles.trainingTitle,
                      training.completed && styles.completedText,
                    ]}
                  >
                    {training.title}
                  </Text>
                  <Text style={styles.trainingDate}>
                    {new Date(training.scheduled_date).toLocaleDateString()} at{' '}
                    {training.scheduled_time}
                  </Text>
                </View>
                <View style={styles.actionIcons}>
                  <TouchableOpacity onPress={() => handleToggleComplete(training)}>
                    <CheckCircle
                      size={20}
                      color={training.completed ? '#10B981' : '#666'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(training.id)}>
                    <Trash2 size={20} color="#E63946" />
                  </TouchableOpacity>
                </View>
              </View>
              {training.description && (
                <Text style={styles.trainingDescription}>{training.description}</Text>
              )}
              {training.notification_enabled && (
                <View style={styles.notificationBadge}>
                  <Bell size={14} color="#2A7DE1" />
                  <Text style={styles.notificationText}>
                    {training.notification_minutes_before}min before
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Schedule Training</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <X size={24} color="#999" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Training session name"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add details about this training"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color="#FFF" />
              <Text style={styles.dateButtonText}>
                {selectedDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) setSelectedDate(date);
                }}
              />
            )}

            <Text style={styles.label}>Time</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Clock size={20} color="#FFF" />
              <Text style={styles.dateButtonText}>
                {selectedTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="default"
                onChange={(event, time) => {
                  setShowTimePicker(Platform.OS === 'ios');
                  if (time) setSelectedTime(time);
                }}
              />
            )}

            <View style={styles.notificationSection}>
              <TouchableOpacity
                style={styles.notificationToggle}
                onPress={() => setNotificationEnabled(!notificationEnabled)}
              >
                {notificationEnabled ? (
                  <Bell size={20} color="#2A7DE1" />
                ) : (
                  <BellOff size={20} color="#666" />
                )}
                <Text style={styles.notificationLabel}>Enable Notification</Text>
              </TouchableOpacity>

              {notificationEnabled && (
                <View>
                  <Text style={styles.label}>Notify me (minutes before)</Text>
                  <TextInput
                    style={styles.input}
                    value={minutesBefore}
                    onChangeText={setMinutesBefore}
                    placeholder="30"
                    placeholderTextColor="#666"
                    keyboardType="number-pad"
                  />
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Schedule Training</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#E63946',
    borderRadius: 12,
    padding: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  trainingCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  trainingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  trainingInfo: {
    flex: 1,
  },
  trainingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  trainingDate: {
    fontSize: 14,
    color: '#999',
  },
  trainingDescription: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 8,
  },
  actionIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2A7DE144',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  notificationText: {
    fontSize: 12,
    color: '#2A7DE1',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFF',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#FFF',
  },
  notificationSection: {
    marginTop: 16,
  },
  notificationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  notificationLabel: {
    fontSize: 16,
    color: '#FFF',
  },
  saveButton: {
    backgroundColor: '#E63946',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
