import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  is_premium: boolean;
  is_test_user: boolean;
  weight_unit: 'lbs' | 'kg';
  created_at: string;
  updated_at: string;
  avatar_url?: string;
};

export type Workout = {
  id: string;
  user_id: string;
  workout_type: string;
  duration_minutes: number;
  intensity: number;
  notes?: string;
  cycle_id?: string | null;
  created_at: string;
};

export type Exercise = {
  id: string;
  workout_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  weight_unit: 'kg' | 'lbs';
  notes?: string;
};

export type Goal = {
  id: string;
  user_id: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  deadline?: string | null;
  is_completed: boolean;
  notes?: string | null;
  created_at: string;
};

export type StrengthTest = {
  id: string;
  user_id: string;
  test_type: string;
  result_value: number;
  result_unit: 'kg' | 'lbs';
  notes?: string;
  created_at: string;
};

export type Cycle = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  cycle_type: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
};

export type ScheduledTraining = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  scheduled_date: string;
  scheduled_time: string;
  notification_enabled: boolean;
  notification_minutes_before: number;
  notification_id: string | null;
  completed: boolean;
  created_at: string;
};

export type BodyMeasurement = {
  id: string;
  user_id: string;
  weight?: number;
  weight_unit: 'kg' | 'lbs';
  arm_circumference?: number;
  forearm_circumference?: number;
  wrist_circumference?: number;
  notes?: string;
  measured_at: string;
  created_at: string;
};
